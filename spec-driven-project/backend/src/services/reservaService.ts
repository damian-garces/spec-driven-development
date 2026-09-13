import { AppError } from "../middleware/errorHandler";
import { findCanchaById } from "../models/canchas";
import {
  BloqueNoDisponibleError,
  ReservaActivaExistenteError,
  cancelarReservaPorId,
  findReservaById,
  findReservasByUsuario,
  insertReservaAtomic,
  type Reserva,
  type ReservaConCancha,
} from "../models/reservas";
import {
  bloqueYaFinalizo,
  bloqueYaPaso,
  esFechaValida,
  esHoraInicioValida,
  horaFinDeBloque,
} from "./horarios";

export interface ReservaRespuesta {
  id: number;
  canchaId: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: Reserva["estado"];
}

/**
 * Confirma una reserva (FR-009 a FR-015). Valida forma del bloque y que no
 * sea pasado antes de tocar la base de datos; la revalidación anti-colisión
 * y el límite de una reserva activa ocurren dentro de la transacción
 * atómica de `insertReservaAtomic` (Principio II).
 */
export function crearReserva(
  usuarioId: number,
  canchaId: number,
  fecha: unknown,
  horaInicio: unknown,
): ReservaRespuesta {
  const cancha = findCanchaById(canchaId);
  if (!cancha) {
    throw new AppError(404, "La cancha solicitada no existe.");
  }

  if (!esFechaValida(fecha) || !esHoraInicioValida(horaInicio)) {
    throw new AppError(400, "El bloque horario seleccionado no es válido.");
  }

  if (bloqueYaPaso(fecha, horaInicio)) {
    throw new AppError(400, "El bloque horario seleccionado no es válido.");
  }

  const horaFin = horaFinDeBloque(horaInicio);

  try {
    const reserva = insertReservaAtomic(usuarioId, canchaId, fecha, horaInicio, horaFin);
    return {
      id: reserva.id,
      canchaId: cancha.id,
      canchaNombre: cancha.nombre,
      fecha: reserva.fecha,
      horaInicio: reserva.hora_inicio,
      horaFin: reserva.hora_fin,
      estado: reserva.estado,
    };
  } catch (err) {
    if (err instanceof BloqueNoDisponibleError || err instanceof ReservaActivaExistenteError) {
      throw new AppError(409, err.message);
    }
    throw err;
  }
}

export interface ReservaHistorialItem {
  id: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "activa" | "cancelada" | "completada";
}

export interface MisReservas {
  futuras: ReservaHistorialItem[];
  historial: ReservaHistorialItem[];
}

function estadoEfectivo(reserva: ReservaConCancha): ReservaHistorialItem["estado"] {
  if (reserva.estado === "activa" && bloqueYaFinalizo(reserva.fecha, reserva.hora_fin)) {
    return "completada";
  }
  return reserva.estado;
}

function aItemHistorial(reserva: ReservaConCancha): ReservaHistorialItem {
  return {
    id: reserva.id,
    canchaNombre: reserva.cancha_nombre,
    fecha: reserva.fecha,
    horaInicio: reserva.hora_inicio,
    horaFin: reserva.hora_fin,
    estado: estadoEfectivo(reserva),
  };
}

/**
 * Panel "Mis Reservas" (FR-016): separa futuras (activas, aún no
 * transcurridas) de historial (completadas + canceladas). El estado
 * "completada" es una proyección derivada en el momento de la consulta
 * (ver data-model.md), no una escritura programada.
 */
export function obtenerMisReservas(usuarioId: number): MisReservas {
  const todas = findReservasByUsuario(usuarioId).map(aItemHistorial);

  return {
    futuras: todas.filter((r) => r.estado === "activa"),
    historial: todas.filter((r) => r.estado !== "activa"),
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
export function cancelarReserva(
  usuarioId: number,
  reservaId: number,
): { id: number; estado: "cancelada" } {
  const reserva = findReservaById(reservaId);
  if (!reserva) {
    throw new AppError(404, "La reserva solicitada no existe.");
  }

  if (reserva.usuario_id !== usuarioId) {
    throw new AppError(403, "No puedes modificar una reserva de otro usuario.");
  }

  if (reserva.estado !== "activa" || bloqueYaFinalizo(reserva.fecha, reserva.hora_fin)) {
    throw new AppError(409, "No se puede cancelar una reserva que ya pasó.");
  }

  cancelarReservaPorId(reservaId);

  return { id: reserva.id, estado: "cancelada" };
}
