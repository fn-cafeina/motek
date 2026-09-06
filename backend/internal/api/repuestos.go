package api

import (
	"net/http"

	"motek/internal/store"
)

func (s *Server) handleListRepuestos(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	f := store.RepuestoFilter{
		Q:         q.Get("q"),
		Categoria: q.Get("categoria"),
		BajoStock: q.Get("bajo_stock") == "true",
	}
	repuestos, err := s.Store.ListRepuestos(r.Context(), f)
	if err != nil {
		s.Log.Error("list repuestos", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando repuestos")
		return
	}
	writeJSON(w, http.StatusOK, repuestos)
}

func (s *Server) handleCreateRepuesto(w http.ResponseWriter, r *http.Request) {
	var rp store.Repuesto
	if !decodeJSON(w, r, &rp) {
		return
	}
	if rp.Codigo == "" {
		writeError(w, http.StatusBadRequest, "codigo es requerido")
		return
	}
	created, err := s.Store.CreateRepuesto(r.Context(), rp)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleGetRepuesto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	rp, err := s.Store.GetRepuesto(r.Context(), id)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, rp)
}

func (s *Server) handleUpdateRepuesto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var rp store.Repuesto
	if !decodeJSON(w, r, &rp) {
		return
	}
	if rp.Codigo == "" {
		writeError(w, http.StatusBadRequest, "codigo es requerido")
		return
	}
	updated, err := s.Store.UpdateRepuesto(r.Context(), id, rp)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeleteRepuesto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if err := s.Store.DeleteRepuesto(r.Context(), id); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (s *Server) handleListOrdenRepuestos(w http.ResponseWriter, r *http.Request) {
	ordenID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	items, err := s.Store.ListOrdenRepuestos(r.Context(), ordenID)
	if err != nil {
		s.Log.Error("list orden repuestos", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando repuestos de orden")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) handleAddOrdenRepuesto(w http.ResponseWriter, r *http.Request) {
	ordenID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var body struct {
		RepuestoID int64 `json:"repuesto_id"`
		Cantidad   int   `json:"cantidad"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.RepuestoID == 0 || body.Cantidad <= 0 {
		writeError(w, http.StatusBadRequest, "repuesto_id y cantidad son requeridos")
		return
	}
	or, err := s.Store.AddOrdenRepuesto(r.Context(), ordenID, body.RepuestoID, body.Cantidad)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, or)
}

func (s *Server) handleRemoveOrdenRepuesto(w http.ResponseWriter, r *http.Request) {
	ordenID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	repuestoID, ok := pathID(w, r, "rid")
	if !ok {
		return
	}
	if err := s.Store.RemoveOrdenRepuesto(r.Context(), ordenID, repuestoID); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (s *Server) handleAdjustStock(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var body struct {
		Cantidad int `json:"cantidad"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	stock, err := s.Store.AdjustStock(r.Context(), id, body.Cantidad)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"stock": stock})
}

func (s *Server) handleAlertasStock(w http.ResponseWriter, r *http.Request) {
	alertas, err := s.Store.AlertasStock(r.Context())
	if err != nil {
		s.Log.Error("alertas stock", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando alertas")
		return
	}
	writeJSON(w, http.StatusOK, alertas)
}
