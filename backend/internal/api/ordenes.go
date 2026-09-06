package api

import (
	"net/http"

	"motek/internal/store"
)

func (s *Server) handleListOrdenes(w http.ResponseWriter, r *http.Request) {
	ordenes, err := s.Store.ListOrdenes(r.Context(), r.URL.Query().Get("estado"))
	if err != nil {
		s.Log.Error("list ordenes", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando ordenes")
		return
	}
	writeJSON(w, http.StatusOK, ordenes)
}

func (s *Server) handleCreateOrden(w http.ResponseWriter, r *http.Request) {
	var o store.OrdenTrabajo
	if !decodeJSON(w, r, &o) {
		return
	}
	if o.ClienteID == 0 || o.MotoID == 0 {
		writeError(w, http.StatusBadRequest, "cliente_id y moto_id son requeridos")
		return
	}
	if o.Descripcion == "" {
		writeError(w, http.StatusBadRequest, "descripcion es requerida")
		return
	}
	created, err := s.Store.CreateOrden(r.Context(), o)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleGetOrden(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	o, err := s.Store.GetOrden(r.Context(), id)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, o)
}

func (s *Server) handleUpdateOrden(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var o store.OrdenTrabajo
	if !decodeJSON(w, r, &o) {
		return
	}
	if o.Descripcion == "" {
		writeError(w, http.StatusBadRequest, "descripcion es requerida")
		return
	}
	updated, err := s.Store.UpdateOrden(r.Context(), id, o)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleUpdateOrdenEstado(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var body struct {
		Estado string `json:"estado"`
	}
	if !decodeJSON(w, r, &body) {
		return
	}
	if !store.ValidOrdenEstado(body.Estado) {
		writeError(w, http.StatusBadRequest, "estado invalido")
		return
	}
	if err := s.Store.UpdateOrdenEstado(r.Context(), id, body.Estado); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"estado": body.Estado})
}

func (s *Server) handleDeleteOrden(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if err := s.Store.DeleteOrden(r.Context(), id); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
