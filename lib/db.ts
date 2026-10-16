import postgres from "postgres";
import { seed } from "./seed";

type Row = Record<string, any>;
export type Q = (sql: string, params?: any[]) => Promise<Row[]>;
interface Driver {
  q: Q;
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Q) => Promise<T>): Promise<T>;
}

// `?` placeholders are rewritten to $1, $2... so call sites stay readable.
const num = (sql: string) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };

function pgDriver(url: string): Driver {
  const local = /localhost|127\.0\.0\.1/.test(url);
  const sql = postgres(url, { ssl: local ? false : "require", max: Number(process.env.PG_POOL_MAX) || 3, idle_timeout: 20, prepare: false, onnotice: () => {} });
  return {
    q: async (t, p = []) => [...(await sql.unsafe(num(t), p as any[]))] as Row[],
    exec: async (t) => { await sql.unsafe(t); },
    tx: (fn) => sql.begin(async (tx) => fn(async (t, p = []) => [...(await tx.unsafe(num(t), p as any[]))] as Row[])) as Promise<any>,
  };
}

async function pgliteDriver(): Promise<Driver> {
  // Zero-setup local dev: an embedded Postgres stored in ./data/pg
  const { PGlite } = await import("@electric-sql/pglite");
  (await import("node:fs")).mkdirSync("./data", { recursive: true });
  const db = new PGlite("./data/pg");
  await db.waitReady;
  return {
    q: async (t, p = []) => (await db.query(num(t), p as any[])).rows as Row[],
    exec: async (t) => { await db.exec(t); },
    tx: (fn) => db.transaction((tx) => fn(async (t, p = []) => (await tx.query(num(t), p as any[])).rows as Row[])),
  };
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
    goals TEXT NOT NULL DEFAULT '[]', onboarded INT NOT NULL DEFAULT 0,
    pet_on INT NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS courses(
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
    goals TEXT NOT NULL DEFAULT '[]', position INT NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS lessons(
    id SERIAL PRIMARY KEY, course_id INT NOT NULL, position INT NOT NULL,
    title TEXT NOT NULL, body TEXT NOT NULL, question TEXT NOT NULL,
    options TEXT NOT NULL, answer_idx INT NOT NULL, explanation TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS lens_cache(lesson_id INT, lens TEXT, text TEXT, PRIMARY KEY(lesson_id, lens));
  CREATE TABLE IF NOT EXISTS attempts(
    id SERIAL PRIMARY KEY, user_id INT NOT NULL, lesson_id INT NOT NULL,
    attempt_no INT NOT NULL, correct INT NOT NULL, day TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id);
  CREATE TABLE IF NOT EXISTS flags(key TEXT PRIMARY KEY, enabled INT NOT NULL);
  CREATE TABLE IF NOT EXISTS events(
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, anon_id TEXT NOT NULL, user_id INT,
    props TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS runs(
    id SERIAL PRIMARY KEY, topic TEXT NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL,
    draft TEXT, error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
`;

const g = globalThis as unknown as { __drv?: Promise<Driver> };

async function init(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  const d = url ? pgDriver(url) : await pgliteDriver();
  await d.exec(SCHEMA);
  await seed(d.q);
  return d;
}
const driver = () => (g.__drv ??= init());

export const all = async <T = Row>(sql: string, ...p: any[]) => (await (await driver()).q(sql, p)) as T[];
export const get = async <T = Row>(sql: string, ...p: any[]) => (await all<T>(sql, ...p))[0];
/** For INSERT ... RETURNING id, read `(await run(...))[0].id`. */
export const run = all;
export const tx = async <T>(fn: (q: Q) => Promise<T>) => (await driver()).tx(fn);
