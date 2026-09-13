import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";

interface ReservaItem {
  id: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "activa" | "cancelada" | "completada";
}

interface MisReservasResponse {
  futuras: ReservaItem[];
  historial: ReservaItem[];
}

const ETIQUETA_ESTADO: Record<ReservaItem["estado"], string> = {
  activa: "Activa",
  completada: "Completada",
  cancelada: "Cancelada",
};

function FilaReserva({
  reserva,
  onCancelar,
}: {
  reserva: ReservaItem;
  onCancelar?: (id: number) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded border border-slate-300 p-3">
      <div>
        <p className="font-medium">{reserva.canchaNombre}</p>
        <p className="text-sm text-slate-600">
          {reserva.fecha} · {reserva.horaInicio}–{reserva.horaFin} ·{" "}
          {ETIQUETA_ESTADO[reserva.estado]}
        </p>
      </div>
      {onCancelar && (
        <button
          type="button"
          onClick={() => onCancelar(reserva.id)}
          className="text-sm text-red-600 underline"
        >
          Cancelar
        </button>
      )}
    </li>
  );
}

/** Panel "Mis Reservas" (FR-016 a FR-019). Requiere sesión activa. */
export default function MisReservas() {
  const [datos, setDatos] = useState<MisReservasResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reservaACancelar, setReservaACancelar] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setError(null);
    apiClient
      .get<MisReservasResponse>("/reservas/mias")
      .then(setDatos)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar tus reservas."),
      );
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarCancelacion() {
    if (reservaACancelar === null) return;
    setError(null);
    try {
      await apiClient.delete(`/reservas/${reservaACancelar}`);
      setReservaACancelar(null);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la reserva.");
      setReservaACancelar(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link to="/canchas" className="text-sm underline">
        ← Volver a canchas
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Mis reservas</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {datos && (
        <>
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-medium">Próximas</h2>
            {datos.futuras.length === 0 ? (
              <p className="text-sm text-slate-600">No tienes reservas futuras.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {datos.futuras.map((r) => (
                  <FilaReserva
                    key={r.id}
                    reserva={r}
                    onCancelar={(id) => setReservaACancelar(id)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-2 text-lg font-medium">Historial</h2>
            {datos.historial.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no tienes reservas pasadas o canceladas.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {datos.historial.map((r) => (
                  <FilaReserva key={r.id} reserva={r} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {reservaACancelar !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded bg-white p-5 shadow-lg">
            <p className="mb-4">¿Seguro que deseas cancelar esta reserva?</p>
            <div className="flex justify-end gap-3 text-sm">
              <button onClick={() => setReservaACancelar(null)} className="underline">
                Volver
              </button>
              <button
                onClick={confirmarCancelacion}
                className="rounded bg-red-600 px-3 py-1.5 text-white"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
