import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";
import ScheduleGrid, { type Block } from "../components/ScheduleGrid";

interface Availability {
  courtId: number;
  date: string;
  blocks: Block[];
}

function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Selección de fecha + grilla de disponibilidad + confirmación de reserva
 * (FR-007 a FR-011). Requiere sesión activa (protegida en App.tsx por
 * RequireAuth).
 */
export default function CourtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courtId = Number(id);

  const [date, setDate] = useState(todayISO());
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAvailability = useCallback(() => {
    setError(null);
    setSelectedBlock(null);
    apiClient
      .get<Availability>(`/courts/${courtId}/availability?date=${date}`)
      .then(setAvailability)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "No se pudo cargar la disponibilidad.",
        ),
      );
  }, [courtId, date]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  async function confirmReservation() {
    if (!selectedBlock) return;
    setConfirming(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post("/reservations", { courtId, date, startTime: selectedBlock });
      setSuccess(`Reserva confirmada para el ${date} a las ${selectedBlock}.`);
      loadAvailability();
    } catch (err) {
      // FR-011 (bloque ya no disponible) y FR-015 (ya tiene una reserva
      // activa) llegan aquí como 409 con mensajes distintos del backend.
      setError(err instanceof ApiError ? err.message : "No se pudo confirmar la reserva.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link to="/courts" className="text-sm underline">
        ← Volver a canchas
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Disponibilidad</h1>

      <label className="mt-4 flex max-w-xs flex-col gap-1 text-sm">
        Fecha
        <input
          type="date"
          value={date}
          min={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-4 text-sm text-green-700">{success}</p>}

      {availability && (
        <div className="mt-6">
          <ScheduleGrid
            blocks={availability.blocks}
            selectedBlock={selectedBlock}
            onSelect={setSelectedBlock}
          />

          <button
            type="button"
            disabled={!selectedBlock || confirming}
            onClick={confirmReservation}
            className="mt-4 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {confirming ? "Confirmando…" : "Confirmar reserva"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-reservations")}
            className="mt-4 ml-3 text-sm underline"
          >
            Ver mis reservas
          </button>
        </div>
      )}
    </div>
  );
}
