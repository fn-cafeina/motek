package api

import "net/http"

func (s *Server) handleResumenTablero(w http.ResponseWriter, r *http.Request) {
	resumen, err := s.Store.ResumenTablero(r.Context())
	if err != nil {
		s.Log.Error("resumen tablero", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando reportes")
		return
	}
	writeJSON(w, http.StatusOK, resumen)
}
