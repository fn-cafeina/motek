# Motek — Frontend

SPA Vite + React + TypeScript + Tailwind CSS (v4) + React Router v8. API `VITE_API_URL` (default `http://localhost:8080`).

## Inicio rápido

```bash
cp .env.example .env   # ajustar VITE_API_URL si el backend no está en 8080
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc -b && vite build → dist/
```

Backend debe estar corriendo (`cd ../backend && go build . && ./motek`).

## Stack

- Vite 8 + `@vitejs/plugin-react` 6
- Tailwind 4 vía `@tailwindcss/vite` (sin `tailwind.config.js`, solo `@import "tailwindcss"` en `src/index.css`)
- `react-router` 8 (`BrowserRouter` de `react-router`)
- `oxlint` para lint

## Env

`VITE_API_URL` — base del backend. Solo `VITE_*` se expone al cliente.

## Estructura

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── vite-env.d.ts   # ImportMetaEnv { VITE_API_URL }
├── vite.config.ts
├── .env.example
├── index.html
└── .gitignore
```
