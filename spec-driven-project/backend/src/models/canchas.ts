import { getDb } from "../db/connection";

export interface Cancha {
  id: number;
  nombre: string;
}

/** Lista las 5 canchas del catálogo fijo, siempre en el mismo orden (por id). */
export function listCanchas(): Cancha[] {
  const db = getDb();
  return db.prepare("SELECT * FROM canchas ORDER BY id").all() as Cancha[];
}

export function findCanchaById(id: number): Cancha | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM canchas WHERE id = ?").get(id) as
    | Cancha
    | undefined;
}
