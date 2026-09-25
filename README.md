# Motek

Sistema para administrar un taller mecánico especializado en motocicletas: clientes, motos, órdenes de trabajo, repuestos, alertas de stock, facturas y pagos.

## Estructura

- `backend/` — API HTTP en Go, MySQL y JWT. Ver [backend/README.md](backend/README.md).
- `app/` — aplicación Expo/React Native con Expo Router, Metro y UniWind. Ver [app/AGENTS.md](app/AGENTS.md).
- `docs/` — manual de usuario, referencia de la API y guía de desarrollo. Ver [docs/README.md](docs/README.md).

## Requisitos

- Go `1.26.5` para el backend.
- MySQL 8 compatible con el esquema del proyecto.
- Node.js y npm para la aplicación Expo SDK 57.

## Inicio rápido

### Backend

La base de datos debe existir antes de iniciar el servidor; las tablas se crean automáticamente.

```bash
mysql -u root -p -e "CREATE DATABASE motek;"
cp backend/.env.example backend/.env
```

Editá `backend/.env` con las credenciales de MySQL y un `JWT_SECRET` largo y aleatorio. Luego:

```bash
cd backend
go run ./cmd/motek
```

La API queda disponible, por defecto, en `http://localhost:8080`. `GET /health` es público y devuelve `200 {"status":"ok"}`.

### Aplicación

```bash
cp app/.env.example app/.env
cd app
npm install
npm start
```

`EXPO_PUBLIC_API_URL` apunta a la API y, por defecto, es `http://localhost:8080`. Para un teléfono físico o un emulador Android, usá la dirección LAN del equipo donde corre el backend; `localhost` apunta al propio dispositivo o emulador.

La aplicación tiene objetivos iOS, Android y web. Se pueden abrir con los scripts `npm run ios`, `npm run android` y `npm run web` cuando el entorno correspondiente está configurado.

## Comandos frecuentes

```bash
cd app
npm run lint
npx tsc --noEmit

cd ../backend
go test ./...
go vet ./...
```

Los tests del backend requieren MySQL y una base de pruebas separada. Podés Encontrar los detalles y la advertencia de limpieza en [Tests](docs/desarrollo/tests.md).

## Documentación

- [Manual de usuario](docs/usuario/README.md) — recorrido diario por las pantallas.
- [Referencia de la API](docs/api/README.md) — endpoints, autenticación, contratos y errores.
- [Guía de desarrollo](docs/desarrollo/README.md) — arquitectura, configuración, base de datos, reglas, diseño y pruebas.
