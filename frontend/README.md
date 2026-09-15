# Motek — Frontend

SPA Vite + React + TypeScript + Tailwind CSS (v4) + React Router v8. API `VITE_API_URL` (default same-origin: el dev server hace proxy de `/api` a `http://localhost:8080`).

Documentación: [frontend](../docs/desarrollo/frontend.md), [sistema visual](../docs/desarrollo/diseno.md), [configuración](../docs/desarrollo/configuracion.md), [tests](../docs/desarrollo/tests.md) y [manual de usuario](../docs/usuario/README.md).

## Inicio rápido

```bash
cp .env.example .env   # ajustar VITE_API_URL solo si el backend no está en 8080
npm install
npm run dev            # http://localhost:5173
```

Backend debe estar corriendo (`cd ../backend && go run ./cmd/motek`).

## Comandos

```bash
npm run dev    # vite dev + proxy /api → :8080
npm run build  # tsc -b && vite build → dist/
npm run lint   # oxlint (0 warnings es la norma)
```

## Stack

- Vite 8 + `@vitejs/plugin-react` 6
- Tailwind 4 vía `@tailwindcss/vite` (sin `tailwind.config.js`, solo `@import "tailwindcss"` en `src/index.css`)
- `react-router` 8 (`createBrowserRouter` con lazy por página)
- `oxlint` para lint

## Env

`VITE_API_URL` — base del backend. Por defecto es same-origin: `vite.config.ts` hace proxy de `/api` al backend en `http://localhost:8080` durante el desarrollo, sin CORS. Solo `VITE_*` se expone al cliente.

## Estructura

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── index.css
│   ├── api/            # cliente fetch + tipos
│   ├── contexts/       # Auth, Theme, Resumen
│   ├── hooks/          # useCollection
│   ├── lib/            # format, validate, errors, contador, resumen
│   ├── components/     # primitivas (+ layout/, ui/, overlay/)
│   ├── pages/
│   └── vite-env.d.ts   # ImportMetaEnv { VITE_API_URL }
├── vite.config.ts
├── .env.example
├── index.html
└── .gitignore
```
