import { getDb } from "../db/connection";

export interface Reserva {
  id: number;
  usuario_id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "activa" | "cancelada" | "completada";
  creada_en: string;
}

export interface ReservaConCancha extends Reserva {
  cancha_nombre: string;
}

/** Se lanza cuando el usuario ya tiene una reserva activa (FR-015, global). */
export class ReservaActivaExistenteError extends Error {
  constructor() {
    super("Ya tienes una reserva activa. Cancélala antes de crear una nueva.");
    this.name = "ReservaActivaExistenteError";
  }
}

/** Se lanza cuando el bloque solicitado ya no está disponible (FR-011). */
export class BloqueNoDisponibleError extends Error {
  constructor() {
    super("Este horario ya no está disponible.");
    this.name = "BloqueNoDisponibleError";
  }
}

/** Bloques (`hora_inicio`) con una reserva activa para una cancha+fecha. */
export function findBloquesReservados(canchaId: number, fecha: string): Set<string> {
  const db = getDb();
  const filas = db
    .prepare(
      "SELECT hora_inicio FROM reservas WHERE cancha_id = ? AND fecha = ? AND estado = 'activa'",
    )
    .all(canchaId, fecha) as { hora_inicio: string }[];
  return new Set(filas.map((f) => f.hora_inicio));
}

export function findReservaActivaByUsuario(usuarioId: number): Reserva | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM reservas WHERE usuario_id = ? AND estado = 'activa'")
    .get(usuarioId) as Reserva | undefined;
}

export function findReservaById(id: number): Reserva | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as
    | Reserva
    | undefined;
}

export function findReservasByUsuario(usuarioId: number): ReservaConCancha[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT r.*, c.nombre AS cancha_nombre
       FROM reservas r
       JOIN canchas c ON c.id = r.cancha_id
       WHERE r.usuario_id = ?
       ORDER BY r.fecha DESC, r.hora_inicio DESC`,
    )
    .all(usuarioId) as ReservaConCancha[];
}

/**
 * Inserta una reserva dentro de una única transacción `BEGIN IMMEDIATE`
 * (Principio II, NON-NEGOTIABLE): adquiere el lock de escritura antes de
 * revalidar, eliminando la ventana de carrera entre "leer disponibilidad" y
 * "escribir reserva". Revalida, en este orden: (1) que el usuario no tenga
 * ya una reserva activa (FR-015), (2) que el bloque siga libre (FR-010,
 * FR-011). El índice único parcial `ux_reservas_bloque_activo` actúa como
 * respaldo adicional a nivel de esquema ante cualquier condición residual.
 */
export function insertReservaAtomic(
  usuarioId: number,
  canchaId: number,
  fecha: string,
  horaInicio: string,
  horaFin: string,
): Reserva {
  const db = getDb();

  const ejecutarInsercion = db.transaction(() => {
    const reservaActiva = findReservaActivaByUsuario(usuarioId);
    if (reservaActiva) {
      throw new ReservaActivaExistenteError();
    }

    const bloqueOcupado = db
      .prepare(
        "SELECT id FROM reservas WHERE cancha_id = ? AND fecha = ? AND hora_inicio = ? AND estado = 'activa'",
      )
      .get(canchaId, fecha, horaInicio);
    if (bloqueOcupado) {
      throw new BloqueNoDisponibleError();
    }

    const info = db
      .prepare(
        `INSERT INTO reservas (usuario_id, cancha_id, fecha, hora_inicio, hora_fin, estado)
         VALUES (?, ?, ?, ?, ?, 'activa')`,
      )
      .run(usuarioId, canchaId, fecha, horaInicio, horaFin);

    return info.lastInsertRowid as number;
  });

  try {
    const id = ejecutarInsercion.immediate();
    return findReservaById(Number(id)) as Reserva;
  } catch (err) {
    // Respaldo: si dos transacciones IMMEDIATE se serializan y la segunda
    // llega a insertar tras la primera, el índice único parcial rechaza el
    // INSERT con un error de restricción — se traduce al mismo error de
    // dominio que la revalidación explícita de arriba.
    if (
      err instanceof Error &&
      err.name === "SqliteError" &&
      /UNIQUE constraint failed/.test(err.message)
    ) {
      throw new BloqueNoDisponibleError();
    }
    throw err;
  }
}

/**
 * Marca una reserva como cancelada. No valida pertenencia ni estado
 * temporal — esas reglas viven en reservaService (FR-017 a FR-019).
 */
export function cancelarReservaPorId(id: number): void {
  const db = getDb();
  db.prepare("UPDATE reservas SET estado = 'cancelada' WHERE id = ?").run(id);
}
