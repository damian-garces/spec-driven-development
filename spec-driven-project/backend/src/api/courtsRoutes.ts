import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listCourts } from "../models/courts";
import { getAvailability } from "../services/availabilityService";

export const courtsRoutes = Router();

// GET /api/courts — FR-006. Público: un visitante sin sesión puede ver el
// listado estático, pero no la disponibilidad detallada (FR-004).
courtsRoutes.get("/", (_req, res) => {
  res.status(200).json(listCourts());
});

// GET /api/courts/:id/availability — FR-007, FR-008. Requiere sesión.
courtsRoutes.get("/:id/availability", requireAuth, (req, res) => {
  const courtId = Number(req.params.id);
  const availability = getAvailability(courtId, req.query.date);
  res.status(200).json(availability);
});
