// Utilidades de fecha/hora compartidas por disponibilidadService y
// reservaService. Ver research.md §4: fechas y horas se comparan como
// cadenas `YYYY-MM-DD` / `HH:00`, sin aritmética de husos horarios.

/**
 * Los 15 bloques horarios operativos de un día, en formato 24h alineado
 * (FR-008, FR-013): `07:00` a `21:00` como hora de inicio, cubriendo el
 * rango operativo de 07:00 a 22:00 (Clarifications, sesión 2026-09-13).
 * Los bloques entre `22:00` y `06:59` no forman parte de este catálogo.
 */
export const BLOQUES_DIA: readonly string[] = Array.from(
  { length: 15 },
  (_, i) => `${String(i + 7).padStart(2, "0")}:00`,
);

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function esFechaValida(fecha: unknown): fecha is string {
  return typeof fecha === "string" && FECHA_REGEX.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

/** ¿Es uno de los 24 valores alineados (`00:00`, `01:00`, ..., `23:00`)? */
export function esHoraInicioValida(horaInicio: unknown): horaInicio is string {
  return typeof horaInicio === "string" && BLOQUES_DIA.includes(horaInicio);
}

/**
 * `horaInicio + 1h` en el mismo formato `HH:00` (FR-013: siempre 1 hora
 * exacta). El rango operativo (`07:00`–`21:00` como hora de inicio) nunca
 * cruza la medianoche, por lo que no hace falta envolver el módulo 24.
 */
export function horaFinDeBloque(horaInicio: string): string {
  const hora = Number(horaInicio.slice(0, 2));
  return `${String(hora + 1).padStart(2, "0")}:00`;
}

/** ¿El bloque `fecha`+`horaInicio` ya transcurrió respecto a `ahora`? (FR-014, FR-018) */
export function bloqueYaPaso(fecha: string, horaInicio: string, ahora: Date = new Date()): boolean {
  const inicioBloque = new Date(`${fecha}T${horaInicio}:00`);
  return inicioBloque.getTime() <= ahora.getTime();
}

/**
 * ¿Ya transcurrió el FIN del bloque? Usado para derivar el estado
 * "completada". El rango operativo nunca produce un `horaFin` de "00:00"
 * (el último bloque es `21:00`–`22:00`), por lo que no hace falta el caso
 * especial de medianoche del día siguiente.
 */
export function bloqueYaFinalizo(fecha: string, horaFin: string, ahora: Date = new Date()): boolean {
  const finBloque = new Date(`${fecha}T${horaFin}:00`);
  return finBloque.getTime() <= ahora.getTime();
}
