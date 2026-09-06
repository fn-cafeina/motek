package api

import (
	"net/http"

	"motek/internal/auth"
)

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &req) {
		return
	}

	user, hash, err := s.Store.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "credenciales invalidas")
		return
	}
	if err := auth.CheckPassword(hash, req.Password); err != nil {
		writeError(w, http.StatusUnauthorized, "credenciales invalidas")
		return
	}

	token, err := s.Auth.Generate(user.ID)
	if err != nil {
		s.Log.Error("generate token", "err", err)
		writeError(w, http.StatusInternalServerError, "error generando token")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	user, err := s.Store.GetUserByID(r.Context(), UserID(r))
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
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

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		s.Log.Error("hash password", "err", err)
		writeError(w, http.StatusInternalServerError, "error hasheando password")
		return
	}
	id, err := s.Store.CreateUser(r.Context(), req.Email, hash)
	if err != nil {
		writeStoreError(w, s.Log, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"id": id, "email": req.Email})
}
