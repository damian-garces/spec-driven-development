import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "./apiClient";

export interface UsuarioSesion {
  id: number;
  correo: string;
}

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  iniciarSesion: (usuario: UsuarioSesion) => void;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provee el estado de sesión a toda la app: al montar, consulta
 * GET /api/auth/me para saber si ya hay una sesión activa (por ejemplo tras
 * refrescar la página), sin requerir que el usuario vuelva a iniciar sesión.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiClient
      .get<UsuarioSesion>("/auth/me")
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback((nuevoUsuario: UsuarioSesion) => {
    setUsuario(nuevoUsuario);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await apiClient.post("/auth/logout");
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider.");
  }
  return ctx;
}
