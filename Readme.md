# Spec Driven Development (SDD) - Curso Platzi

Este repositorio contiene la estructura y documentación para el proyecto de **Spec-Driven Development (SDD)** de Platzi.

---

## 📌 Descripción del Proyecto

El objetivo de este repositorio es aplicar la metodología **Spec-Driven Development (Desarrollo Guiado por Especificaciones)**. En esta raíz se documenta el entorno global y las herramientas requeridas, mientras que en una subcarpeta interna se creará e implementará el proyecto en sí.

---

## 🛠️ Herramientas y Requisitos

Para trabajar en este proyecto de SDD, utilizamos el siguiente conjunto de herramientas y programas.

> **Nota sobre el entorno:** Esta instalación se realizó en **WSL (Windows Subsystem for Linux) sobre Windows**, utilizando Ubuntu. Los comandos documentados corresponden a ese entorno. Si realizas la instalación directamente en Windows, sin WSL, los comandos y algunos pasos pueden ser diferentes.

### Git

Git permite gestionar las versiones del código y es un requisito para utilizar Spec Kit.

Instalación:

```bash
sudo apt update
sudo apt install -y git
```

Validación:

```bash
git --version
```

### Python

Python es requerido por Spec Kit para ejecutar algunos componentes internos.

Instalación:

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python-is-python3
```

Validación:

```bash
python --version
pip --version
```

### uv

`uv` es una herramienta para gestionar Python, entornos virtuales y paquetes.

Instalación:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Si es necesario, recarga la configuración de la terminal:

```bash
source "$HOME/.local/bin/env"
```

Validación:

```bash
uv --version
```

### Claude Code

Claude Code es un **agente de programación con IA** que puede utilizarse para trabajar con Spec Kit. Su instalación es opcional y solo es necesaria si eliges Claude Code como integración del proyecto.

Instalación:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Validación:

```bash
claude --version
```

### Spec Kit

Spec Kit es una herramienta *open-source* de GitHub que permite generar la estructura y las especificaciones técnicas del proyecto.

Instalación:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Validación:

```bash
specify --help
```

La instalación se considera correcta si cada comando de validación muestra la versión o la ayuda correspondiente sin errores.

### Selección del agente de programación con IA

Spec Kit permite trabajar con diferentes agentes de programación con IA. La opción `--integration` indica cuál utilizará el proyecto. Algunos ejemplos son:

```bash
# Claude Code
specify init spec-driven-project --integration claude

# GitHub Copilot
specify init spec-driven-project --integration copilot

# Codex CLI
specify init spec-driven-project --integration codex
```

Debes elegir una sola opción al crear el proyecto y tener instalada la herramienta correspondiente. Para consultar todas las integraciones disponibles en la versión instalada de Spec Kit, ejecuta:

```bash
specify integration list
```

### Inicialización del proyecto

Para crear la subcarpeta del proyecto utilizando la integración de Claude Code, ejecuta:

```bash
specify init spec-driven-project --integration claude
```

En este comando, `spec-driven-project` es el nombre de la carpeta que se creará para el proyecto. Se eligió este nombre porque describe claramente su propósito. No se recomienda utilizar `src`, ya que normalmente representa únicamente la carpeta del código fuente, ni `project`, porque es demasiado genérico.

---

## 📁 Estructura del Repositorio

```text
Spec Driven Development/
├── README.md              # Documentación y guía de herramientas del proyecto
└── spec-driven-project/   # Proyecto generado por Spec Kit
```

---

## 🚀 Flujo de Trabajo con SDD

1. **Requisitos e Inicialización:** Configurar Git, Python, uv, Claude Code y Spec Kit.
2. **Generación de Especificaciones:** Utilizar Spec Kit dentro de Claude Code para crear los contratos y especificaciones técnicas.
3. **Desarrollo:** Crear la subcarpeta del proyecto e implementar la solución guiada por las especificaciones generadas.

### Creación de la constitución del proyecto

La constitución es el documento que define las reglas principales del proyecto. Funciona como una guía permanente para el agente de IA y organiza el proyecto de principio a fin mediante seis pilares:

1. **Naturaleza del proyecto:** define qué es el proyecto, cuál es su propósito y qué problema busca resolver.
2. **Stack tecnológico:** establece las tecnologías, herramientas y reglas base de implementación.
3. **Reglas de dominio y lógica dura del negocio:** describe las reglas inmutables que la aplicación debe respetar y las condiciones que no pueden romperse.
4. **Estructura y estilo de código:** define cómo se organiza el proyecto, cómo se escribe el código y qué convenciones de nomenclatura se deben seguir.
5. **Manejo de errores y validaciones:** establece cómo validar los datos y cómo comunicar los errores sin exponer detalles técnicos al usuario final.
6. **Fuente de la verdad:** indica qué documento tiene autoridad sobre el comportamiento del sistema y frena al agente de IA ante contradicciones, evitando que implemente código que no esté respaldado por la especificación.

Estos seis pilares forman la anatomía de la constitución y sirven como referencia durante todas las etapas del desarrollo.

Para generarla, entra en la carpeta del proyecto y abre Claude Code:

```bash
cd ~/spec-driven-development/spec-driven-project
claude
```

Dentro de Claude Code, ejecuta el comando slash `/speckit-constitution` y pega el siguiente contenido. Es importante incluir la barra `/` al inicio, porque así Claude Code reconoce la skill como un comando invocable:

```markdown
# Constitución del Proyecto: Sistema de Reservas de Pádel

