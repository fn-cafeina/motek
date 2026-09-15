package store

import (
	"context"
	"database/sql"
)

const clienteColumns = "id, nombre, telefono, email, direccion, COALESCE(notas, ''), creado_en"

func scanCliente(row *sql.Row) (Cliente, error) {
	var c Cliente
	err := row.Scan(&c.ID, &c.Nombre, &c.Telefono, &c.Email, &c.Direccion, &c.Notas, &c.CreadoEn)
	return c, err
}

func (s *Store) ListClientes(ctx context.Context) ([]Cliente, error) {
	rows, err := s.DB.QueryContext(ctx, "SELECT "+clienteColumns+" FROM clientes ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Cliente, 0)
	for rows.Next() {
		var c Cliente
		if err := rows.Scan(&c.ID, &c.Nombre, &c.Telefono, &c.Email, &c.Direccion, &c.Notas, &c.CreadoEn); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) CreateCliente(ctx context.Context, c Cliente) (Cliente, error) {
	res, err := s.DB.ExecContext(ctx,
		"INSERT INTO clientes (nombre, telefono, email, direccion, notas) VALUES (?, ?, ?, ?, ?)",
		c.Nombre, c.Telefono, c.Email, c.Direccion, c.Notas)
	if err != nil {
		return Cliente{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return Cliente{}, err
	}
	c.ID = id
	return c, nil
}

func (s *Store) GetCliente(ctx context.Context, id int64) (Cliente, error) {
	c, err := scanCliente(s.DB.QueryRowContext(ctx,
		"SELECT "+clienteColumns+" FROM clientes WHERE id = ?", id))
	if err != nil {
		return Cliente{}, mapNotFound(err, "cliente no encontrado")
	}
	return c, nil
}

func (s *Store) UpdateCliente(ctx context.Context, id int64, c Cliente) (Cliente, error) {
	_, err := s.DB.ExecContext(ctx,
		"UPDATE clientes SET nombre = ?, telefono = ?, email = ?, direccion = ?, notas = ? WHERE id = ?",
		c.Nombre, c.Telefono, c.Email, c.Direccion, c.Notas, id)
	if err != nil {
		return Cliente{}, err
	}
	c.ID = id
	return c, nil
}

func (s *Store) DeleteCliente(ctx context.Context, id int64) error {
	res, err := s.DB.ExecContext(ctx, "DELETE FROM clientes WHERE id = ?", id)
	if err != nil {
		// La cascada llega hasta ordenes_trabajo; si alguna tiene factura, facturas.orden_id
		// la frena. Sin esto el handler devolvía un 500 "error interno".
		if isFKViolation(err) {
			return Conflict("no se puede eliminar: el cliente tiene facturas emitidas")
		}
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return NotFound("cliente no encontrado")
	}
	return nil
}
