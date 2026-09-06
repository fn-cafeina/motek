package store

import (
	"context"
	"database/sql"
	"errors"
)

const repuestoColumns = "id, codigo, nombre, COALESCE(descripcion, ''), categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion, creado_en, actualizado_en"

type RepuestoFilter struct {
	Q        string
	Categoria string
	BajoStock bool
}

func (s *Store) ListRepuestos(ctx context.Context, f RepuestoFilter) ([]Repuesto, error) {
	query := "SELECT " + repuestoColumns + " FROM repuestos"
	var conds []string
	var args []any
	if f.Q != "" {
		conds = append(conds, "(nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?)")
		like := "%" + f.Q + "%"
		args = append(args, like, like, like)
	}
	if f.Categoria != "" {
		conds = append(conds, "categoria = ?")
		args = append(args, f.Categoria)
	}
	if f.BajoStock {
		conds = append(conds, "stock <= stock_minimo")
	}
	query += buildWhere(conds) + " ORDER BY id DESC"

	rows, err := s.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Repuesto, 0)
	for rows.Next() {
		var rp Repuesto
		if err := rows.Scan(&rp.ID, &rp.Codigo, &rp.Nombre, &rp.Descripcion, &rp.Categoria, &rp.PrecioCompra, &rp.PrecioVenta, &rp.Stock, &rp.StockMinimo, &rp.Ubicacion, &rp.CreadoEn, &rp.ActualizadoEn); err != nil {
			return nil, err
		}
		out = append(out, rp)
	}
	return out, rows.Err()
}

