// Cliente HTTP hacia la API backend. Envía siempre `credentials: "include"`
// para que la cookie de sesión (ver backend/src/middleware/session.ts) viaje
// en cada petición, y normaliza los errores devueltos por el backend a un
// mensaje amigable único (Principio V: la UI nunca expone errores crudos).

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const BASE_URL = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    // Falla de red (servidor caído, sin conexión): nunca se expone el
    // detalle técnico del error de fetch, solo un mensaje amigable.
    throw new ApiError(0, "No se pudo conectar con el servidor. Intenta de nuevo.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : undefined;

  if (!response.ok) {
    const mensaje =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : "Ocurrió un error inesperado. Intenta de nuevo.";
    throw new ApiError(response.status, mensaje);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
