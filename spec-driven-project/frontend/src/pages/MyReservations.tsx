import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";

interface ReservationItem {
  id: number;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "activa" | "cancelada" | "completada";
}

interface MyReservationsResponse {
  upcoming: ReservationItem[];
  history: ReservationItem[];
}

const STATUS_LABEL: Record<ReservationItem["status"], string> = {
  activa: "Activa",
  completada: "Completada",
  cancelada: "Cancelada",
};

function ReservationRow({
  reservation,
  onCancel,
}: {
  reservation: ReservationItem;
  onCancel?: (id: number) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded border border-slate-300 p-3">
      <div>
        <p className="font-medium">{reservation.courtName}</p>
        <p className="text-sm text-slate-600">
          {reservation.date} · {reservation.startTime}–{reservation.endTime} ·{" "}
          {STATUS_LABEL[reservation.status]}
        </p>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={() => onCancel(reservation.id)}
          className="text-sm text-red-600 underline"
        >
          Cancelar
        </button>
      )}
    </li>
  );
}

/** Panel "Mis Reservas" (FR-016 a FR-019). Requiere sesión activa. */
export default function MyReservations() {
  const [data, setData] = useState<MyReservationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<number | null>(null);

  const load = useCallback(() => {
    setError(null);
    apiClient
      .get<MyReservationsResponse>("/reservations/mine")
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar tus reservas."),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmCancellation() {
    if (reservationToCancel === null) return;
    setError(null);
    try {
      await apiClient.delete(`/reservations/${reservationToCancel}`);
      setReservationToCancel(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cancelar la reserva.");
      setReservationToCancel(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link to="/courts" className="text-sm underline">
        ← Volver a canchas
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Mis reservas</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-medium">Próximas</h2>
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-slate-600">No tienes reservas futuras.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.upcoming.map((r) => (
                  <ReservationRow
                    key={r.id}
                    reservation={r}
                    onCancel={(id) => setReservationToCancel(id)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-2 text-lg font-medium">Historial</h2>
            {data.history.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no tienes reservas pasadas o canceladas.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.history.map((r) => (
                  <ReservationRow key={r.id} reservation={r} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {reservationToCancel !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded bg-white p-5 shadow-lg">
            <p className="mb-4">¿Seguro que deseas cancelar esta reserva?</p>
            <div className="flex justify-end gap-3 text-sm">
              <button onClick={() => setReservationToCancel(null)} className="underline">
                Volver
              </button>
              <button
                onClick={confirmCancellation}
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
