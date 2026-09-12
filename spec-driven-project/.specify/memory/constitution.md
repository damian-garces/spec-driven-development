<!--
Sync Impact Report
==================
Version change: (template, unratified) → 1.0.0
Rationale for bump: Initial ratification of the project constitution (no prior filled version existed).

Modified principles: none (first version — all principles newly defined)
  - I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE) [NEW]
  - II. Prevención de Doble Reserva (NON-NEGOTIABLE) [NEW]
  - III. Autenticación Obligatoria [NEW]
  - IV. Simplicidad Ante Todo (YAGNI) [NEW]
  - V. Manejo de Errores Semántico y Amigable [NEW]

Added sections:
  - Stack Tecnológico y Estructura del Proyecto
  - Flujo de Trabajo del Agente de IA (SDD)

Removed sections: none (previous file was an unfilled template scaffold)

Templates requiring follow-up review (not modified by this command — scope guard):
  - .specify/templates/plan-template.md — ⚠ verify Constitution Check gates reference the 5 principles above
  - .specify/templates/spec-template.md — ⚠ verify no conflicting assumptions (e.g. dynamic court catalog, payments)
  - .specify/templates/tasks-template.md — ⚠ verify task categorization allows enforcing double-booking checks at DB layer

Deferred placeholders / TODOs: none.
-->

# Sistema de Reservas de Pádel Constitution

Aplicación para la reserva de canchas de pádel: permite a usuarios autenticados
gestionar reservas de tiempo en un catálogo cerrado de canchas, con prevención
estricta de colisiones de horario.

## Core Principles

### I. Catálogo Cerrado de Canchas (NON-NEGOTIABLE)
El sistema gestiona exclusivamente 5 canchas fijas: Cancha Laureles, Cancha El
Poblado, Cancha Belén, Cancha Robledo y Cancha Envigado. Ninguna funcionalidad
DEBE permitir crear, eliminar, renombrar o parametrizar canchas de forma
dinámica, ni exponer un catálogo configurable. Toda reserva opera en bloques
de tiempo expresados en formato de 24 horas (ej. `14:00`, nunca `2:00 PM`).

**Rationale**: Un catálogo fijo simplifica el modelo de datos y elimina
ambigüedad operativa. Ampliar el catálogo o el formato de horario es un
cambio de alcance del dominio y requiere una enmienda explícita a esta
constitución, no una decisión de implementación.

### II. Prevención de Doble Reserva (NON-NEGOTIABLE)
Bajo ninguna circunstancia se escribe una reserva en la base de datos sin
validar primero, dentro de la misma operación atómica, que la cancha
seleccionada esté libre en el horario solicitado. Cualquier implementación
que permita una condición de carrera entre la verificación de disponibilidad
y la escritura de la reserva constituye una violación de esta constitución.

**Rationale**: El double-booking es el fallo de negocio más costoso del
sistema; prevenir colisiones de horario es el propósito central de la
aplicación y la razón de ser de esta regla como no negociable.

### III. Autenticación Obligatoria
Todo flujo de creación, modificación o cancelación de una reserva EXIGE una
sesión de usuario activa y verificada. Ningún endpoint que afecte reservas
puede quedar accesible sin autenticación válida.

**Rationale**: Las reservas están ligadas a la identidad de quien reserva;
sin autenticación no hay forma de asignar responsabilidad sobre una reserva
ni de prevenir abuso del sistema.

### IV. Simplicidad Ante Todo (YAGNI)
El proyecto DEBE evitar la sobreingeniería: no se implementan arquitecturas
en capas (Clean Architecture, hexagonal u otras) ni patrones de diseño
complejos innecesarios. Se prioriza programación funcional y componentes
funcionales (React Hooks); el uso de clases solo se permite cuando sea
estrictamente obligatorio por una dependencia externa. La nomenclatura usa
`camelCase` para funciones y variables, y `PascalCase` para interfaces y
tipos.

**Rationale**: El dominio de negocio es pequeño y está bien acotado (5
canchas, reservas por horario); no justifica complejidad arquitectónica. La
simplicidad reduce el costo de mantenimiento y facilita verificar que la
regla crítica de doble reserva (Principio II) se cumple en un único lugar.

### V. Manejo de Errores Semántico y Amigable
El backend DEBE responder siempre con códigos de estado HTTP semánticos: 400
para peticiones inválidas, 401 para falta de autenticación, 409 para
conflictos de reserva (double-booking), y otros códigos estándar aplicables
según el caso. La interfaz de usuario NUNCA expone errores crudos ni stack
traces; todo error técnico DEBE traducirse a un mensaje amigable para el
usuario final (ej. "La cancha ya fue reservada en este horario").

**Rationale**: Los códigos HTTP semánticos permiten a los clientes reaccionar
correctamente ante cada tipo de fallo, y ocultar detalles técnicos protege la
experiencia del usuario final y evita filtrar información interna del
sistema.

## Stack Tecnológico y Estructura del Proyecto

- **Frontend/UI**: React con componentes funcionales y Hooks; estilos con
  Tailwind CSS.
- **Backend**: Node.js con Express.
- **Base de datos**: SQLite local (archivo `padel.db`); acceso mediante
  `better-sqlite3` o sentencias SQL puras. NO se permiten ORMs pesados (ej.
  TypeORM, Prisma) para mantener la simplicidad de acceso a datos.
- **Lenguaje**: TypeScript en todo el stack (frontend y backend).
- **Estructura de carpetas**: estructura plana obligatoria — `/frontend`,
  `/backend` y `/db`. No se introducen capas adicionales (`/domain`,
  `/application`, `/infrastructure`, etc.) sin una enmienda a esta
  constitución.

## Flujo de Trabajo del Agente de IA (SDD)

- **Cero Código Sombra**: El agente de IA construye estrictamente lo
  documentado en `spec.md`. No se añaden funcionalidades no especificadas
  "por si acaso" (ej. pasarelas de pago, perfiles de usuario complejos,
  notificaciones u otras características no solicitadas).
- **Fuente de la Verdad**: `spec.md` es la fuente de la verdad operativa del
  proyecto, subordinada a esta constitución. Si una instrucción del usuario
  contradice esta constitución, o si el agente detecta una falla lógica en la
  especificación, el agente DEBE detenerse, advertir explícitamente del
  problema, y solicitar la actualización de `spec.md` antes de tocar el
  código fuente.

## Governance

Esta constitución prevalece sobre cualquier otra práctica, plantilla o
preferencia individual de implementación. Toda spec, plan o lista de tareas
generada mediante el flujo de Spec-Driven Development DEBE ser consistente
con los principios aquí definidos.

**Procedimiento de enmienda**: cualquier cambio a esta constitución (adición,
modificación o eliminación de principios o reglas) requiere: (1) documentar
la propuesta y su justificación, (2) actualizar este archivo con un nuevo
número de versión conforme a la política de versionado semántico, y (3)
registrar el cambio en el Sync Impact Report generado al momento de la
enmienda.

**Política de versionado**: MAJOR para eliminaciones o redefiniciones
incompatibles de principios existentes; MINOR para adición de principios o
secciones nuevas, o expansión material de guías existentes; PATCH para
aclaraciones, correcciones de redacción o refinamientos no semánticos.

**Revisión de cumplimiento**: toda spec, plan de implementación (`plan.md`)
y lista de tareas (`tasks.md`) generada por los comandos de Spec Kit DEBE
verificarse contra esta constitución antes de avanzar a la fase de
implementación. Cualquier desviación DEBE justificarse explícitamente o
corregirse antes de continuar.

**Version**: 1.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-11
