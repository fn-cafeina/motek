# Configuración

## Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env   # y completar
```

| Variable | Default | Qué es |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | Host de MySQL. |
| `DB_PORT` | `3306` | Puerto de MySQL. |
| `DB_USER` / `DB_PASSWORD` | — | Credenciales. Sin default: hay que ponerlas. |
| `DB_NAME` | `motek` | Base de uso. Hay que crearla: `CREATE DATABASE motek;`. |
| `JWT_SECRET` | — | **Requerido.** Firma los tokens. Sin esto el backend no arranca. En producción, largo y aleatorio. |
| `SERVER_PORT` | `8080` | Puerto de la API. |

Al arrancar: conecta, hace `Ping`, corre las migraciones (`CREATE TABLE IF NOT EXISTS` ×8) y sirve con timeouts de lectura 10s / escritura 15s / idle 60s. Se apaga graceful con SIGINT/SIGTERM (10s de gracia). Salud: `GET /health` → `200 {"status":"ok"}` (pública, sin token).

## Frontend (`frontend/.env`)

```bash
# VITE_API_URL=http://localhost:8080
```

Por defecto no hace falta: en desarrollo el dev server hace proxy de `/api` al backend en `localhost:8080`, mismo origen, sin CORS. Solo si el backend está en otro host se descomenta y se apunta. Solo las `VITE_*` llegan al navegador.

## Puertos (desarrollo)

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:8080` |
| MySQL | `127.0.0.1:3306` |

Si dos instancias del backend corren a la vez (pasó durante el desarrollo con `SERVER_PORT=8099`), los 409 de borrado pueden venir de la instancia vieja: verificar cuál responde antes de sospechar del código.