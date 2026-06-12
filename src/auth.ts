import crypto from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from './db.js';

// ---------------------------------------------------------------------------
// Password hashing (scrypt, no external deps)
// ---------------------------------------------------------------------------

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, useSalt, 64).toString('hex');
  return { hash: derived, salt: useSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function randomPassword() {
  // Human-shareable temporary password.
  return crypto.randomBytes(9).toString('base64url');
}

// Domain-agnostic admin rule: any email containing this substring is an admin.
// Configurable via ADMIN_EMAIL_MATCH (default "asmalouski"). Empty disables it.
function adminEmailMatch() {
  return (process.env.ADMIN_EMAIL_MATCH ?? 'asmalouski').toLowerCase().trim();
}

export function isAdminEmail(email: string): boolean {
  const match = adminEmailMatch();
  if (!match) return false;
  return String(email || '').toLowerCase().includes(match);
}

const SESSION_COOKIE = 'ka_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// ---------------------------------------------------------------------------
// Cookie helpers (no cookie plugin needed)
// ---------------------------------------------------------------------------

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setSessionCookie(reply: FastifyReply, token: string) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  reply.header(
    'set-cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  );
}

function clearSessionCookie(reply: FastifyReply) {
  reply.header('set-cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function publicUser(u: { id: string; email: string; name: string; role: string }): AuthedUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

// ---------------------------------------------------------------------------
// Session resolution + guards
// ---------------------------------------------------------------------------

export async function resolveUser(req: FastifyRequest): Promise<AuthedUser | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const session = await prisma.appSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.appSession.delete({ where: { token } }).catch(() => {});
    return null;
  }
  if (!session.user || !session.user.isActive) return null;
  return publicUser(session.user);
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<AuthedUser | null> {
  const user = await resolveUser(req);
  if (!user) {
    reply.code(401).send({ error: 'Authentication required' });
    return null;
  }
  return user;
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<AuthedUser | null> {
  const user = await resolveUser(req);
  if (!user) {
    reply.code(401).send({ error: 'Authentication required' });
    return null;
  }
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'Admin access required' });
    return null;
  }
  return user;
}

// ---------------------------------------------------------------------------
// Default admin seeding
// ---------------------------------------------------------------------------

