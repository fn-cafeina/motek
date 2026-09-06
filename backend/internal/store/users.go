package store

import (
	"context"
	"database/sql"
)

func (s *Store) CreateUser(ctx context.Context, email, hashedPassword string) (int64, error) {
	res, err := s.DB.ExecContext(ctx, "INSERT INTO users (email, password) VALUES (?, ?)", email, hashedPassword)
	if err != nil {
		if isDuplicate(err) {
			return 0, Conflict("email ya existe")
		}
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (User, string, error) {
	var u User
	var hash string
	err := s.DB.QueryRowContext(ctx, "SELECT id, email, password FROM users WHERE email = ?", email).
		Scan(&u.ID, &u.Email, &hash)
	if err != nil {
		return User{}, "", mapNotFound(err, "usuario no encontrado")
	}
	return u, hash, nil
}

func (s *Store) GetUserByID(ctx context.Context, id int64) (User, error) {
	var u User
	err := s.DB.QueryRowContext(ctx, "SELECT id, email, creado_en FROM users WHERE id = ?", id).
		Scan(&u.ID, &u.Email, &u.CreadoEn)
	if err != nil {
		if err == sql.ErrNoRows {
			return User{}, NotFound("usuario no encontrado")
		}
		return User{}, err
	}
	return u, nil
}
