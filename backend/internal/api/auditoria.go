package api

import (
	"net/http"
	"strconv"

	"motek/internal/store"
)

func (s *Server) handleListAuditoria(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := store.AuditoriaFilter{
		Tabla: q.Get("tabla"),
		Desde: q.Get("desde"),
		Hasta: q.Get("hasta"),
	}
	if v := q.Get("registro_id"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "registro_id invalido")
			return
		}
		f.RegistroID = id
	}
	if v := q.Get("usuario_id"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			writeError(w, http.StatusBadRequest, "usuario_id invalido")
			return
		}
		f.UsuarioID = id
	}
	if v := q.Get("limite"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n <= 0 {
			writeError(w, http.StatusBadRequest, "limite invalido")
			return
		}
		f.Limite = n
	}

	items, err := s.Store.ListAuditoria(r.Context(), f)
	if err != nil {
		s.Log.Error("list auditoria", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando auditoria")
		return
	}
	writeJSON(w, http.StatusOK, items)
}
