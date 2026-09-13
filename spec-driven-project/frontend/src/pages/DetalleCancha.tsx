import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";
import GrillaHorarios, { type Bloque } from "../components/GrillaHorarios";

interface Disponibilidad {
  canchaId: number;
  fecha: string;
  bloques: Bloque[];
}

function hoyISO(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Selección de fecha + grilla de disponibilidad + confirmación de reserva
 * (FR-007 a FR-011). Requiere sesión activa (protegida en App.tsx por
 * RequireAuth).
 */
export default function DetalleCancha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canchaId = Number(id);

  const [fecha, setFecha] = useState(hoyISO());
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const cargarDisponibilidad = useCallback(() => {
    setError(null);
    setBloqueSeleccionado(null);
    apiClient
      .get<Disponibilidad>(`/canchas/${canchaId}/disponibilidad?fecha=${fecha}`)
      .then(setDisponibilidad)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "No se pudo cargar la disponibilidad.",
        ),
      );
  }, [canchaId, fecha]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  async function confirmarReserva() {
    if (!bloqueSeleccionado) return;
    setConfirmando(true);
    setError(null);
    setExito(null);
    try {
      await apiClient.post("/reservas", { canchaId, fecha, horaInicio: bloqueSeleccionado });
      setExito(`Reserva confirmada para el ${fecha} a las ${bloqueSeleccionado}.`);
      cargarDisponibilidad();
    } catch (err) {
      // FR-011 (bloque ya no disponible) y FR-015 (ya tiene una reserva
      // activa) llegan aquí como 409 con mensajes distintos del backend.
      setError(err instanceof ApiError ? err.message : "No se pudo confirmar la reserva.");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link to="/canchas" className="text-sm underline">
        ← Volver a canchas
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Disponibilidad</h1>

      <label className="mt-4 flex max-w-xs flex-col gap-1 text-sm">
        Fecha
        <input
          type="date"
          value={fecha}
          min={hoyISO()}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {exito && <p className="mt-4 text-sm text-green-700">{exito}</p>}

      {disponibilidad && (
        <div className="mt-6">
          <GrillaHorarios
            bloques={disponibilidad.bloques}
            bloqueSeleccionado={bloqueSeleccionado}
            onSeleccionar={setBloqueSeleccionado}
          />

          <button
            type="button"
            disabled={!bloqueSeleccionado || confirmando}
            onClick={confirmarReserva}
            className="mt-4 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {confirmando ? "Confirmando…" : "Confirmar reserva"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/mis-reservas")}
            className="mt-4 ml-3 text-sm underline"
          >
            Ver mis reservas
          </button>
        </div>
      )}
    </div>
  );
}
