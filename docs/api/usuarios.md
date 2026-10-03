# Usuarios y roles

Cada cuenta tiene un rol: `admin`, `recepcionista` o `tecnico`. El rol no viaja en el token: el servidor resuelve la cuenta contra la base en cada pedido, por lo que un cambio de rol o una desactivación tienen efecto inmediato.

## Roles y permisos

| Rol | Puede |
|---|---|
| `admin` | Todo: usuarios, historial de auditoría, facturación (incluida la cancelación), pagos (incluido el borrado), repuestos y ajustes de stock. |
| `recepcionista` | Clientes, motos, órdenes, facturación y pagos. No gestiona usuarios ni repuestos, no cancela facturas y no borra pagos. |
| `tecnico` | Solo sus órdenes asignadas: cambiar estado, guardar diagnóstico y agregar o quitar repuestos. Lectura de clientes, repuestos y alertas. |

La primera cuenta registrada en una base sin usuarios queda como `admin`. Los registros públicos posteriores crean cuentas `recepcionista`.

Cuando el rol no alcanza, la API responde `403 "no tenes permisos para esta accion"`.

## Endpoints

| Método | Ruta | Quién | Comportamiento |
|---|---|---|---|
| `GET` | `/api/usuarios?rol=tecnico` | admin, recepcionista | Lista cuentas ordenadas por id. El filtro `rol` es opcional y exacto. |
| `POST` | `/api/usuarios` | admin | Crea una cuenta. |
| `PATCH` | `/api/usuarios/{id}` | admin | Actualiza nombre, rol y estado activo. |

```bash
curl 'http://localhost:8080/api/usuarios?rol=tecnico' \
  -H "Authorization: Bearer <token>"
```

Respuesta `200`:

```json
[{"id":4,"email":"tecnico@motek.local","nombre":"Lucas Fernandez","rol":"tecnico","activo":true,"creado_en":"2026-09-20T10:00:00Z"}]
```

## Crear una cuenta

```http
POST /api/usuarios
Authorization: Bearer <token>
Content-Type: application/json

{"email":"nuevo@motek.local","nombre":"Persona Nueva","password":"secreto123","rol":"recepcionista"}
```

Reglas:

- `email` y `password` obligatorios; la contraseña necesita al menos 6 caracteres.
- `rol` tiene que ser uno de los tres valores: `400 "rol invalido"`.
- El email es único: `409 "email ya existe"`.

Responde `201`:

```json
{"id":6,"email":"nuevo@motek.local","rol":"recepcionista"}
```

## Editar una cuenta

```http
PATCH /api/usuarios/6
Authorization: Bearer <token>
Content-Type: application/json

{"nombre":"Persona Nueva","rol":"tecnico","activo":true}
```

- `activo: false` desactiva la cuenta: no puede iniciar sesión (`403 "usuario desactivado"`) y sus pedidos con un token vigente responden `401 "usuario desactivado"`.
- Un admin no puede cambiarse el rol ni desactivarse a sí mismo: `400 "no podes cambiar tu propio rol ni desactivarte"`.
- Desactivar o degradar a otro admin es válido siempre que quien lo haga siga siendo un admin activo.

La respuesta es la cuenta completa, incluido `nombre`, `rol` y `activo`.
