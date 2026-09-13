import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

// Archivo físico de la base de datos: db/padel.db en la raíz del repo
// (estructura plana exigida por la constitución, ver plan.md).
const DB_PATH = path.resolve(__dirname, "..", "..", "..", "db", "padel.db");
const SCHEMA_PATH = path.resolve(__dirname, "schema.sql");

let dbInstance: Database.Database | null = null;

/**
 * Abre (o reutiliza) la conexión SQLite y aplica schema.sql si las tablas
 * aún no existen. Idempotente: puede llamarse múltiples veces sin efecto
 * secundario adicional.
 */
export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schema);

  dbInstance = db;
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
