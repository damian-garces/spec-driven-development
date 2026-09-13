import { AppError } from "../middleware/errorHandler";
import { findCanchaById } from "../models/canchas";
import { findBloquesReservados } from "../models/reservas";
import { BLOQUES_DIA, bloqueYaPaso, esFechaPasada, esFechaValida, horaFinDeBloque } from "./horarios";

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
 * Construye la grilla de bloques horarios operativos (07:00 a 22:00) para
 * una cancha+fecha (FR-007, FR-008), marcando cada uno como "disponible" o
 * "reservado". Para `fecha` igual a hoy, excluye los bloques cuya
 * `horaInicio` ya transcurrió (FR-021, arreglo de longitud variable); para
 * `fecha` futura siempre devuelve los 15 bloques completos — ver
 * research.md §5.
 */
export function obtenerDisponibilidad(canchaId: number, fecha: unknown, ahora: Date = new Date()): Disponibilidad {
  const cancha = findCanchaById(canchaId);
  if (!cancha) {
    throw new AppError(404, "La cancha solicitada no existe.");
  }

  if (!esFechaValida(fecha)) {
    throw new AppError(400, "La fecha indicada no es válida.");
  }

  if (esFechaPasada(fecha, ahora)) {
    throw new AppError(400, "La fecha indicada ya pasó.");
  }

  const bloquesReservados = findBloquesReservados(canchaId, fecha);

  const bloques: BloqueDisponibilidad[] = BLOQUES_DIA.filter(
    (horaInicio) => !bloqueYaPaso(fecha, horaInicio, ahora),
  ).map((horaInicio) => ({
    horaInicio,
    horaFin: horaFinDeBloque(horaInicio),
    estado: bloquesReservados.has(horaInicio) ? "reservado" : "disponible",
  }));

  return { canchaId, fecha, bloques };
}
