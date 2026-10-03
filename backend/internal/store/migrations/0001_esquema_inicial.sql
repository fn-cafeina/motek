-- Motek - migracion 0001: esquema inicial (baseline).
--
-- Este archivo reproduce el esquema original creado por Store.Migrate().
-- En bases existentes no hace nada (todas las tablas usan IF NOT EXISTS) y
-- queda registrada como aplicada en schema_migrations.
--
-- Separador de sentencias: una linea que contiene exactamente  -- ;;
-- (los triggers tienen punto y coma internos, por eso no se usa el ';').

CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ;;

CREATE TABLE IF NOT EXISTS clientes (
	id INT AUTO_INCREMENT PRIMARY KEY,
	nombre VARCHAR(255) NOT NULL,
	telefono VARCHAR(50) NOT NULL DEFAULT '',
	email VARCHAR(255) NOT NULL DEFAULT '',
	direccion VARCHAR(255) NOT NULL DEFAULT '',
	notas TEXT,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ;;

CREATE TABLE IF NOT EXISTS motos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	cliente_id INT NOT NULL,
	marca VARCHAR(100) NOT NULL DEFAULT '',
	modelo VARCHAR(100) NOT NULL DEFAULT '',
	anio INT NOT NULL DEFAULT 0,
	placa VARCHAR(20) NOT NULL DEFAULT '',
	color VARCHAR(50) NOT NULL DEFAULT '',
	vin VARCHAR(50) NOT NULL DEFAULT '',
	kilometraje INT NOT NULL DEFAULT 0,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- ;;

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
	id INT AUTO_INCREMENT PRIMARY KEY,
	cliente_id INT NOT NULL,
	moto_id INT NOT NULL,
	descripcion TEXT NOT NULL,
	diagnostico TEXT,
	estado VARCHAR(30) NOT NULL DEFAULT 'recibido',
	fecha_recibido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	fecha_entrega DATETIME NULL,
	total_mano_obra INT NOT NULL DEFAULT 0,
	notas TEXT,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
	FOREIGN KEY (moto_id) REFERENCES motos(id) ON DELETE CASCADE
);

-- ;;

CREATE TABLE IF NOT EXISTS repuestos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	codigo VARCHAR(50) NOT NULL UNIQUE,
	nombre VARCHAR(255) NOT NULL DEFAULT '',
	descripcion TEXT,
	categoria VARCHAR(100) NOT NULL DEFAULT '',
	precio_compra INT NOT NULL DEFAULT 0,
	precio_venta INT NOT NULL DEFAULT 0,
	stock INT NOT NULL DEFAULT 0,
	stock_minimo INT NOT NULL DEFAULT 5,
	ubicacion VARCHAR(100) NOT NULL DEFAULT '',
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ;;

CREATE TABLE IF NOT EXISTS orden_repuestos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	orden_id INT NOT NULL,
	repuesto_id INT NOT NULL,
	cantidad INT NOT NULL DEFAULT 1,
	precio_unitario INT NOT NULL DEFAULT 0,
	subtotal INT NOT NULL DEFAULT 0,
	FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
	FOREIGN KEY (repuesto_id) REFERENCES repuestos(id)
);

-- ;;

CREATE TABLE IF NOT EXISTS facturas (
	id INT AUTO_INCREMENT PRIMARY KEY,
	orden_id INT NOT NULL,
	subtotal_mano_obra INT NOT NULL DEFAULT 0,
	subtotal_repuestos INT NOT NULL DEFAULT 0,
	total INT NOT NULL DEFAULT 0,
	estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
	fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	fecha_vencimiento DATETIME NULL,
	notas TEXT,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE RESTRICT
);

-- ;;

CREATE TABLE IF NOT EXISTS pagos (
	id INT AUTO_INCREMENT PRIMARY KEY,
	factura_id INT NOT NULL,
	monto INT NOT NULL DEFAULT 0,
	metodo VARCHAR(30) NOT NULL DEFAULT 'efectivo',
	fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	notas TEXT,
	creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);
