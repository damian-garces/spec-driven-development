import { Router } from "express";
import { AppError } from "../middleware/errorHandler";
import { iniciarSesion, registrar } from "../services/authService";
import { findUsuarioById } from "../models/usuarios";

export const authRoutes = Router();

// POST /api/auth/registro — FR-001, FR-002
authRoutes.post("/registro", (req, res) => {
  const { correo, password } = req.body ?? {};
  const usuario = registrar(correo, password);
  res.status(201).json(usuario);
});

// POST /api/auth/login — FR-003
authRoutes.post("/login", (req, res) => {
  const { correo, password } = req.body ?? {};
  const usuario = iniciarSesion(correo, password);

  req.session.usuarioId = usuario.id;
  req.session.correo = usuario.correo;

  res.status(200).json(usuario);
});

// POST /api/auth/logout — FR-003
authRoutes.post("/logout", (req, res, next) => {
  if (!req.session?.usuarioId) {
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
  if (!req.session?.usuarioId) {
    next(new AppError(401, "No hay sesión activa."));
    return;
  }

  const usuario = findUsuarioById(req.session.usuarioId);
  if (!usuario) {
    next(new AppError(401, "No hay sesión activa."));
    return;
  }

  res.status(200).json({ id: usuario.id, correo: usuario.correo });
});
