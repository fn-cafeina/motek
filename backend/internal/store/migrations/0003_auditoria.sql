-- Motek - migracion 0003: auditoria de cambios con triggers.
--
-- Los triggers leen la variable de sesion @motek_usuario_id, que el backend
-- publica dentro de la misma transaccion que hace la escritura. Si no hay
-- usuario (seeds, tareas de mantenimiento) queda NULL.

CREATE TABLE IF NOT EXISTS auditoria (
	id INT AUTO_INCREMENT PRIMARY KEY,
	usuario_id INT NULL,
	tabla VARCHAR(64) NOT NULL,
	registro_id INT NOT NULL,
	accion VARCHAR(10) NOT NULL,
	datos_antes JSON NULL,
	datos_despues JSON NULL,
	fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL,
	CONSTRAINT chk_auditoria_accion CHECK (accion IN ('crear', 'editar', 'borrar'))
);

-- ;;

DROP TRIGGER IF EXISTS trg_clientes_insert;
-- ;;
CREATE TRIGGER trg_clientes_insert AFTER INSERT ON clientes FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'clientes', NEW.id, 'crear',
	JSON_OBJECT('nombre', NEW.nombre, 'telefono', NEW.telefono, 'email', NEW.email, 'direccion', NEW.direccion, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_clientes_update;
-- ;;
CREATE TRIGGER trg_clientes_update AFTER UPDATE ON clientes FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'clientes', NEW.id, 'editar',
	JSON_OBJECT('nombre', OLD.nombre, 'telefono', OLD.telefono, 'email', OLD.email, 'direccion', OLD.direccion, 'notas', OLD.notas),
	JSON_OBJECT('nombre', NEW.nombre, 'telefono', NEW.telefono, 'email', NEW.email, 'direccion', NEW.direccion, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_clientes_delete;
-- ;;
CREATE TRIGGER trg_clientes_delete AFTER DELETE ON clientes FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'clientes', OLD.id, 'borrar',
	JSON_OBJECT('nombre', OLD.nombre, 'telefono', OLD.telefono, 'email', OLD.email, 'direccion', OLD.direccion, 'notas', OLD.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_motos_insert;
-- ;;
CREATE TRIGGER trg_motos_insert AFTER INSERT ON motos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'motos', NEW.id, 'crear',
	JSON_OBJECT('cliente_id', NEW.cliente_id, 'marca', NEW.marca, 'modelo', NEW.modelo, 'anio', NEW.anio, 'placa', NEW.placa, 'color', NEW.color, 'vin', NEW.vin, 'kilometraje', NEW.kilometraje)
);

-- ;;
DROP TRIGGER IF EXISTS trg_motos_update;
-- ;;
CREATE TRIGGER trg_motos_update AFTER UPDATE ON motos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'motos', NEW.id, 'editar',
	JSON_OBJECT('cliente_id', OLD.cliente_id, 'marca', OLD.marca, 'modelo', OLD.modelo, 'anio', OLD.anio, 'placa', OLD.placa, 'color', OLD.color, 'vin', OLD.vin, 'kilometraje', OLD.kilometraje),
	JSON_OBJECT('cliente_id', NEW.cliente_id, 'marca', NEW.marca, 'modelo', NEW.modelo, 'anio', NEW.anio, 'placa', NEW.placa, 'color', NEW.color, 'vin', NEW.vin, 'kilometraje', NEW.kilometraje)
);

-- ;;
DROP TRIGGER IF EXISTS trg_motos_delete;
-- ;;
CREATE TRIGGER trg_motos_delete AFTER DELETE ON motos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'motos', OLD.id, 'borrar',
	JSON_OBJECT('cliente_id', OLD.cliente_id, 'marca', OLD.marca, 'modelo', OLD.modelo, 'anio', OLD.anio, 'placa', OLD.placa, 'color', OLD.color, 'vin', OLD.vin, 'kilometraje', OLD.kilometraje)
);

