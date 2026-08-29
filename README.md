# Motek

Sistema para taller mecánico especializado en motocicletas.

## Estructura

- `backend/` — API Go + MySQL + JWT (`http://localhost:8080`) — ver [backend/README.md](backend/README.md)
- `frontend/` — SPA Vite + React + Tailwind (`http://localhost:5173`) — ver [frontend/README.md](frontend/README.md)

## Inicio rápido

```bash
# Backend
cp backend/.env.example backend/.env   # completar DB_* y JWT_SECRET
# CREATE DATABASE motek;
cd backend && go build . && ./motek

# Frontend (otra terminal)
cp frontend/.env.example frontend/.env  # ajustar VITE_API_URL si hace falta
cd frontend && npm install && npm run dev
```

## Estructura del proyecto

```
.
├── backend/   # ver backend/README.md
├── frontend/  # ver frontend/README.md
├── .gitignore # IDE/OS
└── README.md
```
