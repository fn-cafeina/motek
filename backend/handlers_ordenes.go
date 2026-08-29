package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

func listOrdenesHandler(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, cliente_id, moto_id, descripcion, COALESCE(diagnostico, ''), estado, fecha_recibido, fecha_entrega, total_mano_obra, COALESCE(notas, ''), creado_en, actualizado_en FROM ordenes_trabajo"
	args := []interface{}{}

	if estado := r.URL.Query().Get("estado"); estado != "" {
		query += " WHERE estado = ?"
		args = append(args, estado)
	}

	query += " ORDER BY id DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando ordenes")
		return
	}
	defer rows.Close()

	var ordenes []OrdenTrabajo
	for rows.Next() {
		var o OrdenTrabajo
		if err := rows.Scan(&o.ID, &o.ClienteID, &o.MotoID, &o.Descripcion, &o.Diagnostico, &o.Estado, &o.FechaRecibido, &o.FechaEntrega, &o.TotalManoObra, &o.Notas, &o.CreadoEn, &o.ActualizadoEn); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando orden")
			return
		}
		ordenes = append(ordenes, o)
	}

	respondJSON(w, http.StatusOK, ordenes)
}

func createOrdenHandler(w http.ResponseWriter, r *http.Request) {
	var o OrdenTrabajo
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if o.ClienteID == 0 || o.MotoID == 0 {
		respondError(w, http.StatusBadRequest, "cliente_id y moto_id son requeridos")
		return
	}

	if o.Descripcion == "" {
		respondError(w, http.StatusBadRequest, "descripcion es requerida")
		return
	}

	o.Estado = "recibido"
	o.FechaRecibido = time.Now()

	result, err := db.Exec("INSERT INTO ordenes_trabajo (cliente_id, moto_id, descripcion, diagnostico, estado, fecha_recibido, total_mano_obra, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		o.ClienteID, o.MotoID, o.Descripcion, o.Diagnostico, o.Estado, o.FechaRecibido, o.TotalManoObra, o.Notas)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando orden")
		return
	}

	id, _ := result.LastInsertId()
	o.ID = id

	respondJSON(w, http.StatusCreated, o)
}

func getOrdenHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var o OrdenTrabajo
	err = db.QueryRow("SELECT id, cliente_id, moto_id, descripcion, COALESCE(diagnostico, ''), estado, fecha_recibido, fecha_entrega, total_mano_obra, COALESCE(notas, ''), creado_en, actualizado_en FROM ordenes_trabajo WHERE id = ?", id).
		Scan(&o.ID, &o.ClienteID, &o.MotoID, &o.Descripcion, &o.Diagnostico, &o.Estado, &o.FechaRecibido, &o.FechaEntrega, &o.TotalManoObra, &o.Notas, &o.CreadoEn, &o.ActualizadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}

	respondJSON(w, http.StatusOK, o)
}

func updateOrdenHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var o OrdenTrabajo
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if o.Descripcion == "" {
		respondError(w, http.StatusBadRequest, "descripcion es requerida")
		return
	}

	_, err = db.Exec("UPDATE ordenes_trabajo SET descripcion = ?, diagnostico = ?, total_mano_obra = ?, notas = ? WHERE id = ?",
		o.Descripcion, o.Diagnostico, o.TotalManoObra, o.Notas, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando orden")
		return
	}

	o.ID = id
	respondJSON(w, http.StatusOK, o)
}

func updateEstadoOrdenHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var body struct {
		Estado string `json:"estado"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	validEstados := map[string]bool{
		"recibido":            true,
		"en_progreso":         true,
		"esperando_repuestos": true,
		"terminado":           true,
		"entregado":           true,
	}

	if !validEstados[body.Estado] {
		respondError(w, http.StatusBadRequest, "estado invalido")
		return
	}

	_, err = db.Exec("UPDATE ordenes_trabajo SET estado = ? WHERE id = ?", body.Estado, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando estado")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"estado": body.Estado})
}

func deleteOrdenHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	result, err := db.Exec("DELETE FROM ordenes_trabajo WHERE id = ?", id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando orden")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}
