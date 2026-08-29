package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func listClientesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, nombre, telefono, email, direccion, COALESCE(notas, ''), creado_en FROM clientes ORDER BY id DESC")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando clientes")
		return
	}
	defer rows.Close()

	var clientes []Cliente
	for rows.Next() {
		var c Cliente
		if err := rows.Scan(&c.ID, &c.Nombre, &c.Telefono, &c.Email, &c.Direccion, &c.Notas, &c.CreadoEn); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando cliente")
			return
		}
		clientes = append(clientes, c)
	}

	respondJSON(w, http.StatusOK, clientes)
}

func createClienteHandler(w http.ResponseWriter, r *http.Request) {
	var c Cliente
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if c.Nombre == "" {
		respondError(w, http.StatusBadRequest, "nombre es requerido")
		return
	}

	result, err := db.Exec("INSERT INTO clientes (nombre, telefono, email, direccion, notas) VALUES (?, ?, ?, ?, ?)",
		c.Nombre, c.Telefono, c.Email, c.Direccion, c.Notas)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando cliente")
		return
	}

	id, _ := result.LastInsertId()
	c.ID = id

	respondJSON(w, http.StatusCreated, c)
}

func getClienteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var c Cliente
	err = db.QueryRow("SELECT id, nombre, telefono, email, direccion, COALESCE(notas, ''), creado_en FROM clientes WHERE id = ?", id).
		Scan(&c.ID, &c.Nombre, &c.Telefono, &c.Email, &c.Direccion, &c.Notas, &c.CreadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "cliente no encontrado")
		return
	}

	respondJSON(w, http.StatusOK, c)
}

func updateClienteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var c Cliente
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if c.Nombre == "" {
		respondError(w, http.StatusBadRequest, "nombre es requerido")
		return
	}

	_, err = db.Exec("UPDATE clientes SET nombre = ?, telefono = ?, email = ?, direccion = ?, notas = ? WHERE id = ?",
		c.Nombre, c.Telefono, c.Email, c.Direccion, c.Notas, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando cliente")
		return
	}

	c.ID = id
	respondJSON(w, http.StatusOK, c)
}

func deleteClienteHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	result, err := db.Exec("DELETE FROM clientes WHERE id = ?", id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando cliente")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "cliente no encontrado")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}
