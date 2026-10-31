import { migrations } from './migrations.generated.js';
// Only called after the administrator's password has been verified.
// Statements and the migration marker commit atomically, without replacing rows.
export async function initializeDatabase(db) {
 await db.prepare('CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE,applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)').run();
 for (const migration of migrations) {
  if (await db.prepare('SELECT id FROM d1_migrations WHERE name=?').bind(migration.name).first()) continue;
  const columns = migration.name === '0002_reservation_tracking.sql' ? (await db.prepare('PRAGMA table_info(order_items)').all()).results.map(column => column.name) : [];
  const statements = migration.statements.flatMap(original => {
   if (/^ALTER TABLE order_items ADD COLUMN stock_reserved/i.test(original) && columns.includes('stock_reserved')) return [];
   return [original
    .replace(/^CREATE TABLE (?!IF NOT EXISTS)/i, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/^CREATE INDEX (?!IF NOT EXISTS)/i, 'CREATE INDEX IF NOT EXISTS ')
    .replace(/^CREATE TRIGGER (?!IF NOT EXISTS)/i, 'CREATE TRIGGER IF NOT EXISTS ')
    .replace(/^DROP TRIGGER (?!IF EXISTS)/i, 'DROP TRIGGER IF EXISTS ')
    .replace(/^INSERT INTO (products|settings)\b/i, 'INSERT OR IGNORE INTO $1')];
  });
  try {
   await db.batch([...statements.map(statement => db.prepare(statement)),db.prepare('INSERT OR IGNORE INTO d1_migrations(name) VALUES(?)').bind(migration.name)]);
  } catch (error) {
   // A concurrent first login may already have committed this entire migration.
   if (!await db.prepare('SELECT id FROM d1_migrations WHERE name=?').bind(migration.name).first()) throw error;
  }
 }
}
export function missingSchema(error) {
 return /no such table|no such column/i.test(String(error?.message || ''));
}
export async function databaseReady(db) {
 try {
  const names=migrations.map(migration=>migration.name);
  const row=await db.prepare(`SELECT COUNT(*) AS count FROM d1_migrations WHERE name IN (${names.map(()=>'?').join(',')})`).bind(...names).first();
  return row.count===names.length;
 } catch(error) { if(missingSchema(error))return false;throw error; }
}
