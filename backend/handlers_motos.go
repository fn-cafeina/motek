package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func listMotosByClienteHandler(w http.ResponseWriter, r *http.Request) {
	clienteID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	rows, err := db.Query("SELECT id, cliente_id, marca, modelo, anio, placa, color, vin, kilometraje, creado_en FROM motos WHERE cliente_id = ?", clienteID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando motos")
		return
	}
	defer rows.Close()

	var motos []Moto
	for rows.Next() {
		var m Moto
		if err := rows.Scan(&m.ID, &m.ClienteID, &m.Marca, &m.Modelo, &m.Anio, &m.Placa, &m.Color, &m.VIN, &m.Kilometraje, &m.CreadoEn); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando moto")
			return
		}
		motos = append(motos, m)
	}

	respondJSON(w, http.StatusOK, motos)
}

func createMotoHandler(w http.ResponseWriter, r *http.Request) {
	clienteID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var m Moto
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if m.Marca == "" {
		respondError(w, http.StatusBadRequest, "marca es requerida")
		return
	}

	m.ClienteID = clienteID
	result, err := db.Exec("INSERT INTO motos (cliente_id, marca, modelo, anio, placa, color, vin, kilometraje) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		m.ClienteID, m.Marca, m.Modelo, m.Anio, m.Placa, m.Color, m.VIN, m.Kilometraje)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando moto")
		return
	}

	id, _ := result.LastInsertId()
	m.ID = id

	respondJSON(w, http.StatusCreated, m)
}

func getMotoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var m Moto
	err = db.QueryRow("SELECT id, cliente_id, marca, modelo, anio, placa, color, vin, kilometraje, creado_en FROM motos WHERE id = ?", id).
		Scan(&m.ID, &m.ClienteID, &m.Marca, &m.Modelo, &m.Anio, &m.Placa, &m.Color, &m.VIN, &m.Kilometraje, &m.CreadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "moto no encontrada")
		return
	}

	respondJSON(w, http.StatusOK, m)
}

func updateMotoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var m Moto
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if m.Marca == "" {
		respondError(w, http.StatusBadRequest, "marca es requerida")
		return
	}

	_, err = db.Exec("UPDATE motos SET marca = ?, modelo = ?, anio = ?, placa = ?, color = ?, vin = ?, kilometraje = ? WHERE id = ?",
		m.Marca, m.Modelo, m.Anio, m.Placa, m.Color, m.VIN, m.Kilometraje, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando moto")
		return
	}

	m.ID = id
	respondJSON(w, http.StatusOK, m)
}

func deleteMotoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	result, err := db.Exec("DELETE FROM motos WHERE id = ?", id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando moto")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "moto no encontrada")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}
