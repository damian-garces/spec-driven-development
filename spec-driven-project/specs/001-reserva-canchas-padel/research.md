# Research: Reserva de Canchas de Pádel

**Feature**: `001-reserva-canchas-padel` | **Date**: 2026-09-12

La mayoría de las decisiones tecnológicas de esta feature están fijadas por la
Constitución del proyecto (Stack Tecnológico y Estructura del Proyecto), por
lo que no quedan `NEEDS CLARIFICATION` en el Technical Context. Este documento
registra las decisiones derivadas necesarias para pasar de esas restricciones
a un diseño concreto.

## 1. Gestión de sesión de usuario

- **Decision**: Sesión basada en cookie HTTP-only firmada, emitida por
  `express-session` con almacenamiento en memoria del proceso (suficiente para
  el alcance de un solo servidor/single-tenant de esta iteración).
- **Rationale**: La Constitución exige "sesión activa y verificada" para todo
  flujo de reservas (Principio III) sin mandar una tecnología específica. Una
  cookie de sesión HTTP-only es la opción más simple (Principio IV, YAGNI):
  no requiere que el frontend gestione tokens manualmente, se invalida en el
  servidor con `session.destroy()` al hacer logout, y evita exponer un JWT
  reutilizable en `localStorage` (superficie de ataque XSS mayor).
- **Alternatives considered**:
  - *JWT en `Authorization` header*: descartado por añadir complejidad de
    expiración/refresh innecesaria para un club de un solo tenant y por
    complicar el logout inmediato (requeriría lista de revocación).
  - *Sesión persistida en SQLite (`connect-sqlite3`)*: descartado por ahora;
    aceptable como mejora futura si se necesita sobrevivir reinicios del
    servidor sin desloguear usuarios, pero no es un requisito de esta feature.

## 2. Hash de contraseñas

- **Decision**: `bcrypt` (o `bcryptjs` si se evitan bindings nativos) con
  factor de costo 10-12 para almacenar la contraseña de forma segura
  (FR-001, Key Entity "Usuario").
- **Rationale**: Estándar de facto para hash de contraseñas en Node.js;
  cumple "contraseña almacenada de forma segura" sin introducir dependencias
  pesadas ni arquitecturas adicionales.
- **Alternatives considered**: `argon2` (más moderno pero requiere bindings
  nativos adicionales sin beneficio claro para este alcance); hash propio con
  `crypto.scrypt` (descartado por reinventar una solución ya resuelta).

## 3. Prevención de doble reserva (Principio II, NON-NEGOTIABLE)

- **Decision**: Restricción `UNIQUE(cancha_id, fecha, hora_inicio)` a nivel de
  esquema SQLite sobre las reservas en estado `activa`, combinada con una
  transacción explícita (`BEGIN IMMEDIATE ... COMMIT`) en el servicio de
  reserva que: (1) revalida disponibilidad, (2) inserta la reserva, y (3)
  confía en que la restricción UNIQUE rechace cualquier condición de carrera
  residual con un error que el servicio traduce a `409 Conflict`.
- **Rationale**: SQLite serializa escrituras por conexión/archivo; usar
  `BEGIN IMMEDIATE` adquiere el lock de escritura antes de revalidar,
  eliminando la ventana de carrera entre "leer disponibilidad" y "escribir
  reserva" exigida por el Principio II. La restricción UNIQUE actúa como
  cinturón de seguridad adicional a nivel de base de datos, no como único
  mecanismo.
- **Alternatives considered**: Lock optimista con reintento (más complejo,
  innecesario dado el volumen de un solo club); lock a nivel de aplicación en
  memoria (no sirve si en el futuro hay más de un proceso Node; la
  transacción SQLite es la fuente de verdad única, alineado con Principio IV).

## 4. Manejo de fecha/hora y zona horaria

- **Decision**: El servidor opera en la zona horaria local única del club
  (asumida por el sistema operativo del host, sin conversión). Fechas se
  almacenan como `TEXT` en formato `YYYY-MM-DD` y horas de bloque como `TEXT`
  en formato `HH:00` (24h), evitando aritmética de husos horarios.
- **Rationale**: La Constitución exige formato 24h y el spec asume una única
  zona horaria (Assumptions). Comparar cadenas ISO simples es suficiente y
  evita bugs de conversión de timezone innecesarios para el alcance actual.
- **Alternatives considered**: Almacenar timestamps UTC con conversión en el
  cliente (descartado, complejidad no justificada sin requisito multi-zona).

## 5. Frameworks de testing

- **Decision**: `vitest` como test runner único para backend y frontend (más
  rápido que Jest, configuración mínima, compatible con TypeScript sin
  transpilación adicional); `supertest` para tests de contrato/integración
  HTTP sobre Express; `@testing-library/react` para componentes.
- **Rationale**: Un solo test runner para todo el stack reduce configuración
  y se alinea con Principio IV (simplicidad).
- **Alternatives considered**: Jest (viable pero requiere más configuración
  para ESM/TypeScript que vitest en un proyecto nuevo).

## Resumen de resolución de Technical Context

Ningún ítem del Technical Context queda marcado `NEEDS CLARIFICATION`: el
stack, lenguaje, almacenamiento y estructura de carpetas están fijados por la
Constitución; las decisiones de este documento cubren los detalles de
implementación no mandados explícitamente por ella.
