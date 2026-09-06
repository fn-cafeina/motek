package api

import (
	"net/http"

	"motek/internal/store"
)

func (s *Server) handleListMotos(w http.ResponseWriter, r *http.Request) {
	motos, err := s.Store.ListMotos(r.Context())
	if err != nil {
		s.Log.Error("list motos", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando motos")
		return
	}
	writeJSON(w, http.StatusOK, motos)
}

func (s *Server) handleListMotosByCliente(w http.ResponseWriter, r *http.Request) {
	clienteID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	motos, err := s.Store.ListMotosByCliente(r.Context(), clienteID)
	if err != nil {
		s.Log.Error("list motos by cliente", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando motos")
		return
	}
	writeJSON(w, http.StatusOK, motos)
}

func (s *Server) handleCreateMoto(w http.ResponseWriter, r *http.Request) {
	clienteID, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var m store.Moto
	if !decodeJSON(w, r, &m) {
		return
	}
	if m.Marca == "" {
		writeError(w, http.StatusBadRequest, "marca es requerida")
		return
	}
	m.ClienteID = clienteID
	created, err := s.Store.CreateMoto(r.Context(), m)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleGetMoto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	m, err := s.Store.GetMoto(r.Context(), id)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (s *Server) handleUpdateMoto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var m store.Moto
	if !decodeJSON(w, r, &m) {
		return
	}
	if m.Marca == "" {
		writeError(w, http.StatusBadRequest, "marca es requerida")
		return
	}
	updated, err := s.Store.UpdateMoto(r.Context(), id, m)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeleteMoto(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if err := s.Store.DeleteMoto(r.Context(), id); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
