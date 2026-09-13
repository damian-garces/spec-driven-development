# Feature Specification: Reserva de Canchas de Pádel

**Feature Branch**: `001-reserva-canchas-padel`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Features principales: 1) Autenticación de Usuarios (registro/login con correo y contraseña; solo usuarios con sesión activa ven disponibilidad completa y reservan; cada usuario gestiona solo sus propias reservas). 2) Exploración y Selección de Canchas (listado estático de 5 canchas; selección de fecha en calendario; grilla de horarios de 24h en bloques de 1h; indicación de bloques Disponibles/Reservados; un usuario solo puede tener una reserva activa a la vez). 3) Creación de Reservas (selección y confirmación de bloque horario; revalidación anti-colisión antes de confirmar, con rechazo y mensaje claro si el bloque ya no está libre; reservas solo en bloques enteros de 1 hora; no se permiten reservas en fechas/horarios pasados). 4) Gestión de Mis Reservas (panel con reservas futuras e historial de pasadas, mostrando cancha/fecha/hora; cancelación de reservas futuras con confirmación). Non-goals: sin pasarela de pagos, sin panel de administrador de canchas, sin notificaciones externas (email/SMS/WhatsApp), sin reservas de más de 1 hora en un solo clic, sin sistema de matchmaking."

## Clarifications

### Session 2026-09-12

- Q: ¿El límite de "una reserva activa a la vez" aplica de forma global (todas las canchas juntas) o permite una reserva activa por cada cancha? → A: Global — el usuario puede tener como máximo 1 reserva activa en total, sin importar la cancha.
- Q: Cuando un usuario cancela una reserva futura, ¿esa reserva debe quedar visible en su historial marcada como "Cancelada", o debe desaparecer por completo de los listados? → A: Se conserva en el historial, marcada como "Cancelada" con su fecha/hora original.

### Session 2026-09-13

- Q: ¿Debe el primer bloque horario visible de la grilla ser 07:00–08:00, o también debe mostrarse 06:00–07:00? → A: Rango visible 07:00–22:00 (15 bloques/día); no se muestra 06:00–07:00 ni ningún bloque desde 22:00 hasta 06:59.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro e Inicio de Sesión (Priority: P1)

Un visitante nuevo crea una cuenta con su correo electrónico y una contraseña, e inicia sesión para poder acceder a las funciones de reserva del club.

**Why this priority**: Es el requisito de entrada para todo el resto del sistema: sin una cuenta y una sesión activa, ningún usuario puede ver la disponibilidad completa ni reservar. Sin esta historia no existe producto utilizable.

**Independent Test**: Puede probarse de forma aislada registrando una cuenta nueva con correo y contraseña, cerrando sesión, y volviendo a iniciar sesión con las mismas credenciales; se verifica también que un visitante sin sesión no puede acceder a la disponibilidad completa ni a la creación de reservas.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** se registra con un correo electrónico y contraseña válidos y no utilizados previamente, **Then** el sistema crea la cuenta y le permite iniciar sesión.
2. **Given** un usuario ya registrado, **When** inicia sesión con su correo y contraseña correctos, **Then** el sistema le concede una sesión activa y acceso a la disponibilidad completa y a la creación de reservas.
3. **Given** un intento de registro con un correo ya utilizado por otra cuenta, **When** se envía el formulario, **Then** el sistema rechaza el registro e informa que el correo ya está en uso.
4. **Given** un visitante sin sesión activa, **When** intenta ver la disponibilidad completa de una cancha o crear una reserva, **Then** el sistema se lo impide y lo dirige a iniciar sesión o registrarse.

---

### User Story 2 - Consultar Disponibilidad y Reservar una Cancha (Priority: P1)

Un usuario autenticado elige una de las 5 canchas y una fecha, visualiza la grilla de horarios (07:00 a 22:00, en bloques de 1 hora) indicando qué bloques están disponibles y cuáles ya están reservados, selecciona un bloque libre y confirma su reserva.

