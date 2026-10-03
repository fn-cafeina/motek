# Frontend

La aplicación es Expo SDK 57 con React Native 0.86, Expo Router, Metro, Tailwind CSS 4 y UniWind. Está escrita en TypeScript estricto y no es una SPA de Vite.

## Rutas

Las rutas viven en `app/src/app/`. Cada archivo dentro de `app/src/app/` es una pantalla o layout de Expo Router.

| Ruta | Pantalla | Contenido |
|---|---|---|
| `/login` | Iniciar sesión | Formulario de acceso y enlace a registro. |
| `/register` | Crear cuenta | Formulario de email y contraseña. |
| `/` | Inicio | Tablero con tarjetas, últimas órdenes y alertas. |
| `/ordenes` | Órdenes | Filtro por estado, tarjetas y modal de detalle. |
| `/clientes` | Clientes | Directorio, buscador y motos expandibles. |
| `/repuestos` | Repuestos | Inventario, búsqueda, filtro de stock y ajustes. |
| `/facturas` | Facturas | Filtro por estado, creación, edición y pagos. |
| `/alertas` | Alertas | Repuestos en stock mínimo o por debajo. |
| `/usuarios` | Usuarios | Cuentas, roles y activación (solo admin). |
| `/auditoria` | Historial | Timeline de cambios con filtros (solo admin). |

El layout de `(app)` no usa `ProtectedRoute`: `AuthProvider` vive en el layout raíz y `(app)/_layout.tsx` hace `Redirect` a `/login` cuando no hay usuario. La navegación se filtra por rol (cada ítem declara sus roles), una ruta fuera del alcance redirige a Inicio y en móvil la barra inferior muestra hasta cinco secciones con un botón **Más** para el resto.

## Shell responsive

El shell se define directamente en `app/src/app/(app)/_layout.tsx`.

- Desde 1024 px (`lg`) muestra un sidebar con grupos **Taller**, **Administración** y **Sistema** (Historial y Usuarios son solo para admin).
- En escritorio muestra el email y la inicial del usuario en el pie, el cierre de sesión y un botón para contraer el menú.
- El contenido se centra en un contenedor de `max-w-[1360px]` con padding `px-4 md:px-6 xl:px-8`; el encabezado de 52 px comparte ese contenedor y la barra inferior queda a todo lo ancho.
- En pantallas angostas muestra un encabezado con el título, un enlace de campana a `/alertas`, un icono de cierre de sesión y una barra inferior con hasta cinco secciones y un botón **Más** para las restantes.
- El colapso del sidebar es estado local de la sesión de la pantalla; no se persiste.
- Los umbrales de breakpoint viven en `app/src/lib/breakpoints.ts` (`BP` y `useBreakpoint()`); el resto del estilo responsivo se escribe con clases `md:`/`lg:`/`xl:`.

## Datos y sesión

- `lib/api.ts` — `api<T>(path, opts)`: agrega el token, codifica cuerpos JSON, usa una URL absoluta y aplica timeout de 15 segundos. Los `204` y cuerpos vacíos se convierten en `null`. Un `401` fuera de login, registro y `/me` borra el token.
- `lib/storage.ts` — guarda `motek_token` en `SecureStore` en iOS/Android y en `localStorage` en web.
- `lib/auth.tsx` — `AuthProvider` restaura la sesión con `GET /api/auth/me`, registra, inicia sesión y cierra sesión borrando el token.
- `hooks/useCollection.ts` — carga listas, normaliza `null` a `[]` y ofrece `load` y `refresh`.
- `lib/resumen.ts` — funciones puras para contar órdenes, calcular facturado del mes y agrupar facturas pendientes o parciales.
- `lib/permisos.ts` — matriz de permisos espejo del backend (`puede(rol, permiso)`) y helper `puedeOperarOrden`.
- `lib/pdf.ts` — abre la factura en PDF: en web descarga el blob autenticado y lo abre en una pestaña; en nativo lo descarga con `expo-file-system` y lo comparte con `expo-sharing`.
- `components/charts/` — `BarChart`, `DonutChart` y `HBars`, en SVG puro sobre `react-native-svg`, con los colores de los tokens pasados por props.
- `components/kanban/` — tablero con drag & drop por pulsación larga (`react-native-gesture-handler` + `react-native-reanimated`); el movimiento se confirma con `PATCH /estado` y el selector de estado del detalle queda como alternativa. `app/src/app/_layout.tsx` envuelve todo con `GestureHandlerRootView`.

No existe `ResumenProvider`, `api/client.ts`, `ProtectedRoute`, `Table`, `MobileList`, `Drawer`, `ConfirmDialog`, `Menu` ni eventos globales `motek:*` en esta versión. Las pantallas son las que orquestan sus propias colecciones y refrescos.

## Primitivas visuales

Las componentes compartidas están en `components/ui/`:

- `AuthCard`, `Card`, `Button`, `Field` y `SelectField` para formularios y superficies.
- `Dialog` para formularios y acciones; las fichas de orden y factura usan además un `Modal` deslizante.
- `Alert`, `Toast`, `EmptyState`, `Spinner` y `EstadoBadge` para estados y mensajes.
- `EstadoBadge` representa los estados de órdenes y facturas con etiqueta y punto, no solo con color.

Los botones tienen variantes `primary`, `secondary`, `ghost` y `danger`, con tamaños `sm` y `md`. Las listas usan `FlatList` y las acciones se acompañan de `lucide-react-native`.

## Estilos

`src/global.css` importa Tailwind y UniWind y define los tokens en `light` y `dark`. `metro.config.js` registra ese archivo como `cssEntryFile`. Las pantallas usan clases de utility y componentes React Native; no existen `index.css`, `buttonStyles.ts` ni `inputStyles.ts` de una versión web anterior.

## Configuración y comandos

```bash
cp .env.example .env
npm install
npm start
npm run ios
npm run android
npm run web
npm run lint
npx tsc --noEmit
```

`EXPO_PUBLIC_API_URL` apunta a la API y, si no está definido, se usa `http://localhost:8080`. En un dispositivo físico o emulador Android, `localhost` no apunta al equipo servidor: usá la IP LAN.

No hay script `dev`, `build` ni `oxlint`; Expo usa `expo start` y `expo lint`.
