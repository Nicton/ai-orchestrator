/**
 * One-off: create/refresh a technical API user for calibration runs.
 * Password is read from env TPW. Role 'user' (non-admin). Idempotent.
 *   docker exec -e TPW=... <app> node /workspace/scripts/create-tech-user.cjs
 */
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();
const email = process.env.TECH_EMAIL || 'searchify-bot@shiptify.com';
const pw = process.env.TPW;

(async () => {
  if (!pw) { console.log('ERR no TPW'); process.exit(1); }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  const ex = await p.appUser.findUnique({ where: { email } });
  if (ex) {
    await p.appUser.update({ where: { email }, data: { passwordHash: hash, passwordSalt: salt, isActive: true } });
    console.log('UPDATED', email);
  } else {
    await p.appUser.create({ data: { email, name: 'Searchify Bot', role: 'user', passwordHash: hash, passwordSalt: salt, isActive: true } });
    console.log('CREATED', email);
  }
  await p.$disconnect();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
