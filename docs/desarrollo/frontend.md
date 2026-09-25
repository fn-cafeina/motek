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

El layout de `(app)` no usa `ProtectedRoute`: `AuthProvider` vive en el layout raíz y `(app)/_layout.tsx` hace `Redirect` a `/login` cuando no hay usuario.

## Shell responsive

El shell se define directamente en `app/src/app/(app)/_layout.tsx`.

- Desde 900 px de ancho muestra un sidebar con grupos **Taller** y **Administración**.
- En escritorio muestra el email y la inicial del usuario en el pie, el cierre de sesión y un botón para contraer el menú.
- En pantallas angostas muestra un encabezado con el título, un enlace de campana a `/alertas`, un icono de cierre de sesión y una barra inferior con las seis secciones.
- El colapso del sidebar es estado local de la sesión de la pantalla; no se persiste.

## Datos y sesión

- `lib/api.ts` — `api<T>(path, opts)`: agrega el token, codifica cuerpos JSON, usa una URL absoluta y aplica timeout de 15 segundos. Los `204` y cuerpos vacíos se convierten en `null`. Un `401` fuera de login, registro y `/me` borra el token.
- `lib/storage.ts` — guarda `motek_token` en `SecureStore` en iOS/Android y en `localStorage` en web.
- `lib/auth.tsx` — `AuthProvider` restaura la sesión con `GET /api/auth/me`, registra, inicia sesión y cierra sesión borrando el token.
- `hooks/useCollection.ts` — carga listas, normaliza `null` a `[]` y ofrece `load` y `refresh`.
- `lib/resumen.ts` — funciones puras para contar órdenes, calcular facturado del mes y agrupar facturas pendientes o parciales.

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
