import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";
import { useAuth } from "../services/authContext";

interface Cancha {
  id: number;
  nombre: string;
}

/** Listado estático de las 5 canchas (FR-006). Accesible sin sesión activa. */
export default function Canchas() {
  const { usuario, cerrarSesion } = useAuth();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Cancha[]>("/canchas")
      .then(setCanchas)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el listado."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Canchas</h1>
        {usuario ? (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/mis-reservas" className="underline">
              Mis reservas
            </Link>
            <span className="text-slate-500">{usuario.correo}</span>
            <button onClick={() => cerrarSesion()} className="underline">
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="underline">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="underline">
              Registrarme
            </Link>
          </div>
        )}
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {canchas.map((cancha) => (
          <li key={cancha.id}>
            <Link
              to={`/canchas/${cancha.id}`}
              className="block rounded border border-slate-300 p-4 hover:bg-slate-100"
            >
              {cancha.nombre}
            </Link>
          </li>
        ))}
      </ul>

      {!usuario && (
        <p className="mt-6 text-sm text-slate-600">
          Inicia sesión para ver la disponibilidad de horarios y reservar.
        </p>
      )}
    </div>
  );
}
