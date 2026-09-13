import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";

/**
 * Guard de autenticación (Principio III): exige una sesión activa y
 * verificada para acceder a la ruta. Si no hay sesión, responde 401 con un
 * mensaje amigable en lugar de dejar pasar la petición.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session?.usuarioId) {
    next(new AppError(401, "No hay sesión activa."));
    return;
  }
  next();
}
