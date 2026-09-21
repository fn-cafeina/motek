# Motek

Sistema para taller mecánico especializado en motocicletas.

## Estructura

- `backend/` — API Go + MySQL + JWT (`http://localhost:8080`) — ver [backend/README.md](backend/README.md)
- `app/` — App React Native + Expo + UniWind — ver [app/AGENTS.md](app/AGENTS.md)
- `docs/` — documentación — ver [docs/README.md](docs/README.md)

## Documentación

- [`docs/`](docs/README.md) — [manual de usuario](docs/usuario/README.md), [referencia de la API](docs/api/README.md) y [guía de desarrollo](docs/desarrollo/README.md).

## Inicio rápido

```bash
# Backend
cp backend/.env.example backend/.env   # completar DB_* y JWT_SECRET
# CREATE DATABASE motek;
cd backend && go run ./cmd/motek

# App (otra terminal)
cd app && npm install && npx expo start
```

## Estructura del proyecto

```
.
├── app/        # App React Native (Expo + UniWind)
├── backend/   # ver backend/README.md
├── docs/      # ver docs/README.md
├── .gitignore # IDE/OS
└── README.md
```
