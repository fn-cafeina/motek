# Schema de Base de Datos

## Fase 1: Core

```sql
CREATE TABLE IF NOT EXISTS clientes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    telefono   TEXT NOT NULL DEFAULT '',
    email      TEXT NOT NULL DEFAULT '',
    direccion  TEXT NOT NULL DEFAULT '',
    notas      TEXT NOT NULL DEFAULT '',
    creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS motos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    marca       TEXT NOT NULL DEFAULT '',
    modelo      TEXT NOT NULL DEFAULT '',
    anio        INTEGER NOT NULL DEFAULT 0,
    placa       TEXT NOT NULL DEFAULT '',
    color       TEXT NOT NULL DEFAULT '',
    vin         TEXT NOT NULL DEFAULT '',
    kilometraje INTEGER NOT NULL DEFAULT 0,
    creado_en   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id      INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    moto_id         INTEGER NOT NULL REFERENCES motos(id) ON DELETE RESTRICT,
    descripcion     TEXT NOT NULL DEFAULT '',
    diagnostico     TEXT NOT NULL DEFAULT '',
    estado          TEXT NOT NULL DEFAULT 'recibido',
    fecha_recibido  TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_entrega   TEXT NOT NULL DEFAULT '',
    total_mano_obra INTEGER NOT NULL DEFAULT 0,
    notas           TEXT NOT NULL DEFAULT '',
    creado_en       TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes_trabajo(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_moto ON ordenes_trabajo(moto_id);
CREATE INDEX IF NOT EXISTS idx_motos_cliente ON motos(cliente_id);
```

---

## Fase 2: Inventario

```sql
CREATE TABLE IF NOT EXISTS repuestos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo           TEXT NOT NULL UNIQUE,
    nombre           TEXT NOT NULL DEFAULT '',
    descripcion      TEXT NOT NULL DEFAULT '',
    categoria        TEXT NOT NULL DEFAULT '',
    precio_compra    INTEGER NOT NULL DEFAULT 0,
    precio_venta     INTEGER NOT NULL DEFAULT 0,
    stock            INTEGER NOT NULL DEFAULT 0,
    stock_minimo     INTEGER NOT NULL DEFAULT 5,
    ubicacion        TEXT NOT NULL DEFAULT '',
    creado_en        TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orden_repuestos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id         INTEGER NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    repuesto_id      INTEGER NOT NULL REFERENCES repuestos(id),
    cantidad         INTEGER NOT NULL DEFAULT 1,
    precio_unitario  INTEGER NOT NULL DEFAULT 0,
    subtotal         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_repuestos_codigo ON repuestos(codigo);
CREATE INDEX IF NOT EXISTS idx_repuestos_categoria ON repuestos(categoria);
CREATE INDEX IF NOT EXISTS idx_orden_repuestos_orden ON orden_repuestos(orden_id);
```

---

## Fase 3: Facturación

```sql
CREATE TABLE IF NOT EXISTS counters (
    anio         INTEGER NOT NULL,
    consecutivo  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (anio)
);

CREATE TABLE IF NOT EXISTS facturas (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id             INTEGER NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE RESTRICT,
    numero               TEXT NOT NULL UNIQUE,
    subtotal_mano_obra   INTEGER NOT NULL DEFAULT 0,
    subtotal_repuestos   INTEGER NOT NULL DEFAULT 0,
    total                INTEGER NOT NULL DEFAULT 0,
    estado               TEXT NOT NULL DEFAULT 'pendiente',
    fecha_emision        TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_vencimiento    TEXT NOT NULL DEFAULT '',
    notas                TEXT NOT NULL DEFAULT '',
    creado_en            TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pagos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    factura_id  INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    monto       INTEGER NOT NULL DEFAULT 0,
    metodo      TEXT NOT NULL DEFAULT 'efectivo',
    fecha       TEXT NOT NULL DEFAULT (datetime('now')),
    notas       TEXT NOT NULL DEFAULT '',
    creado_en   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_orden ON facturas(orden_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON pagos(factura_id);
```

---

## Fase 4: Agenda

```sql
CREATE TABLE IF NOT EXISTS citas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
    moto_id        INTEGER NOT NULL REFERENCES motos(id),
    orden_id       INTEGER REFERENCES ordenes_trabajo(id),
    titulo         TEXT NOT NULL DEFAULT '',
    fecha_inicio   TEXT NOT NULL,
    fecha_fin      TEXT NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'programada',
    notas          TEXT NOT NULL DEFAULT '',
    creado_en      TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
```
