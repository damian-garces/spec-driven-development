import { AppError } from "../middleware/errorHandler";
import { findCourtById } from "../models/courts";
import { findReservedBlocks } from "../models/reservations";
import { OPERATING_BLOCKS, hasBlockStarted, isPastDate, isValidDate, blockEndTime } from "./schedule";

export interface AvailabilityBlock {
  startTime: string;
  endTime: string;
  status: "disponible" | "reservado";
}

export interface Availability {
  courtId: number;
  date: string;
  blocks: AvailabilityBlock[];
}

/**
 * Construye la grilla de bloques horarios operativos (07:00 a 22:00) para
 * una cancha+fecha (FR-007, FR-008), marcando cada uno como "disponible" o
 * "reservado". Para `date` igual a hoy, excluye los bloques cuya
 * `startTime` ya transcurrió (FR-021, arreglo de longitud variable); para
 * `date` futura siempre devuelve los 15 bloques completos — ver
 * research.md §5.
 */
export function getAvailability(courtId: number, date: unknown, now: Date = new Date()): Availability {
  const court = findCourtById(courtId);
  if (!court) {
    throw new AppError(404, "La cancha solicitada no existe.");
  }

  if (!isValidDate(date)) {
    throw new AppError(400, "La fecha indicada no es válida.");
  }

  if (isPastDate(date, now)) {
    throw new AppError(400, "La fecha indicada ya pasó.");
  }

  const reservedBlocks = findReservedBlocks(courtId, date);

  const blocks: AvailabilityBlock[] = OPERATING_BLOCKS.filter(
    (startTime) => !hasBlockStarted(date, startTime, now),
  ).map((startTime) => ({
    startTime,
    endTime: blockEndTime(startTime),
    status: reservedBlocks.has(startTime) ? "reservado" : "disponible",
  }));

  return { courtId, date, blocks };
}
