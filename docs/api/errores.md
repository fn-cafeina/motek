# Errores

## Formato

Siempre `{"error":"mensaje"}`, en español y sin tildes (así viaja igual por cualquier cliente):

```bash
curl http://localhost:8080/api/clientes/999 -H "Authorization: Bearer $TOKEN"
# → 404 {"error":"cliente no encontrado"}
```

## Códigos

| Código | Cuándo |
|---|---|
| `200` | Lecturas y actualizaciones. |
| `201` | Creaciones (cliente, orden, factura, pago, línea de repuesto...). |
| `204` | Borrados. Sin cuerpo. |
| `400` | El pedido está mal formado: falta un campo obligatorio (`"nombre es requerido"`), un valor es inválido (`"estado invalido"`, `"monto debe ser mayor a 0"`), el JSON no parsea (`"json invalido"`) o el id no es un número (`"id invalido"`). También reglas de negocio que son culpa del pedido: `"stock insuficiente"`, `"el pago excede el total de la factura"`, `"la factura ya esta cancelada"`. |
| `401` | Falta el token, está mal formado o venció. Ver [Autenticación](autenticacion.md#usar-el-token). |
| `404` | El recurso no existe: `"cliente no encontrado"`, `"orden no encontrada"`, etc. Crear una moto para un cliente inexistente también es 404. |
| `409` | El pedido está bien formado pero choca con algo que ya existe: `"email ya existe"`, `"codigo ya existe"`, `"ya existe una factura para esta orden"` o un borrado frenado por facturas (`"no se puede eliminar: el cliente tiene facturas emitidas"` y sus variantes para moto, orden y repuesto en uso). |
| `500` | Error del servidor (`"error interno"`). Si ves uno, es un bug: avisá con el request que lo provocó. |

La regla mnemotécnica: **400** "pediste mal", **404** "no existe", **409** "existe y molesta", **500** "se rompió algo nuestro".