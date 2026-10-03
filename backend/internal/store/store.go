package store

import (
	"context"
	"database/sql"

	"motek/internal/config"

	_ "github.com/go-sql-driver/mysql"
)

type Store struct {
	DB *sql.DB
}

func Open(cfg config.Config) (*Store, error) {
	db, err := sql.Open("mysql", cfg.DSN(""))
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	s := &Store{DB: db}
	if err := s.Migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.DB.Close()
}

type usuarioKey struct{}

// WithUsuario adjunta el usuario que ejecuta la operacion para que los
// triggers de auditoria lo registren a traves de @motek_usuario_id.
func WithUsuario(ctx context.Context, id int64) context.Context {
	return context.WithValue(ctx, usuarioKey{}, id)
}

func usuarioID(ctx context.Context) *int64 {
	if id, ok := ctx.Value(usuarioKey{}).(int64); ok {
		return &id
	}
	return nil
}

// withTx ejecuta fn dentro de una transaccion y publica el usuario actual en
// la variable de sesion @motek_usuario_id. Todas las escrituras pasan por aca.
func (s *Store) withTx(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, "SET @motek_usuario_id = ?", usuarioID(ctx)); err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		return mapTriggerError(err)
	}
	return tx.Commit()
}
