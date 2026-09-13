import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { cancelReservation, createReservation, getMyReservations } from "../services/reservationService";

export const reservationsRoutes = Router();

reservationsRoutes.use(requireAuth);

// POST /api/reservations — FR-009 a FR-015.
reservationsRoutes.post("/", (req, res) => {
  const userId = req.session.userId as number;
  const { courtId, date, startTime } = req.body ?? {};
  const reservation = createReservation(userId, Number(courtId), date, startTime);
  res.status(201).json(reservation);
});

// GET /api/reservations/mine — FR-016.
reservationsRoutes.get("/mine", (req, res) => {
  const userId = req.session.userId as number;
  res.status(200).json(getMyReservations(userId));
});

// DELETE /api/reservations/:id — FR-017 a FR-019.
reservationsRoutes.delete("/:id", (req, res) => {
  const userId = req.session.userId as number;
  const result = cancelReservation(userId, Number(req.params.id));
  res.status(200).json(result);
});