**Why this priority**: Es el propósito central de la aplicación: permitir que un usuario autenticado reserve un turno sin colisionar con otra reserva existente. Junto con la autenticación, constituye el producto mínimo viable.

**Independent Test**: Con un usuario ya autenticado y datos de reservas existentes de prueba, puede probarse de forma aislada seleccionando una cancha y una fecha, confirmando que los bloques ocupados se muestran como "Reservados" y los libres como "Disponibles", y completando una reserva sobre un bloque libre.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado, **When** selecciona una de las 5 canchas y una fecha, **Then** el sistema muestra la grilla de 15 bloques horarios de 1 hora, cubriendo el rango operativo de 07:00 a 22:00, para esa cancha y fecha, marcando cada bloque como "Disponible" o "Reservado".
2. **Given** la grilla de horarios visible, **When** el usuario selecciona un bloque marcado como "Disponible" y confirma la reserva, **Then** el sistema revalida que el bloque siga libre, la registra a nombre del usuario, y el bloque pasa a mostrarse como "Reservado".
3. **Given** un bloque disponible seleccionado por el usuario, **When** otro usuario reserva ese mismo bloque justo antes de que se confirme la operación, **Then** el sistema rechaza la confirmación con un mensaje claro indicando que el horario ya no está disponible, sin crear la reserva.
4. **Given** un usuario que ya tiene una reserva activa (futura y no cancelada), **When** intenta confirmar una nueva reserva, **Then** el sistema rechaza la operación e indica que ya cuenta con una reserva activa.
5. **Given** una fecha u hora que ya transcurrió, **When** el usuario intenta seleccionarla o confirmarla como reserva, **Then** el sistema no lo permite.

---

### User Story 3 - Gestionar Mis Reservas (Priority: P2)

Un usuario autenticado consulta, desde un panel personal, la lista de sus reservas futuras y el historial de sus reservas pasadas y canceladas, y puede cancelar una reserva futura.

**Why this priority**: Aporta valor de seguimiento y control sobre las reservas ya creadas, pero depende de que existan reservas (Historia 2) y de la sesión activa (Historia 1); es un incremento posterior al flujo principal de reserva.

**Independent Test**: Con un usuario autenticado que ya tiene al menos una reserva futura y una pasada (datos de prueba), puede probarse de forma aislada abriendo el panel "Mis Reservas", verificando que ambas listas muestran cancha/fecha/hora correctamente, y cancelando la reserva futura.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con reservas futuras, pasadas y canceladas, **When** abre su panel de "Mis Reservas", **Then** el sistema muestra por separado la lista de reservas futuras y el historial de reservas pasadas y canceladas, cada una con nombre de la cancha, fecha, hora y estado.
2. **Given** una reserva futura en el panel del usuario, **When** el usuario selecciona cancelarla y confirma la acción, **Then** el sistema anula esa reserva, la retira de la lista de reservas futuras, la traslada al historial marcada como "Cancelada" con su fecha/hora original, y libera el bloque horario para que otros usuarios puedan reservarlo.
3. **Given** el panel de "Mis Reservas", **When** el usuario intenta cancelar una reserva ya pasada, **Then** el sistema no permite la cancelación de reservas cuyo horario ya transcurrió.
4. **Given** un usuario autenticado, **When** consulta su panel, **Then** solo ve sus propias reservas, nunca las de otros usuarios.

---

### Edge Cases

