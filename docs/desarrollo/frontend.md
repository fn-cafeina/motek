# Frontend

SPA Vite + React 19 + TypeScript + Tailwind v4 + React Router 8. Todo en español.

## Rutas

| Ruta | Página | Qué hay |
|---|---|---|
| `/` | Inicio | Tablero: 4 tarjetas + últimas órdenes + bajo mínimo. |
| `/ordenes` | Órdenes | Filtro por estado en la URL (`?estado=`), tabla, ficha lateral con repuestos. |
| `/clientes` | Clientes | Buscador local, diálogo de motos por cliente. |
| `/repuestos` | Repuestos | Buscador + filtro de stock bajo, ajuste de stock. |
| `/facturas` | Facturas | Filtro por estado en la URL, ficha con pagos. |
| `/alertas` | Alertas | Stock crítico, diálogo de surtido. |
| `/login`, `/register` | Cuentas | Fuera del shell, tarjeta centrada. |

Las páginas de app cuelgan de `ProtectedRoute → Layout`; si no hay sesión, van a `/login`.

## El shell

`Layout` monta el `ResumenProvider` y compone `Sidebar` (desktop, colapsable con persistencia) + `Topbar` (título de la sección + campana + menú de cuenta con tema y salida) + `BottomNav` (móvil, las 6 secciones) + `<main>` con el contenido. El título de cada sección sale de `layout/nav.ts`, que también define grupos, iconos y qué contador lleva cada item.

## Capa de datos

- **`api/client.ts`** — `api<T>(path, opts)`: pone el token solo, aborta a los 15s, traduce fallos a `ApiError(status, message)`, convierte `204`/vacío en `null` y `null` en `[]`. Ante un 401 fuera de login/register/me: borra el token y emite `motek:unauthorized`, que desloguea.
- **`hooks/useCollection.ts`** — `useCollection(path, mensaje, params)`: `load()` con spinner para la primera carga, `refresh()` silencioso para reintentos y revalidaciones. Los params se serializan a query omitiendo vacíos.
- **Resumen** (`contexts/ResumenContext` + `lib/resumen.ts`) — carga en paralelo órdenes, facturas, alertas y clientes; se refresca al navegar y 250ms después de cada escritura (el cliente emite `motek:mutated` tras cada POST/PUT/PATCH/DELETE). De acá salen los badges, la campana, los KPIs del tablero, los totales sin filtrar y los conteos que usan los diálogos de borrado.
- **`lib/`** — `validate` (email, requerido, numérico), `format` (pesos `es-AR` sin decimales, fechas `dd/mm/aaaa` con cuidado de no correr el día por UTC-3), `errors` (`getErrorMessage`), `contador` (la frase única de los contadores: `"14 órdenes"` sin filtro, `"3 de 14"` con filtro).

## Primitivas (`components/`)

- **Overlays**: `Dialog` (formularios, foco al primer campo), `Drawer` (fichas de lectura, foco al panel), `ConfirmDialog` (destructivas; con `blocked` explica por qué no se puede y no ofrece confirmar), `Menu` (desplegables no modales con flechas). Comportamiento compartido en `overlay/useOverlayBehavior` (pila, trampa de tab, Escape, scroll-lock, devolución de foco).
- **Listas**: `Table` (desktop) + `MobileList` (móvil) —toda tabla tiene su versión apilada—; `FilterBar`, `SearchInput`, `FilterSelect`; `RowActions` (editar/borrar + acciones puntuales, siempre visibles por táctil).
- **Formularios**: `Form` (+ `FormGrid`, `FormActions` con pie fijo en móvil), `Field` (label + error/hint + slot derecho para el ojo de la contraseña).
- **Estados**: `Alert` (errores y avisos), `EmptyState` (vacíos con acción), `Skeleton`/`TableSkeleton`/`StatSkeleton` (cargas), `Badge`/`EstadoBadge` (etiquetas con punto, nunca solo color), `DataCard` (el contenedor de lista que orquesta toolbar → skeleton → error con reintento → vacío → contenido), `Toast` (éxito/error/info, 3s o 5s).
- **Estilos base**: `buttonClassName` (6 variantes, 40px táctil en móvil / 36px en desktop), `inputClassName` (16px en móvil para que iOS no haga zoom, 13px en desktop).

El sistema visual —tokens, escalas, temas— tiene su propia guía: [Diseño](diseno.md).

## Comandos

```bash
npm run dev      # http://localhost:5173 (proxy /api → :8080)
npm run build    # tsc -b && vite build → dist/
npm run lint     # oxlint
```