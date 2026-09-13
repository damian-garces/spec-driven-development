import { getDb } from "./connection";

// Principio I (NON-NEGOTIABLE): catálogo cerrado e inmutable de 5 canchas.
// Este array es la única fuente del catálogo; no existe endpoint de API
// para crear, editar o eliminar canchas.
const CANCHAS_FIJAS = [
  "Cancha Laureles",
  "Cancha El Poblado",
  "Cancha Belén",
  "Cancha Robledo",
  "Cancha Envigado",
];

/**
 * Inserta las 5 canchas fijas si la tabla está vacía. Idempotente: si ya
 * existen filas en `canchas`, no hace nada (evita duplicados en reinicios
 * sucesivos del servidor).
 */
export function seedCanchas(): void {
  const db = getDb();

  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM canchas")
    .get() as { total: number };

  if (total > 0) {
    return;
  }

  const insertar = db.prepare("INSERT INTO canchas (nombre) VALUES (?)");
  const insertarTodas = db.transaction((nombres: string[]) => {
    for (const nombre of nombres) {
      insertar.run(nombre);
    }
  });

  insertarTodas(CANCHAS_FIJAS);
}
