import { getDb } from "../db/connection";

export interface Court {
  id: number;
  name: string;
}

/** Lista las 5 canchas del catálogo fijo, siempre en el mismo orden (por id). */
export function listCourts(): Court[] {
  const db = getDb();
  return db.prepare("SELECT * FROM courts ORDER BY id").all() as Court[];
}

export function findCourtById(id: number): Court | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM courts WHERE id = ?").get(id) as
    | Court
    | undefined;
}
