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

export const env = {
  databaseUrl: required('DATABASE_URL'),
  port: Number(process.env.API_PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};
