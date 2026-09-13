import { getDb } from "../db/connection";

export interface Usuario {
  id: number;
  correo: string;
  password_hash: string;
  fecha_registro: string;
}

/**
 * Inserta un usuario nuevo. `correo` DEBE llegar ya normalizado a
 * minúsculas (ver authService.registrar) para que la restricción
 * `UNIQUE` de `usuarios.correo` detecte duplicados sin distinguir mayúsculas.
 */
export function insertUsuario(correo: string, passwordHash: string): Usuario {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO usuarios (correo, password_hash) VALUES (?, ?)")
    .run(correo, passwordHash);

  return findUsuarioById(Number(info.lastInsertRowid)) as Usuario;
}

export function findUsuarioByCorreo(correo: string): Usuario | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM usuarios WHERE correo = ?")
    .get(correo.toLowerCase()) as Usuario | undefined;
}

export function findUsuarioById(id: number): Usuario | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id) as
    | Usuario
    | undefined;
}
