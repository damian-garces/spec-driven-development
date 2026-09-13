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

/** Grilla de 24 bloques horarios de 1h (FR-008): disponible vs. reservado. */
export default function GrillaHorarios({ bloques, bloqueSeleccionado, onSeleccionar }: Props) {
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
