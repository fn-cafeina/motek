# Auditoría (historial de cambios)

La tabla `auditoria` registra cada creación, edición y borrado de las tablas de negocio. Los registros los escriben triggers de MySQL: no dependen de que un handler se acuerde de insertarlos. El usuario sale de la variable de sesión `@motek_usuario_id`, que el backend publica dentro de la misma transacción que hace la escritura; si no hay usuario (seeds o tareas manuales) queda `NULL`.

Tablas auditadas: `clientes`, `motos`, `ordenes_trabajo`, `orden_repuestos`, `repuestos`, `facturas` y `pagos`.

## Endpoint

| Método | Ruta | Quién | Comportamiento |
|---|---|---|---|
| `GET` | `/api/auditoria` | admin | Lista eventos de más nuevo a más viejo, con filtros opcionales. |

Parámetros:

| Parámetro | Efecto |
|---|---|
| `tabla` | Tabla exacta (`ordenes_trabajo`, `facturas`, ...). |
| `registro_id` | ID del registro dentro de esa tabla. |
| `usuario_id` | Cuenta que hizo el cambio. |
| `desde` / `hasta` | Rango de fechas (`AAAA-MM-DD`); `hasta` incluye todo el día. |
| `limite` | Máximo de filas; por defecto 200 y tope 500. |

```bash
curl 'http://localhost:8080/api/auditoria?tabla=ordenes_trabajo&registro_id=16' \
  -H "Authorization: Bearer <token>"
```

Respuesta `200`:

```json
[{
  "id":128,
  "usuario_id":3,
  "usuario_nombre":"Sofia Ramirez",
  "usuario_email":"recepcion@example.com",
  "tabla":"ordenes_trabajo",
  "registro_id":16,
  "accion":"editar",
  "datos_antes":{"estado":"recibido","diagnostico":""},
  "datos_despues":{"estado":"en_progreso","diagnostico":"Revision de frenos"},
  "fecha":"2026-10-02T18:24:11Z"
}]
```

`accion` es `crear`, `editar` o `borrar`. En una creación `datos_antes` es `null`; en un borrado, `datos_despues` es `null`. Los objetos JSON incluyen las columnas de la tabla en el momento del cambio.

## Notas

- Las cascadas de claves foráneas de MySQL no disparan triggers: borrar un cliente en cascada deja el evento del cliente, no uno por cada moto u orden eliminada.
- Los borrados de la suite de tests y de las tareas de mantenimiento quedan registrados con `usuario_id` `NULL`.
- La pantalla **Historial** de la aplicación usa este endpoint; ver [Historial](../usuario/historial.md).
- El detalle del esquema y los triggers está en [Base de datos](../desarrollo/base-de-datos.md).

## Errores

| Código | Mensaje | Cuándo |
|---|---|---|
| `400` | `registro_id invalido`, `usuario_id invalido`, `limite invalido` | Parámetros mal formados. |
| `403` | `no tenes permisos para esta accion` | Un rol distinto de admin. |
