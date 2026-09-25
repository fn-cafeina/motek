# Arquitectura

Motek tiene una aplicación cliente y una API que nunca comparte acceso directo a MySQL con ella.

## Las piezas

```text
┌──────────────────────────────┐       HTTP/JSON       ┌────────────────────────┐
│ app/                         │  ◄─────────────────► │ backend/               │
│ Expo + React Native          │   Authorization JWT  │ Go net/http            │
│ Expo Router + Metro + UniWind│                       │ store + auth + API     │
└──────────────────────────────┘                       └───────────┬────────────┘
                                                                       │ SQL
                                                                       ▼
                                                               ┌──────────────┐
                                                               │ MySQL        │
                                                               │ base motek   │
                                                               └──────────────┘
```

## Backend

```text
backend/
├── cmd/motek/main.go       # carga .env, wiring, servidor y apagado
├── internal/
│   ├── config/             # configuración leída del entorno
│   ├── auth/               # JWT HS256 y bcrypt
│   ├── api/                # router, middleware CORS/auth y handlers
│   └── store/              # modelos, migraciones y SQL por dominio
└── .env.example
```

`main.go` carga el `.env` con `godotenv`, valida `JWT_SECRET`, abre el store, crea `auth.Auth` y el `api.Server`, y configura timeouts HTTP y apagado ante `SIGINT`/`SIGTERM`.

El flujo de una solicitud es:

1. `Server.Routes()` construye el `http.ServeMux` y lo envuelve con CORS.
2. Las rutas públicas son `GET /health`, `POST /api/auth/register` y `POST /api/auth/login`.
3. El middleware `auth` valida `Authorization: Bearer <token>` y coloca `user_id` en el contexto de las rutas protegidas.
4. El handler valida el pedido, llama al `Store` y escribe JSON o un error.

CORS es fijo en esta versión: acepta cualquier origen y declara `GET, POST, PUT, PATCH, DELETE, OPTIONS`; un `OPTIONS` general responde `204` antes de la autenticación. El puerto sale de `SERVER_PORT`.

## Aplicación

```text
app/
├── app.json                # configuración Expo y targets iOS/Android/web
├── metro.config.js         # Metro integrado con UniWind
├── package.json
└── src/
    ├── app/                # rutas Expo Router
    │   ├── (auth)/         # login y registro
    │   └── (app)/          # shell y pantallas protegidas
    ├── components/ui/      # primitivas visuales
    ├── hooks/              # useCollection
    ├── lib/                # API, sesión, tipos, formato y cálculos
    └── global.css          # tokens y estilos globales
```

`app/src/app/_layout.tsx` crea `AuthProvider` y el `Stack`. El layout de `(app)` redirige a `/login` si no hay usuario y define la navegación responsive: sidebar desde 900 px y barra inferior en pantallas más angostas.

Cada pantalla carga sus colecciones con `useCollection` y usa `api<T>()` para lecturas puntuales y escrituras. `api.ts` agrega el token, serializa JSON, aplica un timeout de 15 segundos y convierte errores en `ApiError`. La aplicación no usa `ResumenProvider` ni eventos globales de mutación.

## Sesión y configuración

El token se guarda con la clave `motek_token`: en `SecureStore` en iOS/Android y en `localStorage` en web. `EXPO_PUBLIC_API_URL` define una URL absoluta; el valor por defecto es `http://localhost:8080`.

El tema sigue el del sistema mediante `Uniwind.setTheme("system")` y `userInterfaceStyle: "automatic"`; no hay selector ni persistencia de tema.

## Decisiones y límites actuales

- **Totales en el servidor:** la factura suma mano de obra y líneas de repuestos; el cliente no envía importes calculados.
- **SQL explícito:** no hay ORM; las consultas y transacciones están en `internal/store`.
- **Migraciones simples:** se ejecutan `CREATE TABLE IF NOT EXISTS` al abrir el store; no hay historial versionado.
- **Almacenamiento por plataforma:** SecureStore es la opción nativa; web usa `localStorage`.
- **CORS abierto:** es útil para desarrollo, pero no es una política de producción endurecida.
- **Filtrado local en la interfaz:** varias listas se filtran en memoria; el backend solo expone filtros en algunos endpoints.
