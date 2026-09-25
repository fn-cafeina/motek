# Errores

## Formato de los handlers

La mayoría de los errores producidos por los handlers tienen esta forma:

```json
{"error":"mensaje"}
```

Los mensajes están en español y normalmente no llevan tildes. Por ejemplo:

```bash
curl http://localhost:8080/api/clientes/999 \
  -H 'Authorization: Bearer <token>'
# 404 {"error":"cliente no encontrado"}
```

No todos los errores pasan por ese helper: una ruta inexistente, un método no permitido o un redirect generado directamente por `net/http.ServeMux` puede responder texto plano, HTML o un código `307` y no pasar por autenticación. Un `OPTIONS` general responde `204` por CORS.

## Códigos

| Código | Cuándo ocurre |
|---|---|
| `200` | Lecturas, cambios de estado y actualizaciones. |
| `201` | Creaciones de recursos, líneas y pagos. |
| `204` | Borrados exitosos; sin cuerpo. |
| `307` | Redirect automático del `ServeMux` en algunas combinaciones de ruta y método. |
| `400` | JSON inválido, campos faltantes, valores inválidos o reglas de negocio del pedido. Ejemplos: `json invalido`, `id invalido`, `estado invalido`, `stock insuficiente`, `stock no puede ser negativo`, `monto debe ser mayor a 0`, `el pago excede el total de la factura`. |
| `401` | Falta el token, el prefijo no es `Bearer` o el token no valida. |
| `404` | El recurso no existe. Ejemplos: `cliente no encontrado`, `moto no encontrada`, `orden no encontrada`, `repuesto no encontrado`, `factura no encontrada`, `pago no encontrado`. |
| `405` | Método no permitido en una ruta conocida, según el comportamiento de `ServeMux`. |
| `409` | Conflicto con datos existentes o una operación bloqueada: `email ya existe`, `codigo ya existe`, `ya existe una factura para esta orden`, `no se puede eliminar: ...` o `repuesto en uso`. |
| `500` | Error inesperado del servidor. El mensaje puede ser específico del handler, como `error consultando clientes`, o genérico (`error interno`) cuando el error se traduce en `writeStoreError`. |

## Mensajes de validación frecuentes

- `email y password son requeridos`
- `password debe tener al menos 6 caracteres`
- `nombre es requerido`
- `marca es requerida`
- `codigo es requerido`
- `descripcion es requerida`
- `repuesto_id y cantidad son requeridos`
- `repuesto id invalido`
- `pago id invalido`

El cliente de la aplicación convierte un `401` fuera de login, registro y `/me` en cierre de sesión. Para un `500`, conservá el endpoint, el payload y el ID de la operación para poder investigar el error.
