import express, { type Express } from "express";
import { sessionMiddleware } from "../middleware/session";
import { errorHandler } from "../middleware/errorHandler";
import { authRoutes } from "./authRoutes";
import { courtsRoutes } from "./courtsRoutes";
import { reservationsRoutes } from "./reservationsRoutes";

/**
 * Construye la app Express. Las rutas de cada historia de usuario se
 * registran aquí a medida que se implementan (ver authRoutes, courtsRoutes,
 * reservationsRoutes). El error handler SIEMPRE debe quedar como el último
 * middleware registrado.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(sessionMiddleware);

  app.use("/api/auth", authRoutes);
  app.use("/api/courts", courtsRoutes);
  app.use("/api/reservations", reservationsRoutes);

  app.use(errorHandler);

  return app;
}
