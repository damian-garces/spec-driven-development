import { getDb } from "../db/connection";

export interface Reservation {
  id: number;
  user_id: number;
  court_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "activa" | "cancelada" | "completada";
  created_at: string;
}

export interface ReservationWithCourt extends Reservation {
  court_name: string;
}

/** Se lanza cuando el usuario ya tiene una reserva activa (FR-015, global). */
export class ActiveReservationExistsError extends Error {
  constructor() {
    super("Ya tienes una reserva activa. Cancélala antes de crear una nueva.");
    this.name = "ActiveReservationExistsError";
  }
}

/** Se lanza cuando el bloque solicitado ya no está disponible (FR-011). */
export class BlockUnavailableError extends Error {
  constructor() {
    super("Este horario ya no está disponible.");
    this.name = "BlockUnavailableError";
  }
}

/** Bloques (`start_time`) con una reserva activa para una cancha+fecha. */
export function findReservedBlocks(courtId: number, date: string): Set<string> {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT start_time FROM reservations WHERE court_id = ? AND date = ? AND status = 'activa'",
    )
    .all(courtId, date) as { start_time: string }[];
  return new Set(rows.map((r) => r.start_time));
}

export function findActiveReservationByUser(userId: number): Reservation | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM reservations WHERE user_id = ? AND status = 'activa'")
    .get(userId) as Reservation | undefined;
}

export function findReservationById(id: number): Reservation | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM reservations WHERE id = ?").get(id) as
    | Reservation
    | undefined;
}

export function findReservationsByUser(userId: number): ReservationWithCourt[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT r.*, c.name AS court_name
       FROM reservations r
       JOIN courts c ON c.id = r.court_id
       WHERE r.user_id = ?
       ORDER BY r.date DESC, r.start_time DESC`,
    )
    .all(userId) as ReservationWithCourt[];
}

/**
 * Inserta una reserva dentro de una única transacción `BEGIN IMMEDIATE`
 * (Principio II, NON-NEGOTIABLE): adquiere el lock de escritura antes de
 * revalidar, eliminando la ventana de carrera entre "leer disponibilidad" y
 * "escribir reserva". Revalida, en este orden: (1) que el usuario no tenga
 * ya una reserva activa (FR-015), (2) que el bloque siga libre (FR-010,
 * FR-011). El índice único parcial `ux_reservations_active_block` actúa
 * como respaldo adicional a nivel de esquema ante cualquier condición
 * residual.
 */
export function insertReservationAtomic(
  userId: number,
  courtId: number,
  date: string,
  startTime: string,
  endTime: string,
): Reservation {
  const db = getDb();

  const runInsert = db.transaction(() => {
    const activeReservation = findActiveReservationByUser(userId);
    if (activeReservation) {
      throw new ActiveReservationExistsError();
    }

    const takenBlock = db
      .prepare(
        "SELECT id FROM reservations WHERE court_id = ? AND date = ? AND start_time = ? AND status = 'activa'",
      )
      .get(courtId, date, startTime);
    if (takenBlock) {
      throw new BlockUnavailableError();
    }

    const info = db
      .prepare(
        `INSERT INTO reservations (user_id, court_id, date, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, 'activa')`,
      )
      .run(userId, courtId, date, startTime, endTime);

    return info.lastInsertRowid as number;
  });

  try {
    const id = runInsert.immediate();
    return findReservationById(Number(id)) as Reservation;
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
      throw new BlockUnavailableError();
    }
    throw err;
  }
}

/**
 * Marca una reserva como cancelada. No valida pertenencia ni estado
 * temporal — esas reglas viven en reservationService (FR-017 a FR-019).
 */
export function cancelReservationById(id: number): void {
  const db = getDb();
  db.prepare("UPDATE reservations SET status = 'cancelada' WHERE id = ?").run(id);
}