func (s *Store) CreateRepuesto(ctx context.Context, rp Repuesto) (Repuesto, error) {
	res, err := s.DB.ExecContext(ctx,
		"INSERT INTO repuestos (codigo, nombre, descripcion, categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		rp.Codigo, rp.Nombre, rp.Descripcion, rp.Categoria, rp.PrecioCompra, rp.PrecioVenta, rp.Stock, rp.StockMinimo, rp.Ubicacion)
	if err != nil {
		if isDuplicate(err) {
			return Repuesto{}, Conflict("codigo ya existe")
		}
		return Repuesto{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return Repuesto{}, err
	}
	rp.ID = id
	return rp, nil
}

func (s *Store) GetRepuesto(ctx context.Context, id int64) (Repuesto, error) {
	var rp Repuesto
	err := s.DB.QueryRowContext(ctx, "SELECT "+repuestoColumns+" FROM repuestos WHERE id = ?", id).
		Scan(&rp.ID, &rp.Codigo, &rp.Nombre, &rp.Descripcion, &rp.Categoria, &rp.PrecioCompra, &rp.PrecioVenta, &rp.Stock, &rp.StockMinimo, &rp.Ubicacion, &rp.CreadoEn, &rp.ActualizadoEn)
	if err != nil {
		return Repuesto{}, mapNotFound(err, "repuesto no encontrado")
	}
	return rp, nil
}

func (s *Store) UpdateRepuesto(ctx context.Context, id int64, rp Repuesto) (Repuesto, error) {
	if _, err := s.GetRepuesto(ctx, id); err != nil {
		return Repuesto{}, err
	}
	_, err := s.DB.ExecContext(ctx,
		"UPDATE repuestos SET codigo = ?, nombre = ?, descripcion = ?, categoria = ?, precio_compra = ?, precio_venta = ?, stock = ?, stock_minimo = ?, ubicacion = ? WHERE id = ?",
		rp.Codigo, rp.Nombre, rp.Descripcion, rp.Categoria, rp.PrecioCompra, rp.PrecioVenta, rp.Stock, rp.StockMinimo, rp.Ubicacion, id)
	if err != nil {
		if isDuplicate(err) {
			return Repuesto{}, Conflict("codigo ya existe")
		}
		return Repuesto{}, err
	}
	rp.ID = id
	return rp, nil
}

func (s *Store) DeleteRepuesto(ctx context.Context, id int64) error {
	res, err := s.DB.ExecContext(ctx, "DELETE FROM repuestos WHERE id = ?", id)
	if err != nil {
		if isFKViolation(err) {
			return Conflict("no se puede eliminar: repuesto en uso")
		}
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return NotFound("repuesto no encontrado")
	}
	return nil
}

func (s *Store) ListOrdenRepuestos(ctx context.Context, ordenID int64) ([]OrdenRepuesto, error) {
	rows, err := s.DB.QueryContext(ctx,
		"SELECT id, orden_id, repuesto_id, cantidad, precio_unitario, subtotal FROM orden_repuestos WHERE orden_id = ?", ordenID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]OrdenRepuesto, 0)
	for rows.Next() {
		var or OrdenRepuesto
		if err := rows.Scan(&or.ID, &or.OrdenID, &or.RepuestoID, &or.Cantidad, &or.PrecioUnitario, &or.Subtotal); err != nil {
			return nil, err
		}
		out = append(out, or)
	}
	return out, rows.Err()
}

func (s *Store) AddOrdenRepuesto(ctx context.Context, ordenID, repuestoID int64, cantidad int) (OrdenRepuesto, error) {
	var or OrdenRepuesto
	err := s.withTx(func(tx *sql.Tx) error {
		var precioVenta, stock int
		err := tx.QueryRow("SELECT precio_venta, stock FROM repuestos WHERE id = ? FOR UPDATE", repuestoID).Scan(&precioVenta, &stock)
		if err != nil {
			if err == sql.ErrNoRows {
				return NotFound("repuesto no encontrado")
			}
			return err
		}
		if stock < cantidad {
			return Conflict("stock insuficiente")
		}
		or = OrdenRepuesto{
			OrdenID:        ordenID,
			RepuestoID:     repuestoID,
			Cantidad:       cantidad,
			PrecioUnitario: int64(precioVenta),
			Subtotal:       int64(precioVenta) * int64(cantidad),
		}
		res, err := tx.Exec("INSERT INTO orden_repuestos (orden_id, repuesto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
			or.OrdenID, or.RepuestoID, or.Cantidad, or.PrecioUnitario, or.Subtotal)
		if err != nil {
			if isFKViolation(err) {
				return NotFound("orden no encontrada")
			}
			return err
		}
		id, err := res.LastInsertId()
		if err != nil {
			return err
		}
		or.ID = id
		_, err = tx.Exec("UPDATE repuestos SET stock = stock - ? WHERE id = ?", cantidad, repuestoID)
		return err
	})
	if err != nil {
		return OrdenRepuesto{}, err
	}
	return or, nil
}

func (s *Store) RemoveOrdenRepuesto(ctx context.Context, ordenID, repuestoID int64) error {
	return s.withTx(func(tx *sql.Tx) error {
		var or OrdenRepuesto
		err := tx.QueryRow("SELECT id, orden_id, repuesto_id, cantidad, precio_unitario, subtotal FROM orden_repuestos WHERE orden_id = ? AND repuesto_id = ?", ordenID, repuestoID).
			Scan(&or.ID, &or.OrdenID, &or.RepuestoID, &or.Cantidad, &or.PrecioUnitario, &or.Subtotal)
		if err != nil {
			if err == sql.ErrNoRows {
				return NotFound("repuesto no encontrado en orden")
			}
			return err
		}
		if _, err := tx.Exec("DELETE FROM orden_repuestos WHERE id = ?", or.ID); err != nil {
			return err
		}
		_, err = tx.Exec("UPDATE repuestos SET stock = stock + ? WHERE id = ?", or.Cantidad, or.RepuestoID)
		return err
	})
}

func (s *Store) AdjustStock(ctx context.Context, id int64, delta int) (int, error) {
	var stock int
	err := s.DB.QueryRowContext(ctx, "SELECT stock FROM repuestos WHERE id = ?", id).Scan(&stock)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, NotFound("repuesto no encontrado")
		}
		return 0, err
	}
	newStock := stock + delta
	if newStock < 0 {
		return 0, Conflict("stock no puede ser negativo")
	}
	if _, err := s.DB.ExecContext(ctx, "UPDATE repuestos SET stock = ? WHERE id = ?", newStock, id); err != nil {
		return 0, err
	}
	return newStock, nil
}

func (s *Store) GetStock(ctx context.Context, id int64) (int, error) {
	var stock int
	err := s.DB.QueryRowContext(ctx, "SELECT stock FROM repuestos WHERE id = ?", id).Scan(&stock)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, NotFound("repuesto no encontrado")
		}
		return 0, err
	}
	return stock, nil
}

func (s *Store) AlertasStock(ctx context.Context) ([]AlertaStock, error) {
	rows, err := s.DB.QueryContext(ctx,
		"SELECT id, codigo, nombre, stock, stock_minimo FROM repuestos WHERE stock <= stock_minimo ORDER BY stock ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]AlertaStock, 0)
	for rows.Next() {
		var a AlertaStock
		if err := rows.Scan(&a.ID, &a.Codigo, &a.Nombre, &a.Stock, &a.StockMinimo); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}
