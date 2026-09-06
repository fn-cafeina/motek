package store

import (
	"context"
	"database/sql"
	"time"
)

const facturaColumns = "id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, COALESCE(notas, ''), creado_en, actualizado_en"

func scanFactura(row *sql.Row) (Factura, error) {
	var f Factura
	err := row.Scan(&f.ID, &f.OrdenID, &f.SubtotalManoObra, &f.SubtotalRepuestos, &f.Total, &f.Estado, &f.FechaEmision, &f.FechaVencimiento, &f.Notas, &f.CreadoEn, &f.ActualizadoEn)
	return f, err
}

func (s *Store) ListFacturas(ctx context.Context, estado string) ([]Factura, error) {
	query := "SELECT " + facturaColumns + " FROM facturas"
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

	out := make([]Factura, 0)
	for rows.Next() {
		var f Factura
		if err := rows.Scan(&f.ID, &f.OrdenID, &f.SubtotalManoObra, &f.SubtotalRepuestos, &f.Total, &f.Estado, &f.FechaEmision, &f.FechaVencimiento, &f.Notas, &f.CreadoEn, &f.ActualizadoEn); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *Store) CreateFactura(ctx context.Context, ordenID int64) (Factura, error) {
	var totalManoObra int64
	err := s.DB.QueryRowContext(ctx, "SELECT total_mano_obra FROM ordenes_trabajo WHERE id = ?", ordenID).Scan(&totalManoObra)
	if err != nil {
		if err == sql.ErrNoRows {
			return Factura{}, NotFound("orden no encontrada")
		}
		return Factura{}, err
	}

	var existingID int64
	err = s.DB.QueryRowContext(ctx, "SELECT id FROM facturas WHERE orden_id = ?", ordenID).Scan(&existingID)
	if err == nil {
		return Factura{}, Conflict("ya existe una factura para esta orden")
	} else if err != sql.ErrNoRows {
		return Factura{}, err
	}

	var totalRepuestos int64
	if err := s.DB.QueryRowContext(ctx, "SELECT COALESCE(SUM(subtotal), 0) FROM orden_repuestos WHERE orden_id = ?", ordenID).Scan(&totalRepuestos); err != nil {
		return Factura{}, err
	}

	total := totalManoObra + totalRepuestos
	res, err := s.DB.ExecContext(ctx,
		"INSERT INTO facturas (orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado) VALUES (?, ?, ?, ?, 'pendiente')",
		ordenID, totalManoObra, totalRepuestos, total)
	if err != nil {
		if isDuplicate(err) {
			return Factura{}, Conflict("ya existe una factura para esta orden")
		}
		return Factura{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return Factura{}, err
	}
	return s.GetFactura(ctx, id)
}

func (s *Store) GetFactura(ctx context.Context, id int64) (Factura, error) {
	f, err := scanFactura(s.DB.QueryRowContext(ctx,
		"SELECT "+facturaColumns+" FROM facturas WHERE id = ?", id))
	if err != nil {
		return Factura{}, mapNotFound(err, "factura no encontrada")
	}
	return f, nil
}

func (s *Store) UpdateFactura(ctx context.Context, id int64, notas string, vencimiento *time.Time) (Factura, error) {
	if _, err := s.GetFactura(ctx, id); err != nil {
		return Factura{}, err
	}
	if _, err := s.DB.ExecContext(ctx, "UPDATE facturas SET notas = ?, fecha_vencimiento = ? WHERE id = ?",
		notas, vencimiento, id); err != nil {
		return Factura{}, err
	}
	return s.GetFactura(ctx, id)
}

func (s *Store) CancelFactura(ctx context.Context, id int64) (Factura, error) {
	var estado string
	err := s.DB.QueryRowContext(ctx, "SELECT estado FROM facturas WHERE id = ?", id).Scan(&estado)
	if err != nil {
		if err == sql.ErrNoRows {
			return Factura{}, NotFound("factura no encontrada")
		}
		return Factura{}, err
	}
	if estado == "cancelada" {
		return Factura{}, Conflict("la factura ya esta cancelada")
	}
	if _, err := s.DB.ExecContext(ctx, "UPDATE facturas SET estado = 'cancelada' WHERE id = ?", id); err != nil {
		return Factura{}, err
	}
	return s.GetFactura(ctx, id)
}

func (s *Store) ListPagos(ctx context.Context, facturaID int64) ([]Pago, error) {
	rows, err := s.DB.QueryContext(ctx,
		"SELECT id, factura_id, monto, metodo, fecha, COALESCE(notas, ''), creado_en FROM pagos WHERE factura_id = ?", facturaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Pago, 0)
	for rows.Next() {
		var p Pago
		if err := rows.Scan(&p.ID, &p.FacturaID, &p.Monto, &p.Metodo, &p.Fecha, &p.Notas, &p.CreadoEn); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func facturaEstado(total, paid int64) string {
	switch {
	case paid <= 0:
		return "pendiente"
	case paid < total:
		return "parcial"
	default:
		return "pagada"
	}
}

func (s *Store) CreatePago(ctx context.Context, facturaID, monto int64, metodo, notas string) (Pago, error) {
	if metodo == "" {
		metodo = "efectivo"
	}
	var p Pago
	err := s.withTx(func(tx *sql.Tx) error {
		var total int64
		var estado string
		err := tx.QueryRow("SELECT total, estado FROM facturas WHERE id = ? FOR UPDATE", facturaID).Scan(&total, &estado)
		if err != nil {
			if err == sql.ErrNoRows {
				return NotFound("factura no encontrada")
			}
			return err
		}
		if estado == "cancelada" {
			return Conflict("no se puede pagar una factura cancelada")
		}
		var paid int64
		if err := tx.QueryRow("SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE factura_id = ?", facturaID).Scan(&paid); err != nil {
			return err
		}
		if paid+monto > total {
			return Conflict("el pago excede el total de la factura")
		}
		res, err := tx.Exec("INSERT INTO pagos (factura_id, monto, metodo, notas) VALUES (?, ?, ?, ?)",
			facturaID, monto, metodo, notas)
		if err != nil {
			return err
		}
		id, err := res.LastInsertId()
		if err != nil {
			return err
		}
		if _, err := tx.Exec("UPDATE facturas SET estado = ? WHERE id = ?", facturaEstado(total, paid+monto), facturaID); err != nil {
			return err
		}
		err = tx.QueryRow("SELECT id, factura_id, monto, metodo, fecha, COALESCE(notas, ''), creado_en FROM pagos WHERE id = ?", id).
			Scan(&p.ID, &p.FacturaID, &p.Monto, &p.Metodo, &p.Fecha, &p.Notas, &p.CreadoEn)
		return err
	})
	if err != nil {
		return Pago{}, err
	}
	return p, nil
}

func (s *Store) DeletePago(ctx context.Context, facturaID, pagoID int64) error {
	return s.withTx(func(tx *sql.Tx) error {
		var exists int64
		err := tx.QueryRow("SELECT id FROM pagos WHERE id = ? AND factura_id = ?", pagoID, facturaID).Scan(&exists)
		if err != nil {
			if err == sql.ErrNoRows {
				return NotFound("pago no encontrado")
			}
			return err
		}
		if _, err := tx.Exec("DELETE FROM pagos WHERE id = ?", pagoID); err != nil {
			return err
		}
		var paid, total int64
		if err := tx.QueryRow("SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE factura_id = ?", facturaID).Scan(&paid); err != nil {
			return err
		}
		if err := tx.QueryRow("SELECT total FROM facturas WHERE id = ? FOR UPDATE", facturaID).Scan(&total); err != nil {
			return err
		}
		_, err = tx.Exec("UPDATE facturas SET estado = ? WHERE id = ?", facturaEstado(total, paid), facturaID)
		return err
	})
}
