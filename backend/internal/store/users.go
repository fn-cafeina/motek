package store

import (
	"context"
	"database/sql"
)

const userColumns = "id, email, nombre, rol, activo, creado_en"

func scanUser(row *sql.Row) (User, error) {
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.Nombre, &u.Rol, &u.Activo, &u.CreadoEn)
	return u, err
}

func (s *Store) CreateUser(ctx context.Context, email, nombre, hashedPassword, rol string) (int64, error) {
	var id int64
	err := s.withTx(ctx, func(tx *sql.Tx) error {
		res, err := tx.ExecContext(ctx,
			"INSERT INTO users (email, nombre, password, rol) VALUES (?, ?, ?, ?)",
			email, nombre, hashedPassword, rol)
		if err != nil {
			if isDuplicate(err) {
				return Conflict("email ya existe")
			}
			return err
		}
		id, err = res.LastInsertId()
		return err
	})
	if err != nil {
		return 0, err
	}
	return id, nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (User, string, error) {
	var u User
	var hash string
	err := s.DB.QueryRowContext(ctx,
		"SELECT id, email, nombre, rol, activo, password, creado_en FROM users WHERE email = ?", email).
		Scan(&u.ID, &u.Email, &u.Nombre, &u.Rol, &u.Activo, &hash, &u.CreadoEn)
	if err != nil {
		return User{}, "", mapNotFound(err, "usuario no encontrado")
	}
	return u, hash, nil
}

func (s *Store) GetUserByID(ctx context.Context, id int64) (User, error) {
	u, err := scanUser(s.DB.QueryRowContext(ctx, "SELECT "+userColumns+" FROM users WHERE id = ?", id))
	if err != nil {
		return User{}, mapNotFound(err, "usuario no encontrado")
	}
	return u, nil
}

func (s *Store) ListUsuarios(ctx context.Context, rol string) ([]User, error) {
	query := "SELECT " + userColumns + " FROM users"
	var args []any
	if rol != "" {
		query += " WHERE rol = ?"
		args = append(args, rol)
	}
	query += " ORDER BY id ASC"

	rows, err := s.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]User, 0)
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.Nombre, &u.Rol, &u.Activo, &u.CreadoEn); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (s *Store) UpdateUsuario(ctx context.Context, id int64, nombre, rol string, activo bool) (User, error) {
	if _, err := s.GetUserByID(ctx, id); err != nil {
		return User{}, err
	}
	err := s.withTx(ctx, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(ctx,
			"UPDATE users SET nombre = ?, rol = ?, activo = ? WHERE id = ?",
			nombre, rol, activo, id)
		return err
	})
	if err != nil {
		return User{}, err
	}
	return s.GetUserByID(ctx, id)
}

func (s *Store) CountUsuarios(ctx context.Context) (int, error) {
	var n int
	err := s.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM users").Scan(&n)
	return n, err
}
