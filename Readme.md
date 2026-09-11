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

Claude Code es la herramienta basada en agentes que se utilizará durante el desarrollo.

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

---

## 📁 Estructura del Repositorio

```text
Spec Driven Development/
├── README.md              # Documentación y guía de herramientas del proyecto
└── <subcarpeta-proyecto>/ # Subcarpeta donde se desarrollará el proyecto en sí
```

---

## 🚀 Flujo de Trabajo con SDD

1. **Requisitos e Inicialización:** Configurar Git, Python, uv, Claude Code y Spec Kit.
2. **Generación de Especificaciones:** Utilizar Spec Kit dentro de Claude Code para crear los contratos y especificaciones técnicas.
3. **Desarrollo:** Crear la subcarpeta del proyecto e implementar la solución guiada por las especificaciones generadas.
