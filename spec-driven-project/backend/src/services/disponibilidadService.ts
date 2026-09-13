import { AppError } from "../middleware/errorHandler";
import { findCanchaById } from "../models/canchas";
import { findBloquesReservados } from "../models/reservas";
import { BLOQUES_DIA, esFechaValida } from "./horarios";

export interface BloqueDisponibilidad {
  horaInicio: string;
  horaFin: string;
  estado: "disponible" | "reservado";
}

export interface Disponibilidad {
  canchaId: number;
  fecha: string;
  bloques: BloqueDisponibilidad[];
}

/**
 * Construye la grilla de 24 bloques horarios para una cancha+fecha (FR-007,
 * FR-008), marcando cada uno como "disponible" o "reservado".
 */
export function obtenerDisponibilidad(canchaId: number, fecha: unknown): Disponibilidad {
  const cancha = findCanchaById(canchaId);
  if (!cancha) {
    throw new AppError(404, "La cancha solicitada no existe.");
  }

  if (!esFechaValida(fecha)) {
    throw new AppError(400, "La fecha indicada no es válida.");
  }

  const bloquesReservados = findBloquesReservados(canchaId, fecha);

  const bloques: BloqueDisponibilidad[] = BLOQUES_DIA.map((horaInicio, i) => ({
    horaInicio,
    horaFin: BLOQUES_DIA[(i + 1) % 24],
    estado: bloquesReservados.has(horaInicio) ? "reservado" : "disponible",
  }));

  return { canchaId, fecha, bloques };
}
