package store

import (
	"context"
	"time"
)

const ordenColumns = "id, cliente_id, moto_id, descripcion, COALESCE(diagnostico, ''), estado, fecha_recibido, fecha_entrega, total_mano_obra, COALESCE(notas, ''), creado_en, actualizado_en"

var ordenEstados = map[string]bool{
	"recibido":            true,
	"en_progreso":         true,
	"esperando_repuestos": true,
	"terminado":           true,
	"entregado":           true,
}

func ValidOrdenEstado(estado string) bool { return ordenEstados[estado] }

func (s *Store) ListOrdenes(ctx context.Context, estado string) ([]OrdenTrabajo, error) {
	query := "SELECT " + ordenColumns + " FROM ordenes_trabajo"
	var args []any
	if estado != "" {
		query += " WHERE estado = ?"
		args = append(args, estado)
	}
	query += " ORDER BY id DESC"

	rows, err := s.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]OrdenTrabajo, 0)
	for rows.Next() {
		var o OrdenTrabajo
		if err := rows.Scan(&o.ID, &o.ClienteID, &o.MotoID, &o.Descripcion, &o.Diagnostico, &o.Estado, &o.FechaRecibido, &o.FechaEntrega, &o.TotalManoObra, &o.Notas, &o.CreadoEn, &o.ActualizadoEn); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

func (s *Store) CreateOrden(ctx context.Context, o OrdenTrabajo) (OrdenTrabajo, error) {
	o.Estado = "recibido"
	o.FechaRecibido = time.Now()
	res, err := s.DB.ExecContext(ctx,
		"INSERT INTO ordenes_trabajo (cliente_id, moto_id, descripcion, diagnostico, estado, fecha_recibido, total_mano_obra, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		o.ClienteID, o.MotoID, o.Descripcion, o.Diagnostico, o.Estado, o.FechaRecibido, o.TotalManoObra, o.Notas)
	if err != nil {
		if isFKViolation(err) {
			return OrdenTrabajo{}, NotFound("cliente o moto no encontrado")
		}
		return OrdenTrabajo{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return OrdenTrabajo{}, err
	}
	o.ID = id
	return o, nil
}

func (s *Store) GetOrden(ctx context.Context, id int64) (OrdenTrabajo, error) {
	var o OrdenTrabajo
	err := s.DB.QueryRowContext(ctx, "SELECT "+ordenColumns+" FROM ordenes_trabajo WHERE id = ?", id).
		Scan(&o.ID, &o.ClienteID, &o.MotoID, &o.Descripcion, &o.Diagnostico, &o.Estado, &o.FechaRecibido, &o.FechaEntrega, &o.TotalManoObra, &o.Notas, &o.CreadoEn, &o.ActualizadoEn)
	if err != nil {
		return OrdenTrabajo{}, mapNotFound(err, "orden no encontrada")
	}
	return o, nil
}

func (s *Store) UpdateOrden(ctx context.Context, id int64, o OrdenTrabajo) (OrdenTrabajo, error) {
	existing, err := s.GetOrden(ctx, id)
	if err != nil {
		return OrdenTrabajo{}, err
	}
	_, err = s.DB.ExecContext(ctx,
		"UPDATE ordenes_trabajo SET descripcion = ?, diagnostico = ?, total_mano_obra = ?, notas = ? WHERE id = ?",
		o.Descripcion, o.Diagnostico, o.TotalManoObra, o.Notas, id)
	if err != nil {
		return OrdenTrabajo{}, err
	}
	o.ID = id
	o.ClienteID = existing.ClienteID
	o.MotoID = existing.MotoID
	o.Estado = existing.Estado
	return o, nil
}

func (s *Store) UpdateOrdenEstado(ctx context.Context, id int64, estado string) error {
	if _, err := s.GetOrden(ctx, id); err != nil {
		return err
	}
	_, err := s.DB.ExecContext(ctx, "UPDATE ordenes_trabajo SET estado = ? WHERE id = ?", estado, id)
	return err
}

func (s *Store) DeleteOrden(ctx context.Context, id int64) error {
	res, err := s.DB.ExecContext(ctx, "DELETE FROM ordenes_trabajo WHERE id = ?", id)
	if err != nil {
		if isFKViolation(err) {
			return Conflict("no se puede eliminar: la orden tiene una factura emitida")
		}
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return NotFound("orden no encontrada")
	}
	return nil
}
