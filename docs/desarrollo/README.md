# Guía de desarrollo

Cómo está construido Motek y cómo trabajar en el backend y la aplicación Expo sin romper sus contratos.

## Índice

1. [Arquitectura](arquitectura.md) — piezas, capas y flujo de datos.
2. [Base de datos](base-de-datos.md) — esquema, relaciones y borrados.
3. [Reglas de negocio](reglas.md) — validaciones, estados y límites actuales.
4. [Frontend](frontend.md) — Expo Router, navegación, datos y componentes.
5. [Sistema visual](diseno.md) — tokens, responsive y convenciones visuales.
6. [Configuración](configuracion.md) — variables de entorno, red y plataformas.
7. [Tests](tests.md) — pruebas backend, lint/typecheck y verificación manual.

## Requisitos

- Go `1.26.5`.
- MySQL con una base creada antes de iniciar el backend.
- Node.js y npm para Expo SDK 57.

## Arranque

```bash
mysql -u root -p -e "CREATE DATABASE motek;"
cp backend/.env.example backend/.env
cd backend
go run ./cmd/motek
```

En otra terminal:

```bash
cp app/.env.example app/.env
cd app
npm install
npm start
```

La API usa `http://localhost:8080` por defecto y la aplicación usa `EXPO_PUBLIC_API_URL` para alcanzarla. En dispositivos físicos o emuladores Android, reemplazá `localhost` por la IP LAN de la máquina que ejecuta el backend.

## Comandos de la aplicación

```bash
cd app
npm start
npm run ios
npm run android
npm run web
npm run lint
npx tsc --noEmit
```

No existe un script `dev` de Vite ni un build de Vite: la aplicación usa Expo Router y Metro. Detalles en [Frontend](frontend.md).

## Comandos del backend

```bash
cd backend
go test ./...
go vet ./...
```

Los tests usan MySQL real y una base de pruebas. No apuntes `TEST_DB_NAME` a una base de producción: la suite ejecuta operaciones de limpieza sobre las ocho tablas. Más información en [Tests](tests.md).
