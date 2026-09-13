import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/authContext";

/**
 * Redirige a /login a un visitante sin sesión activa que intenta acceder a
 * una ruta protegida (disponibilidad detallada, reservas, panel personal —
 * FR-004). Mientras se resuelve GET /api/auth/me no renderiza nada, para
 * evitar un parpadeo hacia /login en cada recarga de página.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return null;
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
