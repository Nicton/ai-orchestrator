import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

function readFileTrim(p?: string) {
  if (!p) return '';
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

function ensureDatabaseUrl() {
  // Prisma expects DATABASE_URL.
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) return;

  // Support file-based injection.
  const urlFromFile = readFileTrim(process.env.DATABASE_URL_FILE);
  if (urlFromFile) {
    process.env.DATABASE_URL = urlFromFile;
    return;
  }

  const host = (process.env.DB_HOST || '').trim();
  const port = (process.env.DB_PORT || '5432').trim();
  const db = (process.env.DB_NAME || '').trim();
  const user = (process.env.DB_USER || '').trim();
  const password = (process.env.DB_PASSWORD || '').trim() || readFileTrim(process.env.DB_PASSWORD_FILE);

  if (!host || !db || !user) return;

  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  process.env.DATABASE_URL = `postgresql://${auth}@${host}:${port}/${encodeURIComponent(db)}`;
}

ensureDatabaseUrl();

export const prisma = new PrismaClient();
