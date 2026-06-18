import { Client as MinioClient } from 'minio';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

// Объектное хранилище (MinIO/S3) для загруженных к вопросу изображений.
// Никогда не роняет приложение: при недоступности MinIO загрузка вернёт ошибку,
// а остальной функционал (текстовые вопросы) продолжает работать.

let _client: MinioClient | null = null;
let _ready = false;

function client(): MinioClient {
  if (!_client) {
    _client = new MinioClient({
      endPoint: config.storage.endpoint,
      port: config.storage.port,
      useSSL: config.storage.useSSL,
      accessKey: config.storage.accessKey,
      secretKey: config.storage.secretKey,
    });
  }
  return _client;
}

export async function ensureBucket(log: (m: string) => void = () => {}): Promise<boolean> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let lastErr = '';
  for (let attempt = 1; attempt <= 6; attempt++) { // ретраи: minio может стартовать чуть позже app
    try {
      const c = client();
      const exists = await c.bucketExists(config.storage.bucket).catch(() => false);
      if (!exists) await c.makeBucket(config.storage.bucket);
      _ready = true;
      log(`object storage ready: bucket "${config.storage.bucket}" @ ${config.storage.endpoint}:${config.storage.port}`);
      return true;
    } catch (e: any) {
      lastErr = String(e?.message || e).slice(0, 120);
      _client = null; // пересоздать клиент на следующей попытке
      await sleep(2500);
    }
  }
  _ready = false;
  log(`object storage unavailable (${lastErr}) — image upload disabled`);
  return false;
}

export function storageReady(): boolean { return _ready; }

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const extByMime: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

// Сохранить изображение, вернуть ключ объекта.
export async function putImage(buffer: Buffer, mime: string, userId?: string): Promise<{ key: string; mime: string }> {
  if (!ALLOWED.has(mime)) throw new Error(`Unsupported image type: ${mime}`);
  const ext = extByMime[mime] || 'bin';
  const day = new Date().toISOString().slice(0, 10);
  const key = `questions/${day}/${userId || 'anon'}/${randomUUID()}.${ext}`;
  await client().putObject(config.storage.bucket, key, buffer, buffer.length, { 'Content-Type': mime });
  return { key, mime };
}

// Прочитать изображение по ключу (для vision-анализа).
export async function getImage(key: string): Promise<{ buffer: Buffer; mime: string }> {
  const stream = await client().getObject(config.storage.bucket, key);
  const stat = await client().statObject(config.storage.bucket, key).catch(() => null);
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('end', () => resolve());
    stream.on('error', reject);
  });
  return { buffer: Buffer.concat(chunks), mime: (stat?.metaData?.['content-type'] as string) || 'image/png' };
}

// Временная ссылка на просмотр (для UI/Истории).
export async function presignedUrl(key: string, expirySec = 3600): Promise<string> {
  return client().presignedGetObject(config.storage.bucket, key, expirySec);
}
