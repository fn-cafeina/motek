package main

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	var user User
	var hashedPassword string
	err := db.QueryRow("SELECT id, email, password FROM users WHERE email = ?", req.Email).
		Scan(&user.ID, &user.Email, &hashedPassword)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "credenciales invalidas")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "credenciales invalidas")
		return
	}

	token, err := generateToken(user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generando token")
		return
	}

	respondJSON(w, http.StatusOK, LoginResponse{Token: token})
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	var user User
	err := db.QueryRow("SELECT id, email, creado_en FROM users WHERE id = ?", userID).
		Scan(&user.ID, &user.Email, &user.CreadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "usuario no encontrado")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email y password son requeridos")
		return
	}

	if len(req.Password) < 6 {
		respondError(w, http.StatusBadRequest, "password debe tener al menos 6 caracteres")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error hasheando password")
		return
	}

	result, err := db.Exec("INSERT INTO users (email, password) VALUES (?, ?)", req.Email, string(hashedPassword))
	if err != nil {
		respondError(w, http.StatusConflict, "email ya existe")
		return
	}

	id, _ := result.LastInsertId()
	respondJSON(w, http.StatusCreated, map[string]interface{}{"id": id, "email": req.Email})
}
