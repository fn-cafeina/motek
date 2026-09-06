package api

import (
	"net/http"
	"time"
)

func (s *Server) handleListFacturas(w http.ResponseWriter, r *http.Request) {
	facturas, err := s.Store.ListFacturas(r.Context(), r.URL.Query().Get("estado"))
	if err != nil {
		s.Log.Error("list facturas", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando facturas")
		return
	}
	writeJSON(w, http.StatusOK, facturas)
}

func (s *Server) handleCreateFactura(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrdenID int64 `json:"orden_id"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.OrdenID == 0 {
		writeError(w, http.StatusBadRequest, "orden_id es requerido")
		return
	}
	f, err := s.Store.CreateFactura(r.Context(), body.OrdenID)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, f)
}

func (s *Server) handleGetFactura(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	f, err := s.Store.GetFactura(r.Context(), id)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, f)
}

func (s *Server) handleUpdateFactura(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var body struct {
		Notas            string     `json:"notas"`
		FechaVencimiento *time.Time `json:"fecha_vencimiento"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	f, err := s.Store.UpdateFactura(r.Context(), id, body.Notas, body.FechaVencimiento)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, f)
}

func (s *Server) handleCancelFactura(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if _, err := s.Store.CancelFactura(r.Context(), id); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"estado": "cancelada"})
}

func (s *Server) handleListPagos(w http.ResponseWriter, r *http.Request) {
	facturaID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	pagos, err := s.Store.ListPagos(r.Context(), facturaID)
	if err != nil {
		s.Log.Error("list pagos", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando pagos")
		return
	}
	writeJSON(w, http.StatusOK, pagos)
}

func (s *Server) handleCreatePago(w http.ResponseWriter, r *http.Request) {
	facturaID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var body struct {
		Monto  int64  `json:"monto"`
		Metodo string `json:"metodo"`
		Notas  string `json:"notas"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Monto <= 0 {
		writeError(w, http.StatusBadRequest, "monto debe ser mayor a 0")
		return
	}
	p, err := s.Store.CreatePago(r.Context(), facturaID, body.Monto, body.Metodo, body.Notas)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (s *Server) handleDeletePago(w http.ResponseWriter, r *http.Request) {
	facturaID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	pagoID, ok := pathID(w, r, "pid")
	if !ok {
		return
	}
	if err := s.Store.DeletePago(r.Context(), facturaID, pagoID); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
