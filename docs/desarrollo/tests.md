# Tests

## Backend

La suite es de nivel de ruta y usa el router real contra MySQL. Hay 77 funciones `Test*` en `internal/api`, además de `TestMain`.

```bash
cd backend
go test ./...
go vet ./...
```

### Requisitos y advertencia

- MySQL debe estar corriendo.
- `TEST_DB_NAME` debe apuntar a una base de pruebas; si no existe, se usa `motek_test`.
- Las credenciales vienen de `backend/.env` mediante `godotenv`.
- `TestMain` abre la base y ejecuta las migraciones.
- Los helpers de limpieza ejecutan `DELETE` sobre las nueve tablas de la base de pruebas; `auditoria` va al final porque los DELETE de las demás disparan sus triggers.

**Nunca ejecutes la suite contra una base de producción o una base compartida con datos que quieras conservar.** No hay mocks ni SQLite: los tests necesitan el comportamiento real de MySQL.

La cobertura existente incluye autenticación, CRUD de clientes y motos, órdenes y estados, repuestos y stock, facturas, pagos, duplicados, errores de validación y respuestas del router. También cubre roles y permisos (`403`), auditoría con usuario, reportes del tablero, PDF de factura y el estado `entregado` terminal. Revisá `backend/internal/api/*_test.go` para el detalle.

## Aplicación

No hay tests automatizados ni script de test en `package.json`. Las verificaciones disponibles son:

```bash
cd app
npm run lint
npx tsc --noEmit
```

Para una comprobación manual, cubrí:

- Login, registro, restauración de sesión y cierre de sesión.
- Ingreso con las tres cuentas de rol y navegación según permisos: taller no ve Facturas, Usuarios ni Historial; recepción no ve Usuarios ni Historial.
- Navegación en escritorio y móvil, incluyendo el breakpoint de 1024 px y el botón **Más** de la barra inferior.
- Alta y edición de clientes, motos, órdenes, repuestos, facturas y pagos.
- Pull-to-refresh, filtros, diálogos, modales y estados vacíos.
- Consumo y devolución de stock al agregar o quitar repuestos.
- Facturación de órdenes entregadas y el comportamiento de facturas canceladas.
- Tablero con gráficos, tablero kanban con drag & drop y el rebote de una orden `entregado`.
- Historial con filtros y el salto **Ver historial de la orden**.
- Botón **PDF** de una factura en web y en dispositivo o emulador.

Para validar dependencias y configuración de Expo, se puede ejecutar `npx expo-doctor` en un entorno de desarrollo. No hay un build de producción Vite: el bundler de la app es Expo/Metro.