## 1. Naturaleza del Proyecto
Esta es una aplicación para la reserva de canchas de pádel. Su propósito es permitir a los usuarios autenticarse y gestionar reservas de tiempo en espacios específicos.

## 2. Stack Tecnológico (Reglas de Implementación)
- **Frontend / UI:** React. Usar Tailwind CSS para los estilos.
- **Backend:** Node.js con Express.
- **Base de Datos:** SQLite local (archivo `padel.db`). No usar ORMs pesados para mantener la simplicidad; usar `better-sqlite3` o sentencias SQL puras.
- **Lenguaje:** TypeScript en todo el stack.

## 3. Reglas de Dominio y Lógica de Negocio
Estas reglas son inmutables. El agente de IA debe respetarlas estrictamente:
- **Catálogo Cerrado:** El sistema SOLO maneja 5 canchas fijas: Cancha Laureles, Cancha El Poblado, Cancha Belén, Cancha Robledo y Cancha Envigado.
- **Bloques de Tiempo:** Las reservas operan en formato de 24 horas.
- **Prevención de Colisiones (Double-Booking):** Es la regla crítica del sistema. Bajo ninguna circunstancia se puede escribir una reserva en la base de datos sin validar primero que la cancha seleccionada esté libre en ese horario.
- **Autenticación:** Todo flujo de reserva exige que haya un usuario con sesión activa.

## 4. Estructura y Estilo de Código
- **Estructura Plana:** Evitar la sobreingeniería. No implementar "Clean Architecture" ni patrones complejos. Usar una estructura simple: `/frontend`, `/backend` y `/db`.
- **Estilo:** Priorizar la programación funcional y los componentes funcionales (Hooks en React). Evitar el uso de clases a menos que sea obligatorio.
- **Nomenclatura:** Usar `camelCase` para funciones/variables y `PascalCase` para Interfaces/Tipos.

## 5. Manejo de Errores y Validaciones
- **UI:** Nunca exponer errores crudos o *stack traces* al usuario final. Todo error técnico debe traducirse a un mensaje amigable (por ejemplo: "La cancha ya fue reservada en este horario").
- **Backend:** Retornar siempre códigos de estado HTTP semánticos (400 petición inválida, 401 no autenticado, 409 conflicto de reserva).

## 6. Comportamiento del Agente de IA (Reglas SDD)
- **Cero Código Sombra (Shadow Code):** Construye estrictamente lo documentado en `spec.md`. No añadas características "por si acaso" (no pasarelas de pago, no perfiles complejos, etc.).
- **Fuente de la Verdad:** Si una instrucción del usuario contradice esta constitución o si detectas una falla lógica, detente. Advierte del problema y solicita actualizar el `spec.md` antes de tocar el código fuente.
```

Al finalizar, Spec Kit guardará la constitución en `.specify/memory/constitution.md`. Este archivo debe mantenerse dentro del repositorio porque contiene las reglas compartidas del proyecto. Si el comando no aparece, cierra Claude Code y vuelve a abrirlo desde `spec-driven-project`, no desde la carpeta raíz `spec-driven-development`.
