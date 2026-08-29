package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// Auth handlers

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

// Client handlers

func listClientesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, nombre, telefono, email, direccion, notas, creado_en FROM clientes ORDER BY id DESC")
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
	err = db.QueryRow("SELECT id, nombre, telefono, email, direccion, notas, creado_en FROM clientes WHERE id = ?", id).
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

// Motorcycle handlers

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

// Work order handlers

func listOrdenesHandler(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, cliente_id, moto_id, descripcion, diagnostico, estado, fecha_recibido, fecha_entrega, total_mano_obra, notas, creado_en, actualizado_en FROM ordenes_trabajo"
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
	err = db.QueryRow("SELECT id, cliente_id, moto_id, descripcion, diagnostico, estado, fecha_recibido, fecha_entrega, total_mano_obra, notas, creado_en, actualizado_en FROM ordenes_trabajo WHERE id = ?", id).
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
		"recibido":           true,
		"en_progreso":        true,
		"esperando_repuestos": true,
		"terminado":          true,
		"entregado":          true,
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

func healthHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
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
