package api

import (
	"net/http"

	"motek/internal/store"
)

func (s *Server) handleListClientes(w http.ResponseWriter, r *http.Request) {
	clientes, err := s.Store.ListClientes(r.Context())
	if err != nil {
		s.Log.Error("list clientes", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando clientes")
		return
	}
	writeJSON(w, http.StatusOK, clientes)
}

func (s *Server) handleCreateCliente(w http.ResponseWriter, r *http.Request) {
	var c store.Cliente
	if !decodeJSON(w, r, &c) {
		return
	}
	if c.Nombre == "" {
		writeError(w, http.StatusBadRequest, "nombre es requerido")
		return
	}
	created, err := s.Store.CreateCliente(r.Context(), c)
	if err != nil {
		s.Log.Error("create cliente", "err", err)
		writeError(w, http.StatusInternalServerError, "error creando cliente")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (s *Server) handleGetCliente(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	c, err := s.Store.GetCliente(r.Context(), id)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (s *Server) handleUpdateCliente(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var c store.Cliente
	if !decodeJSON(w, r, &c) {
		return
	}
	if c.Nombre == "" {
		writeError(w, http.StatusBadRequest, "nombre es requerido")
		return
	}
	updated, err := s.Store.UpdateCliente(r.Context(), id, c)
	if err != nil {
		s.Log.Error("update cliente", "err", err)
		writeError(w, http.StatusInternalServerError, "error actualizando cliente")
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (s *Server) handleDeleteCliente(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	if err := s.Store.DeleteCliente(r.Context(), id); err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
