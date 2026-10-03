# Reportes

## Resumen del tablero

| Método | Ruta | Quién | Comportamiento |
|---|---|---|---|
| `GET` | `/api/reportes/tablero` | admin, recepcionista | Devuelve los agregados del tablero en una sola respuesta. |

Los datos salen de vistas SQL (`v_ordenes_estado`, `v_facturacion_mensual`, `v_ingresos_mensuales`, `v_top_repuestos`, `v_ranking_tecnicos`); ver [Base de datos](../desarrollo/base-de-datos.md).

```bash
curl http://localhost:8080/api/reportes/tablero \
  -H "Authorization: Bearer <token>"
```

Respuesta `200` (resumida):

```json
{
  "ordenes_por_estado":[{"estado":"recibido","cantidad":4},{"estado":"entregado","cantidad":38}],
  "facturacion_mensual":[{"mes":"2026-07","total":440000}],
  "ingresos_mensuales":[{"mes":"2026-07","total":576500}],
  "top_repuestos":[{"id":4,"codigo":"MO-201","nombre":"Filtro de aceite","unidades":12,"monto":78000}],
  "ranking_tecnicos":[{"id":4,"nombre":"Lucas Fernandez","ordenes":21,"facturado":1750600}],
  "saldo_por_cobrar":1714500,
  "facturas_sin_cobrar":9
}
```

Detalles:

- Las series mensuales cubren los últimos 6 meses (mes actual incluido) y usan el formato `AAAA-MM`.
- `facturacion_mensual` suma facturas no canceladas por fecha de emisión; `ingresos_mensuales` suma pagos por fecha.
- `saldo_por_cobrar` es la suma de `total - pagos` de las facturas no canceladas: es el saldo real, no el total facturado. `facturas_sin_cobrar` cuenta esas facturas.
- `ranking_tecnicos` incluye a todos los usuarios con rol `tecnico`, con sus órdenes asignadas y el total facturado de esas órdenes.
- El rol `tecnico` no tiene acceso a este endpoint (`403 "no tenes permisos para esta accion"`).
