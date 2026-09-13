import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { cancelarReserva, crearReserva, obtenerMisReservas } from "../services/reservaService";

export const reservasRoutes = Router();

reservasRoutes.use(requireAuth);

// POST /api/reservas — FR-009 a FR-015.
reservasRoutes.post("/", (req, res) => {
  const usuarioId = req.session.usuarioId as number;
  const { canchaId, fecha, horaInicio } = req.body ?? {};
  const reserva = crearReserva(usuarioId, Number(canchaId), fecha, horaInicio);
  res.status(201).json(reserva);
});

// GET /api/reservas/mias — FR-016.
reservasRoutes.get("/mias", (req, res) => {
  const usuarioId = req.session.usuarioId as number;
  res.status(200).json(obtenerMisReservas(usuarioId));
});

// DELETE /api/reservas/:id — FR-017 a FR-019.
reservasRoutes.delete("/:id", (req, res) => {
  const usuarioId = req.session.usuarioId as number;
  const resultado = cancelarReserva(usuarioId, Number(req.params.id));
  res.status(200).json(resultado);
});
