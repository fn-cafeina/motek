-- Motek - migracion 0005: vistas para los reportes del tablero.

CREATE OR REPLACE VIEW v_ordenes_estado AS
SELECT estado, COUNT(*) AS cantidad
FROM ordenes_trabajo
GROUP BY estado;

-- ;;

CREATE OR REPLACE VIEW v_facturacion_mensual AS
SELECT DATE_FORMAT(fecha_emision, '%Y-%m') AS mes, SUM(total) AS total
FROM facturas
WHERE estado <> 'cancelada'
GROUP BY mes
ORDER BY mes;

-- ;;

CREATE OR REPLACE VIEW v_ingresos_mensuales AS
SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, SUM(monto) AS total
FROM pagos
GROUP BY mes
ORDER BY mes;

-- ;;

CREATE OR REPLACE VIEW v_top_repuestos AS
SELECT r.id, r.codigo, r.nombre, SUM(l.cantidad) AS unidades, SUM(l.subtotal) AS monto
FROM orden_repuestos l
JOIN repuestos r ON r.id = l.repuesto_id
GROUP BY r.id, r.codigo, r.nombre;

-- ;;

CREATE OR REPLACE VIEW v_ranking_tecnicos AS
SELECT u.id, u.nombre, COUNT(o.id) AS ordenes, COALESCE(SUM(f.total), 0) AS facturado
FROM users u
LEFT JOIN ordenes_trabajo o ON o.tecnico_id = u.id
LEFT JOIN facturas f ON f.orden_id = o.id AND f.estado <> 'cancelada'
WHERE u.rol = 'tecnico'
GROUP BY u.id, u.nombre;