export async function seedDefaultAdmin() {
  // Domain is irrelevant — only the "asmalouski" substring matters for admin rights.
  const email = (process.env.ADMIN_EMAIL || 'a.asmalouski@sociala.com').toLowerCase().trim();
  const name = process.env.ADMIN_NAME || 'Aleh Asmalouski';
  const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const insecureDefaults = new Set(['', 'shiptify-admin', 'admin12345', 'change-me']);
  const password = insecureDefaults.has(configuredPassword) ? randomPassword() : configuredPassword;

  const existing = await prisma.appUser.findUnique({ where: { email } });
  if (existing) {
    // Keep the existing admin record; just make sure it stays an active admin.
    if (existing.role !== 'admin' || !existing.isActive) {
      await prisma.appUser.update({
        where: { id: existing.id },
        data: { role: 'admin', isActive: true },
      });
    }
    return { created: false, email };
  }

  const { hash, salt } = hashPassword(password);
  await prisma.appUser.create({
    data: { email, name, role: 'admin', passwordHash: hash, passwordSalt: salt },
  });
  if (insecureDefaults.has(configuredPassword)) {
    // eslint-disable-next-line no-console
    console.warn('[auth] ADMIN_PASSWORD missing or unsafe; generated a random seed password for the default admin.');
  }
  // eslint-disable-next-line no-console
  console.log(`[auth] Seeded default admin: ${email} (password: ${password})`);
  return { created: true, email };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function registerAuthApi(app: FastifyInstance) {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  app.post('/api/auth/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid email or password' });

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user || !user.isActive || !verifyPassword(parsed.data.password, user.passwordHash, user.passwordSalt)) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    // Domain-agnostic auto-promotion: an "asmalouski" email is always an admin.
    if (isAdminEmail(user.email) && user.role !== 'admin') {
      await prisma.appUser.update({ where: { id: user.id }, data: { role: 'admin' } });
      user.role = 'admin';
    }

    const token = randomToken();
    await prisma.appSession.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 250) || undefined,
      },
    });
    await prisma.appUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    setSessionCookie(reply, token);
    return reply.send({ user: publicUser(user) });
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) {
      await prisma.appSession.deleteMany({ where: { token } }).catch(() => {});
    }
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  app.get('/api/auth/me', async (req, reply) => {
    const user = await resolveUser(req);
    if (!user) return reply.code(401).send({ error: 'Not authenticated' });
    return reply.send({ user });
  });

  // --- Admin: user management ---

  const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(200),
    role: z.enum(['user', 'admin']).default('user'),
    password: z.string().min(6).max(200).optional(),
  });

  app.post('/api/admin/users', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) return reply.code(409).send({ error: 'A user with this email already exists' });

    const tempPassword = parsed.data.password || randomPassword();
    const { hash, salt } = hashPassword(tempPassword);
    const inviteToken = randomToken(18);

    // An admin can create both users and admins; an "asmalouski" email is
    // always an admin regardless of the chosen role.
    const role = isAdminEmail(email) ? 'admin' : parsed.data.role;

    const user = await prisma.appUser.create({
      data: {
        email,
        name: parsed.data.name,
        role,
        passwordHash: hash,
        passwordSalt: salt,
        mustReset: true,
        inviteToken,
      },
    });

    // The access link / invite info the admin can forward to the new user.
    const proto = String(req.headers['x-forwarded-proto'] || 'http');
    const host = String(req.headers.host || `localhost`);
    const accessLink = `${proto}://${host}/login?email=${encodeURIComponent(email)}`;

    return reply.code(201).send({
      user: publicUser(user),
      access: {
        email,
        tempPassword,
        inviteToken,
        accessLink,
        message: `Login at ${accessLink} with the temporary password and change it after first sign-in.`,
      },
    });
  });

  app.get('/api/admin/users', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const users = await prisma.appUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustReset: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { queries: true } },
      },
    });

    return reply.send({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        mustReset: u.mustReset,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        queryCount: u._count.queries,
      })),
    });
  });

  const updateUserSchema = z.object({
    role: z.enum(['user', 'admin']).optional(),
    isActive: z.boolean().optional(),
    resetPassword: z.boolean().optional(),
  });

  app.patch('/api/admin/users/:id', async (req: any, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const target = await prisma.appUser.findUnique({ where: { id: String(req.params.id) } });
    if (!target) return reply.code(404).send({ error: 'User not found' });

    const data: any = {};
    if (parsed.data.role) data.role = parsed.data.role;
    if (typeof parsed.data.isActive === 'boolean') data.isActive = parsed.data.isActive;

    let newPassword: string | undefined;
    if (parsed.data.resetPassword) {
      newPassword = randomPassword();
      const { hash, salt } = hashPassword(newPassword);
      data.passwordHash = hash;
      data.passwordSalt = salt;
      data.mustReset = true;
    }

    const updated = await prisma.appUser.update({ where: { id: target.id }, data });
    return reply.send({ user: publicUser(updated), newPassword });
  });

  // --- Self-service password change ---
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).max(200),
  });

  app.post('/api/auth/change-password', async (req, reply) => {
    const me = await requireAuth(req, reply);
    if (!me) return;

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const user = await prisma.appUser.findUnique({ where: { id: me.id } });
    if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash, user.passwordSalt)) {
      return reply.code(401).send({ error: 'Current password is incorrect' });
    }

    const { hash, salt } = hashPassword(parsed.data.newPassword);
    await prisma.appUser.update({
      where: { id: user.id },
      data: { passwordHash: hash, passwordSalt: salt, mustReset: false },
    });
    return reply.send({ ok: true });
  });
}
