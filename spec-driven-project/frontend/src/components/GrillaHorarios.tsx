export interface Bloque {
  horaInicio: string;
  horaFin: string;
  estado: "disponible" | "reservado";
}

interface Props {
  bloques: Bloque[];
  bloqueSeleccionado: string | null;
  onSeleccionar: (horaInicio: string) => void;
}

/**
 * Grilla de bloques horarios de 1h dentro del rango operativo 07:00–22:00
 * (FR-008): disponible vs. reservado. Para la fecha de hoy, `bloques` puede
 * venir con menos de 15 elementos o incluso vacío una vez que el último
 * bloque operativo ya transcurrió (FR-021); en ese caso se muestra un
 * mensaje en vez de una grilla vacía sin explicación.
 */
export default function GrillaHorarios({ bloques, bloqueSeleccionado, onSeleccionar }: Props) {
  if (bloques.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
        No quedan horarios disponibles hoy.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {bloques.map((bloque) => {
        const disponible = bloque.estado === "disponible";
        const seleccionado = bloque.horaInicio === bloqueSeleccionado;

        return (
          <button
            key={bloque.horaInicio}
            type="button"
            disabled={!disponible}
            onClick={() => onSeleccionar(bloque.horaInicio)}
            className={[
              "rounded border px-2 py-2 text-sm",
              !disponible && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              disponible && !seleccionado && "border-green-300 bg-green-50 hover:bg-green-100",
              disponible && seleccionado && "border-slate-900 bg-slate-900 text-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {bloque.horaInicio}
            <span className="block text-xs">
              {disponible ? "Disponible" : "Reservado"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
