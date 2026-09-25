# Tablero (Inicio)

La pantalla inicial carga órdenes, facturas, alertas de stock y clientes para resumir el estado del taller.

## Las cuatro tarjetas

| Tarjeta | Qué muestra | ¿Abre otra pantalla? |
|---|---|---|
| **Órdenes activas** | Cuántas órdenes tienen estado distinto de `entregado` y cuántas están en progreso. | No; muestra un resumen, no un desglose filtrable. |
| **Stock crítico** | Cuántos repuestos están en el mínimo o por debajo. | Sí, abre **Alertas**. |
| **Facturado este mes** | Suma de facturas no canceladas emitidas en el mes actual. | Sí, abre **Facturas**. |
| **Facturado sin cobrar** | Suma de los totales completos de facturas `pendiente` o `parcial`. | Sí, abre **Facturas**. |

**Importante:** la tarjeta “Facturado sin cobrar” no descuenta los pagos ya registrados. Para conocer el saldo real de una factura, abrí su detalle y restá los pagos.

## Listas

- **Últimas órdenes** muestra hasta las 8 órdenes más recientes, con descripción, cliente, fecha, estado y mano de obra. **Ver todas** abre **Órdenes**.
- **Repuestos bajo mínimo** muestra hasta las 6 alertas más urgentes, con stock actual y mínimo. **Ver todo** abre **Alertas**.

## Actualizar y estado inicial

Deslizá hacia abajo para actualizar las cuatro colecciones. Si todavía no hay órdenes ni facturas, aparece el mensaje **Todavía no hay movimiento** con un acceso a **Clientes**, aunque ya existan clientes o repuestos cargados.

Si hay facturas u órdenes pero falta alguna otra colección, la pantalla puede mostrar datos parciales junto con un aviso de error o carga.
