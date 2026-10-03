package store

import (
	"context"
	"encoding/json"
	"time"
)

type AuditoriaItem struct {
	ID            int64           `json:"id"`
	UsuarioID     *int64          `json:"usuario_id"`
	UsuarioNombre string          `json:"usuario_nombre"`
	UsuarioEmail  string          `json:"usuario_email"`
	Tabla         string          `json:"tabla"`
	RegistroID    int64           `json:"registro_id"`
	Accion        string          `json:"accion"`
	DatosAntes    json.RawMessage `json:"datos_antes"`
	DatosDespues  json.RawMessage `json:"datos_despues"`
	Fecha         time.Time       `json:"fecha"`
}

type AuditoriaFilter struct {
	Tabla      string
	RegistroID int64
	UsuarioID  int64
	Desde      string
	Hasta      string
	Limite     int
}

func (s *Store) ListAuditoria(ctx context.Context, f AuditoriaFilter) ([]AuditoriaItem, error) {
	query := `SELECT a.id, a.usuario_id, COALESCE(u.nombre, ''), COALESCE(u.email, ''),
		a.tabla, a.registro_id, a.accion, a.datos_antes, a.datos_despues, a.fecha
		FROM auditoria a
		LEFT JOIN users u ON u.id = a.usuario_id`
	var conds []string
	var args []any
	if f.Tabla != "" {
		conds = append(conds, "a.tabla = ?")
		args = append(args, f.Tabla)
	}
	if f.RegistroID > 0 {
		conds = append(conds, "a.registro_id = ?")
		args = append(args, f.RegistroID)
	}
	if f.UsuarioID > 0 {
		conds = append(conds, "a.usuario_id = ?")
		args = append(args, f.UsuarioID)
	}
	if f.Desde != "" {
		conds = append(conds, "a.fecha >= ?")
		args = append(args, f.Desde)
	}
	if f.Hasta != "" {
		conds = append(conds, "a.fecha < DATE_ADD(?, INTERVAL 1 DAY)")
		args = append(args, f.Hasta)
	}
	limite := f.Limite
	if limite <= 0 || limite > 500 {
		limite = 200
	}
	query += buildWhere(conds) + " ORDER BY a.id DESC LIMIT ?"
	args = append(args, limite)

	rows, err := s.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]AuditoriaItem, 0)
	for rows.Next() {
		var a AuditoriaItem
		var antes, despues []byte
		if err := rows.Scan(&a.ID, &a.UsuarioID, &a.UsuarioNombre, &a.UsuarioEmail, &a.Tabla, &a.RegistroID, &a.Accion, &antes, &despues, &a.Fecha); err != nil {
			return nil, err
		}
		a.DatosAntes = antes
		a.DatosDespues = despues
		out = append(out, a)
	}
	return out, rows.Err()
}
