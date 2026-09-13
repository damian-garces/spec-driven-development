# Reserva de Canchas de Pádel

Aplicación web para reservar canchas de pádel: autenticación de usuarios,
consulta de disponibilidad en bloques de 1 hora, creación de reservas con
prevención estricta de doble reserva, y un panel personal de gestión de
reservas.

Ver la especificación completa, el plan técnico y las tareas en
[`specs/001-reserva-canchas-padel/`](specs/001-reserva-canchas-padel/).

## Stack

- **Backend**: Node.js + Express + TypeScript, SQLite (`better-sqlite3`)
- **Frontend**: React + TypeScript (Vite) + Tailwind CSS

## Puesta en marcha

Requiere Node.js 20 LTS y npm.

### Backend (API)

```bash
cd backend
npm install
npm run dev
```

La API queda escuchando en `http://localhost:3001`. Al iniciar, crea (si no
existe) el archivo `db/padel.db` con el esquema de `backend/src/db/schema.sql`
y siembra las 5 canchas fijas del catálogo.

### Frontend (SPA)

```bash
cd frontend
npm install
npm run dev
```

La SPA queda disponible en `http://localhost:5173` y proxea las peticiones
`/api/*` hacia el backend en el puerto 3001 (ver `frontend/vite.config.ts`).

## Validación funcional

Los 3 escenarios end-to-end de las historias de usuario (registro/login,
disponibilidad + reserva con anti-colisión, y gestión de "Mis Reservas")
están documentados paso a paso en
[`specs/001-reserva-canchas-padel/quickstart.md`](specs/001-reserva-canchas-padel/quickstart.md).
