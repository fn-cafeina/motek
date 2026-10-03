-- Motek - migracion 0004: restricciones, indices y estado entregado terminal.
--
-- Antes de aplicar el UNIQUE sobre facturas.orden_id hay que confirmar que no
-- existan duplicados historicos:
--   SELECT orden_id, COUNT(*) FROM facturas GROUP BY orden_id HAVING COUNT(*) > 1;

ALTER TABLE facturas
	ADD CONSTRAINT uq_facturas_orden UNIQUE (orden_id);

-- ;;

ALTER TABLE ordenes_trabajo
	ADD CONSTRAINT chk_ordenes_estado CHECK (estado IN ('recibido', 'en_progreso', 'esperando_repuestos', 'terminado', 'entregado'));

-- ;;

ALTER TABLE facturas
	ADD CONSTRAINT chk_facturas_estado CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'cancelada'));

-- ;;

DROP TRIGGER IF EXISTS trg_ordenes_estado_terminal;
-- ;;
CREATE TRIGGER trg_ordenes_estado_terminal BEFORE UPDATE ON ordenes_trabajo FOR EACH ROW
BEGIN
	IF OLD.estado = 'entregado' AND NEW.estado <> 'entregado' THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'una orden entregada no puede cambiar de estado';
	END IF;
END;

-- ;;

ALTER TABLE ordenes_trabajo ADD INDEX idx_ordenes_estado (estado);

-- ;;

ALTER TABLE facturas
	ADD INDEX idx_facturas_estado (estado),
	ADD INDEX idx_facturas_emision (fecha_emision);

-- ;;

ALTER TABLE pagos ADD INDEX idx_pagos_fecha (fecha);

-- ;;

ALTER TABLE repuestos ADD INDEX idx_repuestos_categoria (categoria);

-- ;;

ALTER TABLE clientes ADD INDEX idx_clientes_nombre (nombre);

-- ;;

ALTER TABLE auditoria
	ADD INDEX idx_auditoria_registro (tabla, registro_id),
	ADD INDEX idx_auditoria_fecha (fecha);
