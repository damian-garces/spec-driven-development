import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";
import { useAuth } from "../services/authContext";

interface Court {
  id: number;
  name: string;
}

/** Listado estático de las 5 canchas (FR-006). Accesible sin sesión activa. */
export default function Courts() {
  const { user, logout } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Court[]>("/courts")
      .then(setCourts)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el listado."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Canchas</h1>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/my-reservations" className="underline">
              Mis reservas
            </Link>
            <span className="text-slate-500">{user.email}</span>
            <button onClick={() => logout()} className="underline">
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="underline">
              Iniciar sesión
            </Link>
            <Link to="/register" className="underline">
              Registrarme
            </Link>
          </div>
        )}
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {courts.map((court) => (
          <li key={court.id}>
            <Link
              to={`/courts/${court.id}`}
              className="block rounded border border-slate-300 p-4 hover:bg-slate-100"
            >
              {court.name}
            </Link>
          </li>
        ))}
      </ul>

      {!user && (
        <p className="mt-6 text-sm text-slate-600">
          Inicia sesión para ver la disponibilidad de horarios y reservar.
        </p>
      )}
    </div>
  );
}
