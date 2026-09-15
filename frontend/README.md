# Motek — Frontend

SPA Vite + React + TypeScript + Tailwind CSS (v4) + React Router v8. API `VITE_API_URL` (default same-origin: el dev server hace proxy de `/api` a `http://localhost:8080`). Documentación completa en [`docs/`](../docs/): [frontend](../docs/desarrollo/frontend.md), [sistema visual](../docs/desarrollo/diseno.md), [manual de usuario](../docs/usuario/README.md).

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

`VITE_API_URL` — base del backend. Por defecto es same-origin: `vite.config.ts` hace proxy de `/api` al backend en `http://localhost:8080` durante el desarrollo, sin CORS. Solo `VITE_*` se expone al cliente.

## Estructura

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── api/            # cliente fetch + tipos
│   ├── contexts/       # AuthContext
│   ├── hooks/          # useCollection
│   ├── lib/            # format, validate, errors
│   ├── components/     # UI compartida (+ ui/, layout/)
│   ├── pages/
│   └── vite-env.d.ts   # ImportMetaEnv { VITE_API_URL }
├── vite.config.ts
├── .env.example
├── index.html
└── .gitignore
```
