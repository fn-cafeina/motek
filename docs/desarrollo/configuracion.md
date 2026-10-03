# Configuración

## Backend: `backend/.env`

`cmd/motek/main.go` carga el archivo `.env` desde el directorio de trabajo. Después lee las variables con `config.FromEnv()` y exige `JWT_SECRET`.

```bash
cp backend/.env.example backend/.env
```

| Variable | Default en código | Qué representa |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | Host de MySQL. |
| `DB_PORT` | `3306` | Puerto de MySQL. |
| `DB_USER` | — | Usuario de MySQL; hay que configurarlo. |
| `DB_PASSWORD` | — | Contraseña de MySQL; hay que configurarla. |
| `DB_NAME` | — | Base que debe existir. `motek` es solo el valor del ejemplo. |
| `JWT_SECRET` | — | Secreto para firmar JWT; obligatorio para el proceso normal. |
| `SERVER_PORT` | `8080` | Puerto del servidor HTTP. |

El store hace `Ping` a la base configurada y luego aplica las migraciones versionadas (ver [Base de datos](base-de-datos.md)). El servidor usa timeouts de lectura de 10 s, escritura de 15 s e idle de 60 s, y se apaga con `SIGINT` o `SIGTERM` esperando hasta 10 s.

### CORS y salud

El backend devuelve `Access-Control-Allow-Origin: *` y permite `GET, POST, PUT, PATCH, DELETE, OPTIONS` con headers `Content-Type` y `Authorization`. Los preflight responden `204`. `GET /health` es público y devuelve `200 {"status":"ok"}`.

## Aplicación: `app/.env`

```bash
cp app/.env.example app/.env
```

| Variable | Default | Qué representa |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8080` | URL absoluta de la API. |

Para iOS Simulator, web y un backend local, `localhost` puede servir. En un teléfono físico o emulador Android, usá la IP LAN del equipo que corre la API. No hay proxy Vite ni una variable `VITE_API_URL`; la app llama directamente a la URL configurada.

## Seed de desarrollo

```bash
cd backend
go run ./cmd/seed                 # crea los usuarios demo si faltan
go run ./cmd/seed -datos          # además genera datos de ejemplo
go run ./cmd/seed -reset -datos   # borra los datos de negocio y los regenera
```

Usuarios demo: `admin@motek.local` / `admin123`, `recepcion@motek.local` / `recepcion123`, `tecnico@motek.local` / `tecnico123` y `tecnico2@motek.local` / `tecnico123`. `-reset` borra pagos, facturas, líneas, repuestos, órdenes, motos y clientes; no toca los usuarios. `-datos` solo inserta si la tabla de clientes está vacía.

## Scripts de la aplicación

```bash
cd app
npm install
npm start
npm run ios
npm run android
npm run web
npm run lint
npx tsc --noEmit
```

`app.json` habilita objetivos iOS, Android y web, con Metro como bundler web y rutas tipadas de Expo. El servidor de desarrollo de Expo elige su puerto; no se debe asumir `5173`.

## Puertos y servicios

| Servicio | URL o puerto |
|---|---|
| API Motek | `http://localhost:8080` por defecto, o `SERVER_PORT`. |
| Expo Metro | Puerto que elige Expo; suele ser el 8081 en desarrollo. |
| MySQL | `127.0.0.1:3306` por defecto. |
| Servidor web de Expo | Puerto habilitado por Expo/Metro. |

## Variables de tests

`TEST_DB_NAME` solo se usa en la suite backend. Si no está definida, la suite usa `motek_test`. No la apuntes a una base de producción: ver la advertencia de [Tests](tests.md).
