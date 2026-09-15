# Tests

## Backend

~55 tests a nivel de ruta (`internal/api/*_test.go`): levantan el router real con token y pegan contra MySQL de verdad. Cubren auth, CRUD por dominio, estados inválidos, duplicados (409), stock insuficiente, totales de factura y el ciclo de pagos.

```bash
cd backend
go test ./...
go vet ./...
```

Necesitan MySQL corriendo y la base de tests: `motek_test` (o `TEST_DB_NAME`), con las credenciales del `backend/.env`. El `TestMain` migra y limpia las 8 tablas entre tests. Sin base, no corren: no hay mocks ni sqlite.

## Frontend

Sin tests automatizados. La verificación es triple y manual:

```bash
cd frontend
npx tsc -b     # tipos (también corre en npm run build)
npx oxlint     # lint (0 warnings es la norma)
npm run build  # build de producción a dist/
```

Más recorrido en navegador en claro y oscuro (las seis pantallas, panel de orden, diálogo de motos, login y móvil 390px). Si algún día hay tests, los primeros que pagan son: el cálculo de totales de factura del lado del resumen, `textoContador` y la máquina de estados de pago.