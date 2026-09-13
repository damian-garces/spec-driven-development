import { Router } from "express";
import { AppError } from "../middleware/errorHandler";
import { login, register } from "../services/authService";
import { findUserById } from "../models/users";

export const authRoutes = Router();

// POST /api/auth/register — FR-001, FR-002
authRoutes.post("/register", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = register(email, password);
  res.status(201).json(user);
});

// POST /api/auth/login — FR-003
authRoutes.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = login(email, password);

  req.session.userId = user.id;
  req.session.email = user.email;

  res.status(200).json(user);
});

// POST /api/auth/logout — FR-003
authRoutes.post("/logout", (req, res, next) => {
  if (!req.session?.userId) {
    next(new AppError(401, "No hay sesión activa."));
    return;
  }

  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.status(200).json({ ok: true });
  });
});

// GET /api/auth/me
authRoutes.get("/me", (req, res, next) => {
  if (!req.session?.userId) {
    next(new AppError(401, "No hay sesión activa."));
    return;
  }

  const user = findUserById(req.session.userId);
  if (!user) {
    next(new AppError(401, "No hay sesión activa."));
    return;
  }

  res.status(200).json({ id: user.id, email: user.email });
});