-- ;;
DROP TRIGGER IF EXISTS trg_ordenes_trabajo_insert;
-- ;;
CREATE TRIGGER trg_ordenes_trabajo_insert AFTER INSERT ON ordenes_trabajo FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'ordenes_trabajo', NEW.id, 'crear',
	JSON_OBJECT('cliente_id', NEW.cliente_id, 'moto_id', NEW.moto_id, 'tecnico_id', NEW.tecnico_id, 'descripcion', NEW.descripcion, 'diagnostico', NEW.diagnostico, 'estado', NEW.estado, 'fecha_recibido', NEW.fecha_recibido, 'fecha_entrega', NEW.fecha_entrega, 'total_mano_obra', NEW.total_mano_obra, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_ordenes_trabajo_update;
-- ;;
CREATE TRIGGER trg_ordenes_trabajo_update AFTER UPDATE ON ordenes_trabajo FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'ordenes_trabajo', NEW.id, 'editar',
	JSON_OBJECT('cliente_id', OLD.cliente_id, 'moto_id', OLD.moto_id, 'tecnico_id', OLD.tecnico_id, 'descripcion', OLD.descripcion, 'diagnostico', OLD.diagnostico, 'estado', OLD.estado, 'fecha_recibido', OLD.fecha_recibido, 'fecha_entrega', OLD.fecha_entrega, 'total_mano_obra', OLD.total_mano_obra, 'notas', OLD.notas),
	JSON_OBJECT('cliente_id', NEW.cliente_id, 'moto_id', NEW.moto_id, 'tecnico_id', NEW.tecnico_id, 'descripcion', NEW.descripcion, 'diagnostico', NEW.diagnostico, 'estado', NEW.estado, 'fecha_recibido', NEW.fecha_recibido, 'fecha_entrega', NEW.fecha_entrega, 'total_mano_obra', NEW.total_mano_obra, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_ordenes_trabajo_delete;
-- ;;
CREATE TRIGGER trg_ordenes_trabajo_delete AFTER DELETE ON ordenes_trabajo FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'ordenes_trabajo', OLD.id, 'borrar',
	JSON_OBJECT('cliente_id', OLD.cliente_id, 'moto_id', OLD.moto_id, 'tecnico_id', OLD.tecnico_id, 'descripcion', OLD.descripcion, 'diagnostico', OLD.diagnostico, 'estado', OLD.estado, 'fecha_recibido', OLD.fecha_recibido, 'fecha_entrega', OLD.fecha_entrega, 'total_mano_obra', OLD.total_mano_obra, 'notas', OLD.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_orden_repuestos_insert;
-- ;;
CREATE TRIGGER trg_orden_repuestos_insert AFTER INSERT ON orden_repuestos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'orden_repuestos', NEW.id, 'crear',
	JSON_OBJECT('orden_id', NEW.orden_id, 'repuesto_id', NEW.repuesto_id, 'cantidad', NEW.cantidad, 'precio_unitario', NEW.precio_unitario, 'subtotal', NEW.subtotal)
);

-- ;;
DROP TRIGGER IF EXISTS trg_orden_repuestos_update;
-- ;;
CREATE TRIGGER trg_orden_repuestos_update AFTER UPDATE ON orden_repuestos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'orden_repuestos', NEW.id, 'editar',
	JSON_OBJECT('orden_id', OLD.orden_id, 'repuesto_id', OLD.repuesto_id, 'cantidad', OLD.cantidad, 'precio_unitario', OLD.precio_unitario, 'subtotal', OLD.subtotal),
	JSON_OBJECT('orden_id', NEW.orden_id, 'repuesto_id', NEW.repuesto_id, 'cantidad', NEW.cantidad, 'precio_unitario', NEW.precio_unitario, 'subtotal', NEW.subtotal)
);

-- ;;
DROP TRIGGER IF EXISTS trg_orden_repuestos_delete;
-- ;;
CREATE TRIGGER trg_orden_repuestos_delete AFTER DELETE ON orden_repuestos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'orden_repuestos', OLD.id, 'borrar',
	JSON_OBJECT('orden_id', OLD.orden_id, 'repuesto_id', OLD.repuesto_id, 'cantidad', OLD.cantidad, 'precio_unitario', OLD.precio_unitario, 'subtotal', OLD.subtotal)
);

-- ;;
DROP TRIGGER IF EXISTS trg_repuestos_insert;
-- ;;
CREATE TRIGGER trg_repuestos_insert AFTER INSERT ON repuestos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'repuestos', NEW.id, 'crear',
	JSON_OBJECT('codigo', NEW.codigo, 'nombre', NEW.nombre, 'categoria', NEW.categoria, 'precio_compra', NEW.precio_compra, 'precio_venta', NEW.precio_venta, 'stock', NEW.stock, 'stock_minimo', NEW.stock_minimo, 'ubicacion', NEW.ubicacion)
);

-- ;;
DROP TRIGGER IF EXISTS trg_repuestos_update;
-- ;;
CREATE TRIGGER trg_repuestos_update AFTER UPDATE ON repuestos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'repuestos', NEW.id, 'editar',
	JSON_OBJECT('codigo', OLD.codigo, 'nombre', OLD.nombre, 'categoria', OLD.categoria, 'precio_compra', OLD.precio_compra, 'precio_venta', OLD.precio_venta, 'stock', OLD.stock, 'stock_minimo', OLD.stock_minimo, 'ubicacion', OLD.ubicacion),
	JSON_OBJECT('codigo', NEW.codigo, 'nombre', NEW.nombre, 'categoria', NEW.categoria, 'precio_compra', NEW.precio_compra, 'precio_venta', NEW.precio_venta, 'stock', NEW.stock, 'stock_minimo', NEW.stock_minimo, 'ubicacion', NEW.ubicacion)
);

