import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { loadConfig } from './config.js';

export async function runMigrations({ pool, directory = resolve(dirname(fileURLToPath(import.meta.url)), '../db/migrations') }) {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('habbit_quest_schema_migrations'))");
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
    for (const name of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (applied.rowCount) continue;
      const sql = await readFile(resolve(directory, name), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('habbit_quest_schema_migrations'))").catch(() => {});
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required for migrations');
  const pool = new Pool({ connectionString: config.databaseUrl, ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : false });
  runMigrations({ pool }).finally(() => pool.end());
}
