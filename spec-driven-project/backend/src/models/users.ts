import { getDb } from "../db/connection";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  registered_at: string;
}

/**
 * Inserta un usuario nuevo. `email` DEBE llegar ya normalizado a
 * minúsculas (ver authService.register) para que la restricción
 * `UNIQUE` de `users.email` detecte duplicados sin distinguir mayúsculas.
 */
export function insertUser(email: string, passwordHash: string): User {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, passwordHash);

  return findUserById(Number(info.lastInsertRowid)) as User;
}

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}
