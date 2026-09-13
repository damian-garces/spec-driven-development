import express, { type Express } from "express";
import { sessionMiddleware } from "../middleware/session";
import { errorHandler } from "../middleware/errorHandler";
import { authRoutes } from "./authRoutes";
import { canchasRoutes } from "./canchasRoutes";
import { reservasRoutes } from "./reservasRoutes";

/**
 * Construye la app Express. Las rutas de cada historia de usuario se
 * registran aquí a medida que se implementan (ver authRoutes, canchasRoutes,
 * reservasRoutes). El error handler SIEMPRE debe quedar como el último
 * middleware registrado.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(sessionMiddleware);

  app.use("/api/auth", authRoutes);
  app.use("/api/canchas", canchasRoutes);
  app.use("/api/reservas", reservasRoutes);

  app.use(errorHandler);

  return app;
}
