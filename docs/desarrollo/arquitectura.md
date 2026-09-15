# Arquitectura

## Las piezas

```
┌─────────────┐   HTTP/JSON    ┌──────────────┐   SQL    ┌─────────┐
│  Frontend   │ ◄────────────► │   Backend    │ ◄──────► │  MySQL  │
│ Vite + React│  :5173 → :8080 │ Go net/http  │          │  motek  │
│ (SPA)       │   JWT Bearer   │ + JWT HS256  │          │         │
└─────────────┘                └──────────────┘          └─────────┘
```

- **Frontend** (`frontend/`) — SPA React. No habla con MySQL nunca: todo pasa por la API. En desarrollo, Vite hace proxy de `/api` al backend, así el navegador ve un solo origen y no hay CORS.
- **Backend** (`backend/`) — API `net/http` estándar, sin framework. Capas: `api/` (HTTP: rutas, handlers, middleware) → `auth/` (JWT + bcrypt) → `store/` (SQL por dominio) → MySQL. Las dependencias se arman en `cmd/motek/main.go` y entran por constructor (`Server{Store, Auth}`).
- **MySQL** — ocho tablas, creadas por el propio backend al arrancar. Ver [Base de datos](base-de-datos.md).

## Backend por dentro

```
backend/
├── cmd/motek/main.go    # arma config → store → auth → server; HTTP con timeouts; apagado graceful
├── internal/
│   ├── config/          # lee el .env a un struct tipado
│   ├── api/             # Server, Routes(), handlers por dominio, middleware auth/CORS, JSON helpers
│   ├── auth/            # generar/validar JWT, hashear/verificar passwords
│   └── store/           # un archivo por dominio + models.go + migrate.go + errors.go
```

El flujo de un request: `Routes()` → `cors()` → `auth()` (salvo las 3 rutas públicas) → handler → `store` → MySQL. Los errores de dominio (`NotFoundError`, `ConflictError`) se traducen a status en un solo lugar (`writeStoreError`).

## Frontend por dentro

```
frontend/src/
├── api/          # cliente fetch + tipos espejo del backend
├── contexts/     # Auth, Theme, Resumen (datos del shell)
├── hooks/        # useCollection (listas)
├── lib/          # validate, format, errors, contador, resumen
├── components/   # primitivas + layout/ + ui/ + overlay/
└── pages/        # una por ruta
```

El flujo de una pantalla: la página pide con `api()` o `useCollection()`, el token viaja solo en el header, y el `ResumenProvider` del shell mantiene los contadores (badges, campana, tablero) actualizados ante cada escritura. Detalles en [Frontend](frontend.md).

## Decisiones que conviene no revertir sin pensarlo

1. **Los totales los calcula el servidor.** La factura suma mano de obra + líneas del lado del backend; el cliente nunca manda importes. Si el frontend calculara, dos clientes podrían facturar distinto la misma orden.
2. **Sin ORM.** El SQL está a la vista en `store/`, una función por operación. Más verboso, pero cada query es auditable y las transacciones son explícitas.
3. **Las facturas no se borran.** Solo se cancelan. Un documento fiscal no puede desaparecer: por eso los borrados en cascada se frenan ante una factura (ver [Reglas](reglas.md)).
4. **El token vive en `localStorage`.** Simple y suficiente para un taller; el logout es borrarlo. Si algún día hay XSS, esto es lo primero a revisar.
5. **Listas vacías son `[]`.** El backend nunca devuelve `null` en una lista y el frontend lo asume. No romper este contrato.