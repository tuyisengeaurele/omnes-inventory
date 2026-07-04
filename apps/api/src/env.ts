import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

// the .env lives at the repo root, but this process starts inside apps/api,
// so check both places before giving up
const candidates = [path.resolve('.env'), path.resolve('../../.env')];
const envFile = candidates.find((p) => existsSync(p));
dotenv.config(envFile ? { path: envFile } : undefined);

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing env variable ${name}, check .env against .env.example`);
  return value;
}

// "15m" or "7d" to seconds, only the units we actually use
function ttlSeconds(raw: string): number {
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) throw new Error(`cannot parse ttl "${raw}", use forms like 15m or 7d`);
  const n = Number(match[1]);
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return n * unit;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  port: Number(process.env.API_PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTtlSeconds: ttlSeconds(process.env.JWT_ACCESS_TTL ?? '15m'),
  refreshTtlSeconds: ttlSeconds(process.env.JWT_REFRESH_TTL ?? '7d'),
  webUrl: process.env.VITE_APP_URL ?? 'http://localhost:5173',
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? './uploads'),
  mail: {
    transport: process.env.SMTP_TRANSPORT ?? 'console',
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    from: process.env.MAIL_FROM ?? 'no-reply@omnes.local',
  },
};
