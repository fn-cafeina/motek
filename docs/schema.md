# Schema de Base de Datos

## Fase 1: Core

```sql
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(255) NOT NULL,
    telefono   VARCHAR(50) NOT NULL DEFAULT '',
    email      VARCHAR(255) NOT NULL DEFAULT '',
    direccion  VARCHAR(255) NOT NULL DEFAULT '',
    notas      TEXT,
    creado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS motos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id  INT NOT NULL,
    marca       VARCHAR(100) NOT NULL DEFAULT '',
    modelo      VARCHAR(100) NOT NULL DEFAULT '',
    anio        INT NOT NULL DEFAULT 0,
    placa       VARCHAR(20) NOT NULL DEFAULT '',
    color       VARCHAR(50) NOT NULL DEFAULT '',
    vin         VARCHAR(50) NOT NULL DEFAULT '',
    kilometraje INT NOT NULL DEFAULT 0,
    creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id      INT NOT NULL,
    moto_id         INT NOT NULL,
    descripcion     TEXT NOT NULL,
    diagnostico     TEXT,
    estado          VARCHAR(30) NOT NULL DEFAULT 'recibido',
    fecha_recibido  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega   DATETIME NULL,
    total_mano_obra INT NOT NULL DEFAULT 0,
    notas           TEXT,
    creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (moto_id) REFERENCES motos(id) ON DELETE CASCADE
);

CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_cliente ON ordenes_trabajo(cliente_id);
CREATE INDEX idx_ordenes_moto ON ordenes_trabajo(moto_id);
CREATE INDEX idx_motos_cliente ON motos(cliente_id);
```

---

## Fase 2: Inventario

```sql
CREATE TABLE IF NOT EXISTS repuestos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    codigo           VARCHAR(50) NOT NULL UNIQUE,
    nombre           VARCHAR(255) NOT NULL DEFAULT '',
    descripcion      TEXT,
    categoria        VARCHAR(100) NOT NULL DEFAULT '',
    precio_compra    INT NOT NULL DEFAULT 0,
    precio_venta     INT NOT NULL DEFAULT 0,
    stock            INT NOT NULL DEFAULT 0,
    stock_minimo     INT NOT NULL DEFAULT 5,
    ubicacion        VARCHAR(100) NOT NULL DEFAULT '',
    creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orden_repuestos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    orden_id         INT NOT NULL,
    repuesto_id      INT NOT NULL,
    cantidad         INT NOT NULL DEFAULT 1,
    precio_unitario  INT NOT NULL DEFAULT 0,
    subtotal         INT NOT NULL DEFAULT 0,
    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    FOREIGN KEY (repuesto_id) REFERENCES repuestos(id)
);

CREATE INDEX idx_repuestos_codigo ON repuestos(codigo);
CREATE INDEX idx_repuestos_categoria ON repuestos(categoria);
CREATE INDEX idx_orden_repuestos_orden ON orden_repuestos(orden_id);
```

---

## Fase 3: Facturación

```sql
CREATE TABLE IF NOT EXISTS facturas (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    orden_id             INT NOT NULL,
    subtotal_mano_obra   INT NOT NULL DEFAULT 0,
    subtotal_repuestos   INT NOT NULL DEFAULT 0,
    total                INT NOT NULL DEFAULT 0,
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_emision        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento    DATETIME NULL,
    notas                TEXT,
    creado_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pagos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    factura_id  INT NOT NULL,
    monto       INT NOT NULL DEFAULT 0,
    metodo      VARCHAR(30) NOT NULL DEFAULT 'efectivo',
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notas       TEXT,
    creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_orden ON facturas(orden_id);
CREATE INDEX idx_pagos_factura ON pagos(factura_id);
```
