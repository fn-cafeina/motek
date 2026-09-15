# Inventario y alertas

## Repuestos

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/repuestos?q=&categoria=&bajo_stock=true` | `q` busca en nombre, código y descripción; `categoria` es exacta; `bajo_stock=true` trae solo los que están en el mínimo o por debajo. Se combinan. |
| POST | `/api/repuestos` | `codigo` obligatorio y único → `409 "codigo ya existe"`. |
| GET | `/api/repuestos/{id}` | `404 "repuesto no encontrado"`. |
| PUT | `/api/repuestos/{id}` | `codigo` obligatorio. |
| DELETE | `/api/repuestos/{id}` | `204`. Si se usó en alguna orden → `409 "no se puede eliminar: repuesto en uso"`. |

```bash
curl 'http://localhost:8080/api/repuestos?q=filtro&bajo_stock=true' \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:8080/api/repuestos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"codigo":"FIL-001","nombre":"Filtro de aceite","precio_venta":8500,"stock":10,"stock_minimo":5}'
```

Un repuesto:

```json
{"id":1,"codigo":"FIL-001","nombre":"Filtro de aceite","descripcion":"","categoria":"Motor","precio_compra":5000,"precio_venta":8500,"stock":10,"stock_minimo":5,"ubicacion":"Estante A1","creado_en":"2026-09-15T10:00:00Z","actualizado_en":"2026-09-15T10:00:00Z"}
```

## Ajustar stock

```http
POST /api/repuestos/{id}/stock
{"cantidad": 10}
```

Suma (positivo) o resta (negativo). No deja que el resultado sea negativo (`400 "stock insuficiente"` si corresponde). Devuelve `200 {"stock": 20}` con el valor nuevo.

Este es el movimiento manual —entrada de mercadería, corrección de conteo—. El consumo por trabajos descuenta desde la [orden](ordenes.md#repuestos-de-una-orden).

## Alertas

```http
GET /api/alertas/stock
```

→ `200` con los repuestos cuyo stock está en el mínimo o por debajo, ordenados del más bajo al menos bajo:

```json
[{"id":3,"codigo":"ESP-COR-UNI","nombre":"Espejo retrovisor universal","stock":1,"stock_minimo":5}]
```