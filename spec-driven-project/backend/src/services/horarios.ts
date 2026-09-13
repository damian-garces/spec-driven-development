// Utilidades de fecha/hora compartidas por disponibilidadService y
// reservaService. Ver research.md §4: fechas y horas se comparan como
// cadenas `YYYY-MM-DD` / `HH:00`, sin aritmética de husos horarios.

/** Los 24 bloques horarios de un día, en formato 24h alineado (FR-008, FR-013). */
export const BLOQUES_DIA: readonly string[] = Array.from(
  { length: 24 },
  (_, h) => `${String(h).padStart(2, "0")}:00`,
);

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function esFechaValida(fecha: unknown): fecha is string {
  return typeof fecha === "string" && FECHA_REGEX.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

/** ¿Es uno de los 24 valores alineados (`00:00`, `01:00`, ..., `23:00`)? */
export function esHoraInicioValida(horaInicio: unknown): horaInicio is string {
  return typeof horaInicio === "string" && BLOQUES_DIA.includes(horaInicio);
}

/** `horaInicio + 1h` en el mismo formato `HH:00` (FR-013: siempre 1 hora exacta). */
export function horaFinDeBloque(horaInicio: string): string {
  const hora = Number(horaInicio.slice(0, 2));
  return `${String((hora + 1) % 24).padStart(2, "0")}:00`;
}

/** ¿El bloque `fecha`+`horaInicio` ya transcurrió respecto a `ahora`? (FR-014, FR-018) */
export function bloqueYaPaso(fecha: string, horaInicio: string, ahora: Date = new Date()): boolean {
  const inicioBloque = new Date(`${fecha}T${horaInicio}:00`);
  return inicioBloque.getTime() <= ahora.getTime();
}

/** ¿Ya transcurrió el FIN del bloque? Usado para derivar el estado "completada". */
export function bloqueYaFinalizo(fecha: string, horaFin: string, ahora: Date = new Date()): boolean {
  // horaFin puede ser "00:00" representando medianoche del día siguiente
  // cuando horaInicio es "23:00"; Date maneja esto sumando el día implícito
  // solo si se le da fecha+1, por lo que aquí comparamos contra el mismo
  // día salvo ese caso límite.
  if (horaFin === "00:00") {
    const [anio, mes, dia] = fecha.split("-").map(Number);
    const finDia = new Date(anio, mes - 1, dia + 1, 0, 0, 0);
    return finDia.getTime() <= ahora.getTime();
  }
  const finBloque = new Date(`${fecha}T${horaFin}:00`);
  return finBloque.getTime() <= ahora.getTime();
}