-- ;;
DROP TRIGGER IF EXISTS trg_repuestos_delete;
-- ;;
CREATE TRIGGER trg_repuestos_delete AFTER DELETE ON repuestos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'repuestos', OLD.id, 'borrar',
	JSON_OBJECT('codigo', OLD.codigo, 'nombre', OLD.nombre, 'categoria', OLD.categoria, 'precio_compra', OLD.precio_compra, 'precio_venta', OLD.precio_venta, 'stock', OLD.stock, 'stock_minimo', OLD.stock_minimo, 'ubicacion', OLD.ubicacion)
);

-- ;;
DROP TRIGGER IF EXISTS trg_facturas_insert;
-- ;;
CREATE TRIGGER trg_facturas_insert AFTER INSERT ON facturas FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'facturas', NEW.id, 'crear',
	JSON_OBJECT('orden_id', NEW.orden_id, 'subtotal_mano_obra', NEW.subtotal_mano_obra, 'subtotal_repuestos', NEW.subtotal_repuestos, 'total', NEW.total, 'estado', NEW.estado, 'fecha_emision', NEW.fecha_emision, 'fecha_vencimiento', NEW.fecha_vencimiento, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_facturas_update;
-- ;;
CREATE TRIGGER trg_facturas_update AFTER UPDATE ON facturas FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'facturas', NEW.id, 'editar',
	JSON_OBJECT('orden_id', OLD.orden_id, 'subtotal_mano_obra', OLD.subtotal_mano_obra, 'subtotal_repuestos', OLD.subtotal_repuestos, 'total', OLD.total, 'estado', OLD.estado, 'fecha_emision', OLD.fecha_emision, 'fecha_vencimiento', OLD.fecha_vencimiento, 'notas', OLD.notas),
	JSON_OBJECT('orden_id', NEW.orden_id, 'subtotal_mano_obra', NEW.subtotal_mano_obra, 'subtotal_repuestos', NEW.subtotal_repuestos, 'total', NEW.total, 'estado', NEW.estado, 'fecha_emision', NEW.fecha_emision, 'fecha_vencimiento', NEW.fecha_vencimiento, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_facturas_delete;
-- ;;
CREATE TRIGGER trg_facturas_delete AFTER DELETE ON facturas FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'facturas', OLD.id, 'borrar',
	JSON_OBJECT('orden_id', OLD.orden_id, 'subtotal_mano_obra', OLD.subtotal_mano_obra, 'subtotal_repuestos', OLD.subtotal_repuestos, 'total', OLD.total, 'estado', OLD.estado, 'fecha_emision', OLD.fecha_emision, 'fecha_vencimiento', OLD.fecha_vencimiento, 'notas', OLD.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_pagos_insert;
-- ;;
CREATE TRIGGER trg_pagos_insert AFTER INSERT ON pagos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_despues) VALUES (
	@motek_usuario_id, 'pagos', NEW.id, 'crear',
	JSON_OBJECT('factura_id', NEW.factura_id, 'monto', NEW.monto, 'metodo', NEW.metodo, 'fecha', NEW.fecha, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_pagos_update;
-- ;;
CREATE TRIGGER trg_pagos_update AFTER UPDATE ON pagos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes, datos_despues) VALUES (
	@motek_usuario_id, 'pagos', NEW.id, 'editar',
	JSON_OBJECT('factura_id', OLD.factura_id, 'monto', OLD.monto, 'metodo', OLD.metodo, 'fecha', OLD.fecha, 'notas', OLD.notas),
	JSON_OBJECT('factura_id', NEW.factura_id, 'monto', NEW.monto, 'metodo', NEW.metodo, 'fecha', NEW.fecha, 'notas', NEW.notas)
);

-- ;;
DROP TRIGGER IF EXISTS trg_pagos_delete;
-- ;;
CREATE TRIGGER trg_pagos_delete AFTER DELETE ON pagos FOR EACH ROW
INSERT INTO auditoria (usuario_id, tabla, registro_id, accion, datos_antes) VALUES (
	@motek_usuario_id, 'pagos', OLD.id, 'borrar',
	JSON_OBJECT('factura_id', OLD.factura_id, 'monto', OLD.monto, 'metodo', OLD.metodo, 'fecha', OLD.fecha, 'notas', OLD.notas)
);
