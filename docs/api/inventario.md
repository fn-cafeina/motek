# Inventario y alertas

## Repuestos

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/api/repuestos?q=&categoria=&bajo_stock=true` | Lista repuestos con filtros combinables. |
| `POST` | `/api/repuestos` | Crea un repuesto; `codigo` es obligatorio. |
| `GET` | `/api/repuestos/{id}` | Obtiene un repuesto. |
| `PUT` | `/api/repuestos/{id}` | Reemplaza los campos enviados; `codigo` es obligatorio. |
| `DELETE` | `/api/repuestos/{id}` | Responde `204`; un repuesto usado devuelve `409`. |

Filtros de `GET`:

- `q` busca parcialmente en nombre, código o descripción.
- `categoria` compara la categoría exacta.
- `bajo_stock=true` incluye únicamente `stock <= stock_minimo`. Otros valores no activan el filtro.

El código es único. El backend exige únicamente `codigo`; la interfaz Expo también exige `nombre` al crear o editar.

```bash
curl 'http://localhost:8080/api/repuestos?q=filtro&bajo_stock=true' \
  -H "Authorization: Bearer <token>"

curl -X POST http://localhost:8080/api/repuestos \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"codigo":"FIL-001","nombre":"Filtro de aceite","precio_venta":8500,"stock":10,"stock_minimo":5}'
```

Objeto de ejemplo:

```json
{"id":1,"codigo":"FIL-001","nombre":"Filtro de aceite","descripcion":"","categoria":"Motor","precio_compra":5000,"precio_venta":8500,"stock":10,"stock_minimo":5,"ubicacion":"Estante A1","creado_en":"2026-09-15T10:00:00Z","actualizado_en":"2026-09-15T10:00:00Z"}
```

La respuesta de creación puede no recargar todos los timestamps. Un código repetido devuelve `409 "codigo ya existe"`.

## Ajustar stock

```http
POST /api/repuestos/{id}/stock
Authorization: Bearer <token>
Content-Type: application/json

{"cantidad":10}
```

La cantidad positiva suma y la negativa resta. Si el resultado sería menor que cero, el backend responde `400 "stock no puede ser negativo"`. El endpoint devuelve `200 {"stock": 20}` con el valor nuevo. Una cantidad cero no cambia el stock; la interfaz Expo la rechaza antes de enviar.

El ajuste manual no reemplaza la validación del `PUT /api/repuestos/{id}`: ese endpoint escribe el campo `stock` directamente y no comprueba que el resultado sea no negativo. Evitá usar el PUT para corregir stock si el valor puede quedar por debajo de cero.

## Alertas

```http
GET /api/alertas/stock
Authorization: Bearer <token>
```

Devuelve los repuestos cuyo stock está en el mínimo o por debajo, ordenados de menor a mayor stock:

```json
[{"id":3,"codigo":"ESP-COR-UNI","nombre":"Espejo retrovisor universal","stock":1,"stock_minimo":5}]
```

La interfaz usa el campo `id` para llamar al ajuste. Algunas respuestas o clientes anteriores pueden usar `repuesto_id`; la pantalla contempla ambas formas.
