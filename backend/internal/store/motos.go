package store

import "context"

const motoColumns = "id, cliente_id, marca, modelo, anio, placa, color, vin, kilometraje, creado_en"

func (s *Store) ListMotos(ctx context.Context) ([]Moto, error) {
	rows, err := s.DB.QueryContext(ctx, "SELECT "+motoColumns+" FROM motos ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Moto, 0)
	for rows.Next() {
		var m Moto
		if err := rows.Scan(&m.ID, &m.ClienteID, &m.Marca, &m.Modelo, &m.Anio, &m.Placa, &m.Color, &m.VIN, &m.Kilometraje, &m.CreadoEn); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) ListMotosByCliente(ctx context.Context, clienteID int64) ([]Moto, error) {
	rows, err := s.DB.QueryContext(ctx, "SELECT "+motoColumns+" FROM motos WHERE cliente_id = ? ORDER BY id DESC", clienteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]Moto, 0)
	for rows.Next() {
		var m Moto
		if err := rows.Scan(&m.ID, &m.ClienteID, &m.Marca, &m.Modelo, &m.Anio, &m.Placa, &m.Color, &m.VIN, &m.Kilometraje, &m.CreadoEn); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) CreateMoto(ctx context.Context, m Moto) (Moto, error) {
	res, err := s.DB.ExecContext(ctx,
		"INSERT INTO motos (cliente_id, marca, modelo, anio, placa, color, vin, kilometraje) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		m.ClienteID, m.Marca, m.Modelo, m.Anio, m.Placa, m.Color, m.VIN, m.Kilometraje)
	if err != nil {
		if isFKViolation(err) {
			return Moto{}, NotFound("cliente no encontrado")
		}
		return Moto{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return Moto{}, err
	}
	m.ID = id
	return m, nil
}

func (s *Store) GetMoto(ctx context.Context, id int64) (Moto, error) {
	var m Moto
	err := s.DB.QueryRowContext(ctx, "SELECT "+motoColumns+" FROM motos WHERE id = ?", id).
		Scan(&m.ID, &m.ClienteID, &m.Marca, &m.Modelo, &m.Anio, &m.Placa, &m.Color, &m.VIN, &m.Kilometraje, &m.CreadoEn)
	if err != nil {
		return Moto{}, mapNotFound(err, "moto no encontrada")
	}
	return m, nil
}

func (s *Store) UpdateMoto(ctx context.Context, id int64, m Moto) (Moto, error) {
	if _, err := s.GetMoto(ctx, id); err != nil {
		return Moto{}, err
	}
	_, err := s.DB.ExecContext(ctx,
		"UPDATE motos SET marca = ?, modelo = ?, anio = ?, placa = ?, color = ?, vin = ?, kilometraje = ? WHERE id = ?",
		m.Marca, m.Modelo, m.Anio, m.Placa, m.Color, m.VIN, m.Kilometraje, id)
	if err != nil {
		return Moto{}, err
	}
	m.ID = id
	return m, nil
}

func (s *Store) DeleteMoto(ctx context.Context, id int64) error {
	res, err := s.DB.ExecContext(ctx, "DELETE FROM motos WHERE id = ?", id)
	if err != nil {
		// Mismo caso que DeleteCliente: la cascada choca con las facturas de sus órdenes.
		if isFKViolation(err) {
			return Conflict("no se puede eliminar: la moto tiene facturas emitidas")
		}
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return NotFound("moto no encontrada")
	}
	return nil
}
