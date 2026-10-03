# Autenticación

El backend genera tokens firmados con HMAC SHA-256 (`HS256`) y con 24 horas de vigencia. El secreto se configura con `JWT_SECRET`; ver [Configuración](../desarrollo/configuracion.md). La generación usa HS256; la implementación actual no documenta una restricción adicional del algoritmo durante la validación.

## Claims del token

El token contiene `user_id`, `iat` y `exp`. El rol no viaja en el token: el servidor resuelve la cuenta contra la base en cada pedido, así que un cambio de rol o una desactivación tienen efecto inmediato. El cliente solo necesita conservar la cadena completa y enviarla en cada endpoint protegido.

## Registrar

```http
POST /api/auth/register
Content-Type: application/json

{"email":"taller@motek.com","nombre":"Taller Central","password":"secreto123"}
```

Respuesta `201`:

```json
{"id":1,"email":"taller@motek.com","rol":"admin"}
```

Reglas actuales:

- Email y contraseña no pueden estar vacíos: `400 "email y password son requeridos"`.
- La contraseña debe tener al menos 6 caracteres: `400 "password debe tener al menos 6 caracteres"`.
- El email es único: `409 "email ya existe"`.
- El email solo se valida como no vacío; el backend no verifica su formato.
- La contraseña se guarda con bcrypt.
- `nombre` es opcional y se usa para mostrar en la interfaz.
- La primera cuenta de una base sin usuarios queda como `admin`; las siguientes se registran como `recepcionista`. Los roles se gestionan desde [Usuarios](usuarios.md).

## Iniciar sesión

```http
POST /api/auth/login
Content-Type: application/json

{"email":"taller@motek.com","password":"secreto123"}
```

Respuesta `200`:

```json
{"token":"eyJhbGciOi..."}
```

Un usuario inexistente y una contraseña incorrecta devuelven ambos `401 "credenciales invalidas"`. Un usuario desactivado con credenciales válidas recibe `403 "usuario desactivado"`.

## Usar el token

```http
Authorization: Bearer <token>
```

Todos los endpoints bajo `/api/*` requieren este header, excepto registro y login. `GET /api/auth/me` sí requiere token.

| Situación | Respuesta habitual |
|---|---|
| Sin header | `401 "token requerido"` |
| Prefijo distinto de `Bearer` | `401 "formato de token invalido"` |
| Token vencido, inválido o con error de firma | `401 "token invalido"` |
| Token válido de un usuario desactivado | `401 "usuario desactivado"` |

El prefijo `Bearer` se compara de forma sensible a mayúsculas.

## Quién soy

```http
GET /api/auth/me
Authorization: Bearer <token>
```

Respuesta `200`:

```json
{"id":1,"email":"taller@motek.com","nombre":"Taller Central","rol":"admin","activo":true,"creado_en":"2026-09-15T10:00:00Z"}
```

La respuesta nunca incluye la contraseña. `rol` y `activo` son los que usa la aplicación para mostrar la navegación y las acciones permitidas.

## Cerrar sesión

No existe un endpoint de logout. El cliente elimina el token almacenado; la aplicación lo hace mediante su función de sesión.
