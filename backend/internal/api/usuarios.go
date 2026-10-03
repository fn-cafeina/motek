package api

import (
	"net/http"

	"motek/internal/auth"
)

var rolesValidos = map[string]bool{
	"admin":         true,
	"recepcionista": true,
	"tecnico":       true,
}

func (s *Server) handleListUsuarios(w http.ResponseWriter, r *http.Request) {
	usuarios, err := s.Store.ListUsuarios(r.Context(), r.URL.Query().Get("rol"))
	if err != nil {
		s.Log.Error("list usuarios", "err", err)
		writeError(w, http.StatusInternalServerError, "error consultando usuarios")
		return
	}
	writeJSON(w, http.StatusOK, usuarios)
}

func (s *Server) handleCreateUsuario(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Nombre   string `json:"nombre"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}
	if req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "email y password son requeridos")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, http.StatusBadRequest, "password debe tener al menos 6 caracteres")
		return
	}
	if !rolesValidos[req.Rol] {
		writeError(w, http.StatusBadRequest, "rol invalido")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		s.Log.Error("hash password", "err", err)
		writeError(w, http.StatusInternalServerError, "error hasheando password")
		return
	}
	id, err := s.Store.CreateUser(r.Context(), req.Email, req.Nombre, hash, req.Rol)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "email": req.Email, "rol": req.Rol})
}

func (s *Server) handleUpdateUsuario(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r, "id")
	if !ok {
		return
	}
	var req struct {
		Nombre string `json:"nombre"`
		Rol    string `json:"rol"`
		Activo *bool  `json:"activo"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}
	if !rolesValidos[req.Rol] {
		writeError(w, http.StatusBadRequest, "rol invalido")
		return
	}
	activo := true
	if req.Activo != nil {
		activo = *req.Activo
	}
	if id == UserID(r) && (req.Rol != "admin" || !activo) {
		writeError(w, http.StatusBadRequest, "no podes cambiar tu propio rol ni desactivarte")
		return
	}

	user, err := s.Store.UpdateUsuario(r.Context(), id, req.Nombre, req.Rol, activo)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}
