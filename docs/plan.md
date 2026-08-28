# Motek - Plan General

## 1. Descripción del sistema

**Motek** es un sistema web para la gestión integral de un taller mecánico especializado en motocicletas. Permite administrar clientes, registrar motos, gestionar órdenes de trabajo, controlar inventario de repuestos, facturar servicios y agendar citas.

**Usuario:** Propietario único del taller (single-user)
**Taller:** Una sola sucursal

---

## 2. Tech Stack

| Componente | Tecnología | Justificación |
|---|---|---|
| Backend | Go | Rendimiento, simplicidad, stdlib potente |
| Base de datos | MySQL | Base de datos robusta, estándar de la industria |
| HTTP Server | `net/http` stdlib | Go 1.22+ tiene routing por métodos |
| JSON | `encoding/json` stdlib | Suficiente para este alcance |
| Frontend | (Por definir) | SPA moderna |

**Decisiones clave:**
- Dinero en centavos (ENTEROS, no floats): $150.50 = `15050`
- IDs auto-incrementales (`INT AUTO_INCREMENT PRIMARY KEY`)
- Timestamps via MySQL `CURRENT_TIMESTAMP`
- Conexión a MySQL via `.env` (host, port, user, pass, dbname)

---

## 3. Fases de Desarrollo

| Fase | Nombre | Tablas | Endpoints | Descripción |
|---|---|---|---|---|
| 1 | Core | 3 | ~15 | Clientes, motos, órdenes de trabajo |
| 2 | Inventario | 2 | ~9 | Repuestos, stock, alertas |
| 3 | Facturación | 2 | ~8 | Facturas, pagos |
| 4 | Agenda + Reportes | 1 | ~12 | Citas, dashboard, métricas |
| **Total** | | **8** | **~44** | |

**Cada fase es independiente y usable por sí misma.**

Ver [workflow.md](workflow.md) para funcionalidades detalladas por fase.
Ver [schema.md](schema.md) para los schemas de base de datos.
Ver [api.md](api.md) para los endpoints.
Ver [models.md](models.md) para los structs Go.

---

## 4. Estructura del Proyecto

```
motek/
├── .env.example         # Variables de entorno (DB_HOST, DB_PORT, etc.)
├── backend/
│   ├── main.go           # Inicialización DB, arranque del servidor
│   ├── routes.go         # Todas las rutas HTTP
│   ├── db.go             # Conexión y migraciones
│   ├── models.go         # Todas las structs
│   ├── middleware.go      # CORS, logging, etc.
│   │
│   ├── clients/
│   │   ├── handlers.go
│   │   └── repository.go
│   ├── orders/
│   │   ├── handlers.go
│   │   └── repository.go
│   ├── inventory/
│   │   ├── handlers.go
│   │   └── repository.go
│   ├── billing/
│   │   ├── handlers.go
│   │   └── repository.go
│   ├── agenda/
│   │   ├── handlers.go
│   │   └── repository.go
│   └── reports/
│       └── handlers.go
│
├── docs/
│   ├── plan.md           # Este archivo
│   ├── schema.md         # Schemas de base de datos
│   ├── api.md            # Endpoints
│   ├── models.md         # Structs Go
│   ├── conventions.md    # Convenciones HTTP y validaciones
│   └── workflow.md       # Funcionalidades y flujos
├── .gitignore
├── LICENSE
└── README.md
```

---

## 5. Dependencias Externas

| Paquete | Propósito | Fase |
|---|---|---|
| `go-sql-driver/mysql` | Driver MySQL para Go | 1 |
