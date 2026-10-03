# Tablero (Inicio)

La pantalla inicial resume el estado del taller. **Admin** y **Recepción** ven el tablero completo; el rol **Taller** ve un panel propio con sus órdenes.

## Tablero general (admin y recepción)

### Las cuatro tarjetas

| Tarjeta | Qué muestra | ¿Abre otra pantalla? |
|---|---|---|
| **Órdenes activas** | Cuántas órdenes tienen estado distinto de `entregado` y cuántas están en progreso. | No; muestra un resumen, no un desglose filtrable. |
| **Stock crítico** | Cuántos repuestos están en el mínimo o por debajo. | Sí, abre **Alertas**. |
| **Facturado este mes** | Suma de facturas no canceladas emitidas en el mes actual. | Sí, abre **Facturas**. |
| **Saldo por cobrar** | Suma de `total - pagos` de las facturas no canceladas: el saldo real pendiente. | Sí, abre **Facturas**. |

### Gráficos y rankings

- **Facturación de los últimos 6 meses**: barras comparadas de lo facturado (por fecha de emisión) y lo cobrado (por pagos).
- **Órdenes por estado**: dona con el total y la distribución por estado.
- **Top repuestos**: los cinco repuestos más consumidos, ordenados por monto.
- **Ranking de técnicos**: órdenes asignadas y total facturado de cada técnico.

Todo sale de `GET /api/reportes/tablero`, calculado por el servidor sobre vistas SQL.

### Listas

- **Últimas órdenes** muestra hasta las 8 órdenes más recientes, con descripción, cliente, fecha, estado y mano de obra. **Ver todas** abre **Órdenes**.
- **Repuestos bajo mínimo** muestra hasta las 6 alertas más urgentes, con stock actual y mínimo. **Ver todo** abre **Alertas**.

## Panel del taller (rol Taller)

Si entrás con una cuenta de taller, Inicio muestra **Mi taller**:

- Tarjetas con tus órdenes activas, en progreso, esperando repuestos y listas para entregar.
- **Mis órdenes en curso**, con el estado de cada una.
- **Repuestos bajo mínimo** con acceso a **Alertas**.

El panel no incluye información de facturación.

## Actualizar y estado inicial

Deslizá hacia abajo para actualizar los datos. Si todavía no hay órdenes ni facturas, aparece el mensaje **Todavía no hay movimiento** con un acceso a **Clientes**, aunque ya existan clientes o repuestos cargados.

Si hay facturas u órdenes pero falta alguna otra colección, la pantalla puede mostrar datos parciales junto con un aviso de error o carga.