- ¿Qué ocurre si dos usuarios intentan confirmar el mismo bloque horario de la misma cancha casi simultáneamente? El sistema debe aceptar solo al primero que complete la validación y rechazar al segundo con un mensaje claro, sin dejar el bloque en un estado inconsistente.
- ¿Qué ocurre si un usuario con una reserva activa cancela esa reserva? Debe quedar habilitado de inmediato para crear una nueva reserva, y la reserva cancelada debe seguir visible en su historial marcada como "Cancelada".
- ¿Qué ocurre si un usuario intenta reservar un bloque parcial (por ejemplo 14:30 a 15:30)? El sistema solo permite bloques completos alineados a la hora (ej. 14:00–15:00).
- ¿Qué ocurre si un usuario intenta reservar un bloque fuera del rango operativo (por ejemplo 23:00 o 03:00)? El sistema debe rechazarlo: esos bloques no se muestran en la grilla ni pueden reservarse, aun si se manipula la solicitud directamente.
- ¿Qué ocurre si un usuario intenta ver o cancelar una reserva que pertenece a otro usuario (por ejemplo, manipulando un identificador)? El sistema debe impedirlo.
- ¿Qué ocurre si un usuario no autenticado intenta acceder directamente a la grilla de disponibilidad o al panel de reservas? El sistema debe impedir el acceso y solicitar inicio de sesión.
- ¿Qué ocurre cuando el reloj del sistema hace que una reserva "futura" pase a ser "pasada" mientras el usuario tiene el panel abierto? La próxima consulta al panel debe reflejar la reserva en el historial y ya no permitir su cancelación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir que un visitante se registre como usuario utilizando un correo electrónico y una contraseña.
- **FR-002**: El sistema DEBE rechazar el registro de un correo electrónico que ya esté asociado a una cuenta existente.
- **FR-003**: El sistema DEBE permitir que un usuario registrado inicie sesión con su correo y contraseña, y cierre sesión cuando lo desee.
- **FR-004**: El sistema DEBE restringir la visualización de la disponibilidad completa (grilla de horarios) y la creación de reservas exclusivamente a usuarios con sesión activa.
- **FR-005**: El sistema DEBE permitir que un usuario autenticado gestione (ver, cancelar) únicamente sus propias reservas, nunca las de otros usuarios.
- **FR-006**: El sistema DEBE listar de forma estática las 5 canchas disponibles: Cancha Laureles, Cancha El Poblado, Cancha Belén, Cancha Robledo y Cancha Envigado.
- **FR-007**: El sistema DEBE permitir que el usuario seleccione una cancha y una fecha específica para consultar su disponibilidad.
- **FR-008**: El sistema DEBE mostrar, para la cancha y fecha seleccionadas, una grilla de 15 bloques horarios de 1 hora cada uno (formato 24 horas), cubriendo únicamente el rango operativo de 07:00 a 22:00 (bloques `07:00`–`08:00` hasta `21:00`–`22:00`); los bloques entre `22:00` y `06:59` NO deben mostrarse. Cada bloque visible indica claramente si está "Disponible" o "Reservado".
- **FR-009**: El sistema DEBE permitir que el usuario seleccione un bloque horario marcado como disponible y confirme una reserva sobre ese bloque.
- **FR-010**: El sistema DEBE revalidar, en el momento de confirmar, que el bloque horario seleccionado siga disponible antes de registrar la reserva.
- **FR-011**: El sistema DEBE rechazar la confirmación de una reserva sobre un bloque que dejó de estar disponible (porque otro usuario lo reservó primero), informando al usuario con un mensaje claro y sin registrar la reserva.
- **FR-012**: El sistema DEBE impedir que se registre más de una reserva para la misma cancha, fecha y bloque horario.
- **FR-013**: El sistema DEBE permitir reservar únicamente bloques horarios completos de 1 hora alineados en punto (ej. 14:00 a 15:00) y dentro del rango operativo de 07:00 a 22:00 (FR-008); no se permiten reservas de duración distinta, desalineadas, ni fuera de dicho rango, incluso si la solicitud se envía directamente sin pasar por la grilla.
- **FR-014**: El sistema DEBE impedir la creación de reservas en fechas u horarios que ya hayan transcurrido respecto al momento actual.
- **FR-015**: El sistema DEBE impedir que un usuario tenga más de una reserva activa (futura y no cancelada) al mismo tiempo; esta restricción es global para el usuario, sin importar la cancha (no se permite una reserva activa por cancha).
- **FR-016**: El sistema DEBE mostrar a cada usuario autenticado un panel con la lista de sus reservas futuras y un historial separado que incluye tanto sus reservas pasadas como sus reservas canceladas, mostrando en cada ítem el nombre de la cancha, la fecha, la hora y el estado ("Completada" o "Cancelada" según corresponda).
- **FR-017**: El sistema DEBE permitir que un usuario cancele una de sus reservas futuras, solicitando una confirmación explícita antes de anularla.
- **FR-018**: El sistema DEBE impedir la cancelación de reservas cuyo horario ya haya transcurrido.
- **FR-019**: El sistema DEBE liberar el bloque horario correspondiente inmediatamente después de que una reserva futura sea cancelada, dejándolo disponible para que cualquier usuario lo reserve, y DEBE conservar la reserva cancelada visible en el historial del usuario con estado "Cancelada".
- **FR-020**: El sistema NO DEBE ofrecer pasarela de pagos, panel de administración de canchas, notificaciones externas (correo, SMS, WhatsApp), reservas de más de 1 hora en una sola confirmación, ni funciones de matchmaking entre jugadores, por estar fuera del alcance de esta iteración.

