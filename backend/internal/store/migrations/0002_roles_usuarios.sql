-- Motek - migracion 0002: roles de usuario y asignacion de tecnicos.

ALTER TABLE users
	ADD COLUMN nombre VARCHAR(255) NOT NULL DEFAULT '',
	ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'recepcionista',
	ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1,
	ADD CONSTRAINT chk_users_rol CHECK (rol IN ('admin', 'recepcionista', 'tecnico'));

-- ;;

ALTER TABLE ordenes_trabajo
	ADD COLUMN tecnico_id INT NULL,
	ADD CONSTRAINT fk_ordenes_tecnico FOREIGN KEY (tecnico_id) REFERENCES users(id) ON DELETE SET NULL;

-- ;;

-- Los usuarios que ya existian conservan su acceso: el mas antiguo queda como admin.
UPDATE users SET rol = 'admin'
WHERE id = (SELECT id FROM (SELECT MIN(id) AS id FROM users) AS primero);
