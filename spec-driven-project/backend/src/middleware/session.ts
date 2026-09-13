import session from "express-session";
import type { RequestHandler } from "express";

// Ver research.md §1: sesión basada en cookie HTTP-only firmada, con
// almacenamiento en memoria del proceso (suficiente para el alcance de un
// solo servidor de esta iteración). El secreto debe sobrescribirse en
// producción vía la variable de entorno SESSION_SECRET.
const SESSION_SECRET = process.env.SESSION_SECRET ?? "padel-dev-secret-cambiar-en-produccion";

export const sessionMiddleware: RequestHandler = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
  },
});

// Amplía la sesión de express-session con el usuario autenticado.
declare module "express-session" {
  interface SessionData {
    usuarioId?: number;
    correo?: string;
  }
}
