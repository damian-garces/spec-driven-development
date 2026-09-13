import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { findUserByEmail, insertUser, type User } from "../models/users";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

export interface PublicUser {
  id: number;
  email: string;
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email };
}

/**
 * Registra una cuenta nueva (FR-001). Rechaza correos con formato
 * inválido o contraseñas demasiado cortas con 400, y correos ya usados
 * con 409 (FR-002).
 */
export function register(email: string, password: string): PublicUser {
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new AppError(400, "El correo electrónico no tiene un formato válido.");
  }
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      400,
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    );
  }

  const normalizedEmail = email.toLowerCase();

  if (findUserByEmail(normalizedEmail)) {
    throw new AppError(409, "El correo ya está en uso.");
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const user = insertUser(normalizedEmail, passwordHash);
  return toPublicUser(user);
}

/**
 * Verifica credenciales de login (FR-003). Devuelve el usuario público si
 * son correctas; lanza 401 con un mensaje genérico en caso contrario (no
 * revela si el correo existe o no, por seguridad).
 */
export function login(email: string, password: string): PublicUser {
  const INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

  if (typeof email !== "string" || typeof password !== "string") {
    throw new AppError(401, INVALID_CREDENTIALS);
  }

  const user = findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new AppError(401, INVALID_CREDENTIALS);
  }

  return toPublicUser(user);
}
