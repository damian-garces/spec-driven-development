import { getDb } from "./connection";

// Principio I (NON-NEGOTIABLE): catálogo cerrado e inmutable de 5 canchas.
// Este array es la única fuente del catálogo; no existe endpoint de API
// para crear, editar o eliminar canchas.
const FIXED_COURTS = [
  "Cancha Laureles",
  "Cancha El Poblado",
  "Cancha Belén",
  "Cancha Robledo",
  "Cancha Envigado",
];

/**
 * Inserta las 5 canchas fijas si la tabla está vacía. Idempotente: si ya
 * existen filas en `courts`, no hace nada (evita duplicados en reinicios
 * sucesivos del servidor).
 */
export function seedCourts(): void {
  const db = getDb();

  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM courts")
    .get() as { total: number };

  if (total > 0) {
    return;
  }

  const insert = db.prepare("INSERT INTO courts (name) VALUES (?)");
  const insertAll = db.transaction((names: string[]) => {
    for (const name of names) {
      insert.run(name);
    }
  });

  insertAll(FIXED_COURTS);
}
