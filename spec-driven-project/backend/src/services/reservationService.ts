import { AppError } from "../middleware/errorHandler";
import { findCourtById } from "../models/courts";
import {
  BlockUnavailableError,
  ActiveReservationExistsError,
  cancelReservationById,
  findReservationById,
  findReservationsByUser,
  insertReservationAtomic,
  type Reservation,
  type ReservationWithCourt,
} from "../models/reservations";
import {
  hasBlockEnded,
  hasBlockStarted,
  isValidDate,
  isValidStartTime,
  blockEndTime,
} from "./schedule";

export interface ReservationResponse {
  id: number;
  courtId: number;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: Reservation["status"];
}

/**
 * Confirma una reserva (FR-009 a FR-015). Valida forma del bloque y que no
 * sea pasado antes de tocar la base de datos; la revalidación anti-colisión
 * y el límite de una reserva activa ocurren dentro de la transacción
 * atómica de `insertReservationAtomic` (Principio II).
 */
export function createReservation(
  userId: number,
  courtId: number,
  date: unknown,
  startTime: unknown,
): ReservationResponse {
  const court = findCourtById(courtId);
  if (!court) {
    throw new AppError(404, "La cancha solicitada no existe.");
  }

  if (!isValidDate(date) || !isValidStartTime(startTime)) {
    throw new AppError(400, "El bloque horario seleccionado no es válido.");
  }

  if (hasBlockStarted(date, startTime)) {
    throw new AppError(400, "El bloque horario seleccionado no es válido.");
  }

  const endTime = blockEndTime(startTime);

  try {
    const reservation = insertReservationAtomic(userId, courtId, date, startTime, endTime);
    return {
      id: reservation.id,
      courtId: court.id,
      courtName: court.name,
      date: reservation.date,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      status: reservation.status,
    };
  } catch (err) {
    if (err instanceof BlockUnavailableError || err instanceof ActiveReservationExistsError) {
      throw new AppError(409, err.message);
    }
    throw err;
  }
}

export interface ReservationHistoryItem {
  id: number;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "activa" | "cancelada" | "completada";
}

export interface MyReservations {
  upcoming: ReservationHistoryItem[];
  history: ReservationHistoryItem[];
}

function effectiveStatus(reservation: ReservationWithCourt): ReservationHistoryItem["status"] {
  if (reservation.status === "activa" && hasBlockEnded(reservation.date, reservation.end_time)) {
    return "completada";
  }
  return reservation.status;
}

function toHistoryItem(reservation: ReservationWithCourt): ReservationHistoryItem {
  return {
    id: reservation.id,
    courtName: reservation.court_name,
    date: reservation.date,
    startTime: reservation.start_time,
    endTime: reservation.end_time,
    status: effectiveStatus(reservation),
  };
}

/**
 * Panel "Mis Reservas" (FR-016): separa futuras (activas, aún no
 * transcurridas) de historial (completadas + canceladas). El estado
 * "completada" es una proyección derivada en el momento de la consulta
 * (ver data-model.md), no una escritura programada.
 */
export function getMyReservations(userId: number): MyReservations {
  const all = findReservationsByUser(userId).map(toHistoryItem);

  return {
    upcoming: all.filter((r) => r.status === "activa"),
    history: all.filter((r) => r.status !== "activa"),
  };
}

/**
 * Cancela una reserva futura propia (FR-017 a FR-019). Rechaza con 403 si
 * la reserva no pertenece al usuario (aislamiento entre usuarios) y con 409
 * si su estado efectivo ya es "completada" (FR-018). Al cancelar, el bloque
 * queda libre de inmediato (el índice único parcial solo protege filas
 * 'activa', así que dejar de estar 'activa' ya libera el bloque) y la
 * reserva permanece visible en el historial con su fecha/hora original
 * (FR-019).
 */
export function cancelReservation(
  userId: number,
  reservationId: number,
): { id: number; status: "cancelada" } {
  const reservation = findReservationById(reservationId);
  if (!reservation) {
    throw new AppError(404, "La reserva solicitada no existe.");
  }

  if (reservation.user_id !== userId) {
    throw new AppError(403, "No puedes modificar una reserva de otro usuario.");
  }

  if (reservation.status !== "activa" || hasBlockEnded(reservation.date, reservation.end_time)) {
    throw new AppError(409, "No se puede cancelar una reserva que ya pasó.");
  }

  cancelReservationById(reservationId);

  return { id: reservation.id, status: "cancelada" };
}
