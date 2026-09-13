import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, ApiError } from "../services/apiClient";

/** Página de registro (FR-001, FR-002): correo + contraseña. */
export default function Registro() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiClient.post("/auth/registro", { correo, password });
      navigate("/login", { state: { registrado: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar el registro.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Correo electrónico
          <input
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {enviando ? "Creando cuenta…" : "Registrarme"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
