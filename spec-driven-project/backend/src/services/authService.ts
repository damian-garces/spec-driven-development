import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { findUsuarioByCorreo, insertUsuario, type Usuario } from "../models/usuarios";

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

export interface UsuarioPublico {
  id: number;
  correo: string;
}

function aUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return { id: usuario.id, correo: usuario.correo };
}

/**
 * Registra una cuenta nueva (FR-001). Rechaza correos con formato
 * inválido o contraseñas demasiado cortas con 400, y correos ya usados
 * con 409 (FR-002).
 */
export function registrar(correo: string, password: string): UsuarioPublico {
  if (typeof correo !== "string" || !CORREO_REGEX.test(correo)) {
    throw new AppError(400, "El correo electrónico no tiene un formato válido.");
  }
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      400,
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    );
  }

  const correoNormalizado = correo.toLowerCase();

  if (findUsuarioByCorreo(correoNormalizado)) {
    throw new AppError(409, "El correo ya está en uso.");
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const usuario = insertUsuario(correoNormalizado, passwordHash);
  return aUsuarioPublico(usuario);
}

/**
 * Verifica credenciales de login (FR-003). Devuelve el usuario público si
 * son correctas; lanza 401 con un mensaje genérico en caso contrario (no
 * revela si el correo existe o no, por seguridad).
 */
export function iniciarSesion(correo: string, password: string): UsuarioPublico {
  const CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos.";

  if (typeof correo !== "string" || typeof password !== "string") {
    throw new AppError(401, CREDENCIALES_INVALIDAS);
  }

  const usuario = findUsuarioByCorreo(correo);
  if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
    throw new AppError(401, CREDENCIALES_INVALIDAS);
  }

  return aUsuarioPublico(usuario);
}
