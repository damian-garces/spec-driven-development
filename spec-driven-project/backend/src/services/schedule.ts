// Utilidades de fecha/hora compartidas por availabilityService y
// reservationService. Ver research.md §4: fechas y horas se comparan como
// cadenas `YYYY-MM-DD` / `HH:00`, sin aritmética de husos horarios.

/**
 * Los 15 bloques horarios operativos de un día, en formato 24h alineado
 * (FR-008, FR-013): `07:00` a `21:00` como hora de inicio, cubriendo el
 * rango operativo de 07:00 a 22:00 (Clarifications, sesión 2026-09-13).
 * Los bloques entre `22:00` y `06:59` no forman parte de este catálogo.
 */
export const OPERATING_BLOCKS: readonly string[] = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 7).padStart(2, "0")}:00`,
);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: unknown): date is string {
  return typeof date === "string" && DATE_REGEX.test(date) && !Number.isNaN(Date.parse(date));
}

/**
 * ¿La `date` (`YYYY-MM-DD`) es estrictamente anterior al día actual del
 * servidor? Comparación de cadenas simple, consistente con research.md §4 y
 * usada por FR-021 para rechazar consultas de disponibilidad sobre fechas
 * pasadas. Asume `date` ya validada por `isValidDate`.
 *
 * Usa los componentes de fecha LOCALES de `now` (no `toISOString`, que es
 * UTC) para no desalinearse con `hasBlockStarted`, que interpreta `date`+
 * `time` como hora local del servidor (research.md §4: zona horaria única,
 * sin conversión).
 */
export function isPastDate(date: string, now: Date = new Date()): boolean {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;
  return date < today;
}

/** ¿Es uno de los 15 valores alineados del rango operativo (`07:00`…`21:00`)? */
export function isValidStartTime(startTime: unknown): startTime is string {
  return typeof startTime === "string" && OPERATING_BLOCKS.includes(startTime);
}

/**
 * `startTime + 1h` en el mismo formato `HH:00` (FR-013: siempre 1 hora
 * exacta). El rango operativo (`07:00`–`21:00` como hora de inicio) nunca
 * cruza la medianoche, por lo que no hace falta envolver el módulo 24.
 */
export function blockEndTime(startTime: string): string {
  const hour = Number(startTime.slice(0, 2));
  return `${String(hour + 1).padStart(2, "0")}:00`;
}

/** ¿El bloque `date`+`startTime` ya transcurrió respecto a `now`? (FR-014, FR-018) */
export function hasBlockStarted(date: string, startTime: string, now: Date = new Date()): boolean {
  const blockStart = new Date(`${date}T${startTime}:00`);
  return blockStart.getTime() <= now.getTime();
}

/**
 * ¿Ya transcurrió el FIN del bloque? Usado para derivar el estado
 * "completada". El rango operativo nunca produce un `endTime` de "00:00"
 * (el último bloque es `21:00`–`22:00`), por lo que no hace falta el caso
 * especial de medianoche del día siguiente.
 */
export function hasBlockEnded(date: string, endTime: string, now: Date = new Date()): boolean {
  const blockEnd = new Date(`${date}T${endTime}:00`);
  return blockEnd.getTime() <= now.getTime();
}
