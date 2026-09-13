import type { NextFunction, Request, Response } from "express";

/**
 * Error de aplicación con un código HTTP semántico adjunto (Principio V).
 * Los servicios lanzan `AppError` con el código y el mensaje amigable ya
 * decididos; el error handler solo se encarga de traducirlo a respuesta.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Middleware de manejo central de errores. DEBE registrarse como el último
 * middleware de la app (después de todas las rutas). Traduce cualquier
 * error a un código HTTP semántico + `{ error: mensaje amigable }`, y jamás
 * expone stack traces al cliente (Principio V).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Error inesperado (bug, fallo de infraestructura, etc.): no se filtra
  // detalle técnico al cliente final.
  // eslint-disable-next-line no-console
  console.error("Error inesperado:", err);
  res.status(500).json({ error: "Ocurrió un error inesperado. Intenta de nuevo." });
}
