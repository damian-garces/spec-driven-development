import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listCanchas } from "../models/canchas";
import { obtenerDisponibilidad } from "../services/disponibilidadService";

export const canchasRoutes = Router();

// GET /api/canchas — FR-006. Público: un visitante sin sesión puede ver el
// listado estático, pero no la disponibilidad detallada (FR-004).
canchasRoutes.get("/", (_req, res) => {
  res.status(200).json(listCanchas());
});

// GET /api/canchas/:id/disponibilidad — FR-007, FR-008. Requiere sesión.
canchasRoutes.get("/:id/disponibilidad", requireAuth, (req, res) => {
  const canchaId = Number(req.params.id);
  const disponibilidad = obtenerDisponibilidad(canchaId, req.query.fecha);
  res.status(200).json(disponibilidad);
});