### Key Entities

- **Usuario**: Persona registrada en el sistema. Atributos clave: correo electrónico (único), contraseña (almacenada de forma segura), fecha de registro. Puede tener múltiples reservas a lo largo del tiempo, pero como máximo una activa simultáneamente a nivel global (sin importar la cancha).
- **Cancha**: Uno de los 5 espacios físicos fijos del catálogo (Laureles, El Poblado, Belén, Robledo, Envigado). Atributo clave: nombre. El catálogo es inmutable en esta iteración.
- **Reserva**: Representa la ocupación de una cancha por un usuario en un bloque horario de 1 hora en una fecha determinada. Atributos clave: usuario asociado, cancha asociada, fecha, hora de inicio y fin del bloque, estado (activa, cancelada o completada). Una reserva activa pasa a "completada" cuando su horario transcurre sin haber sido cancelada; si el usuario la cancela antes de esa fecha/hora, pasa a "cancelada". En ambos casos la reserva permanece visible en el historial del usuario con su fecha/hora original y su estado final.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante nuevo puede registrarse e iniciar sesión en menos de 1 minuto.
- **SC-002**: Un usuario autenticado puede completar el flujo completo de reserva (elegir cancha, fecha, horario disponible y confirmar) en menos de 2 minutos.
- **SC-003**: El sistema previene el 100% de los intentos de doble reserva sobre el mismo bloque horario y cancha: ningún bloque queda asignado a más de un usuario al mismo tiempo.
- **SC-004**: Un usuario puede encontrar y cancelar una reserva futura desde su panel personal en 3 pasos o menos.
- **SC-005**: El 100% de las reservas mostradas a un usuario en su panel corresponden exclusivamente a sus propias reservas.

## Assumptions

- No habrá flujo de recuperación de contraseña ("olvidé mi contraseña") en esta iteración, dado que típicamente requiere el envío de un correo electrónico, y las notificaciones externas están explícitamente fuera de alcance.
- El registro de cuentas no requiere verificación de correo electrónico; la cuenta queda activa inmediatamente después del registro, por la misma razón anterior.
- El sistema opera en una única zona horaria local del club; no se requiere soporte multi-zona horaria.
- No existe un límite explícito de cuántos días hacia el futuro puede reservar un usuario; el calendario permite seleccionar cualquier fecha futura.
- Un usuario puede cancelar una reserva futura en cualquier momento antes de su hora de inicio, sin una ventana mínima de anticipación.
- Un visitante sin sesión activa puede ver el listado estático de las 5 canchas, pero no la grilla de disponibilidad ni crear reservas.
- El club opera de 07:00 a 22:00; cualquier reserva creada antes de esta restricción sobre un bloque fuera de ese rango sigue mostrándose normalmente en el historial de "Mis Reservas", ya que la restricción de horario aplica a la creación de nuevas reservas, no a datos históricos.
- "Reserva activa" significa una reserva futura (aún no iniciada) que no ha sido cancelada; al cancelarla o al transcurrir su horario, el usuario queda habilitado para crear una nueva reserva.
