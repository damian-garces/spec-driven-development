export interface Block {
  startTime: string;
  endTime: string;
  status: "disponible" | "reservado";
}

interface Props {
  blocks: Block[];
  selectedBlock: string | null;
  onSelect: (startTime: string) => void;
}

/**
 * Grilla de bloques horarios de 1h dentro del rango operativo 07:00–22:00
 * (FR-008): disponible vs. reservado. Para la fecha de hoy, `blocks` puede
 * venir con menos de 15 elementos o incluso vacío una vez que el último
 * bloque operativo ya transcurrió (FR-021); en ese caso se muestra un
 * mensaje en vez de una grilla vacía sin explicación.
 */
export default function ScheduleGrid({ blocks, selectedBlock, onSelect }: Props) {
  if (blocks.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
        No quedan horarios disponibles hoy.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {blocks.map((block) => {
        const available = block.status === "disponible";
        const selected = block.startTime === selectedBlock;

        return (
          <button
            key={block.startTime}
            type="button"
            disabled={!available}
            onClick={() => onSelect(block.startTime)}
            className={[
              "rounded border px-2 py-2 text-sm",
              !available && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
              available && !selected && "border-green-300 bg-green-50 hover:bg-green-100",
              available && selected && "border-slate-900 bg-slate-900 text-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {block.startTime}
            <span className="block text-xs">
              {available ? "Disponible" : "Reservado"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
