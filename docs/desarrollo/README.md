# Guía de desarrollo

Cómo está construido Motek y cómo trabajar en él sin romperlo.

## Índice

1. [Arquitectura](arquitectura.md) — las piezas y cómo se hablan.
2. [Base de datos](base-de-datos.md) — tablas, relaciones y qué pasa al borrar.
3. [Reglas de negocio](reglas.md) — lo que el servidor garantiza pase lo que pase.
4. [Frontend](frontend.md) — shell, páginas, primitivas y capa de datos.
5. [Sistema visual](diseno.md) — tokens, escalas y cómo agregar un componente.
6. [Configuración](configuracion.md) — variables de entorno, puertos y base de datos.
7. [Tests](tests.md) — qué hay y cómo correrlos.

## Para empezar

```bash
# Backend (terminal 1)
cp backend/.env.example backend/.env   # completar DB_* y JWT_SECRET
# CREATE DATABASE motek;
cd backend && go run ./cmd/motek       # http://localhost:8080

# Frontend (terminal 2)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Las tablas se crean solas al arrancar el backend. Detalles en [Configuración](configuracion.md).