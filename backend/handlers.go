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

// Inventory handlers

func listRepuestosHandler(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, codigo, nombre, descripcion, categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion, creado_en, actualizado_en FROM repuestos"
	args := []interface{}{}

	if q := r.URL.Query().Get("q"); q != "" {
		query += " WHERE (nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ?)"
		q = "%" + q + "%"
		args = append(args, q, q, q)
	}

	if cat := r.URL.Query().Get("categoria"); cat != "" {
		if len(args) > 0 {
			query += " AND"
		} else {
			query += " WHERE"
		}
		query += " categoria = ?"
		args = append(args, cat)
	}

	if r.URL.Query().Get("bajo_stock") == "true" {
		if len(args) > 0 {
			query += " AND"
		} else {
			query += " WHERE"
		}
		query += " stock <= stock_minimo"
	}

	query += " ORDER BY id DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando repuestos")
		return
	}
	defer rows.Close()

	var repuestos []Repuesto
	for rows.Next() {
		var rp Repuesto
		if err := rows.Scan(&rp.ID, &rp.Codigo, &rp.Nombre, &rp.Descripcion, &rp.Categoria, &rp.PrecioCompra, &rp.PrecioVenta, &rp.Stock, &rp.StockMinimo, &rp.Ubicacion, &rp.CreadoEn, &rp.ActualizadoEn); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando repuesto")
			return
		}
		repuestos = append(repuestos, rp)
	}

	respondJSON(w, http.StatusOK, repuestos)
}

func createRepuestoHandler(w http.ResponseWriter, r *http.Request) {
	var rp Repuesto
	if err := json.NewDecoder(r.Body).Decode(&rp); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if rp.Codigo == "" {
		respondError(w, http.StatusBadRequest, "codigo es requerido")
		return
	}

	result, err := db.Exec("INSERT INTO repuestos (codigo, nombre, descripcion, categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		rp.Codigo, rp.Nombre, rp.Descripcion, rp.Categoria, rp.PrecioCompra, rp.PrecioVenta, rp.Stock, rp.StockMinimo, rp.Ubicacion)
	if err != nil {
		respondError(w, http.StatusConflict, "codigo ya existe")
		return
	}

	id, _ := result.LastInsertId()
	rp.ID = id

	respondJSON(w, http.StatusCreated, rp)
}

func getRepuestoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var rp Repuesto
	err = db.QueryRow("SELECT id, codigo, nombre, descripcion, categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion, creado_en, actualizado_en FROM repuestos WHERE id = ?", id).
		Scan(&rp.ID, &rp.Codigo, &rp.Nombre, &rp.Descripcion, &rp.Categoria, &rp.PrecioCompra, &rp.PrecioVenta, &rp.Stock, &rp.StockMinimo, &rp.Ubicacion, &rp.CreadoEn, &rp.ActualizadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "repuesto no encontrado")
		return
	}

	respondJSON(w, http.StatusOK, rp)
}

func updateRepuestoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var rp Repuesto
	if err := json.NewDecoder(r.Body).Decode(&rp); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if rp.Codigo == "" {
		respondError(w, http.StatusBadRequest, "codigo es requerido")
		return
	}

	_, err = db.Exec("UPDATE repuestos SET codigo = ?, nombre = ?, descripcion = ?, categoria = ?, precio_compra = ?, precio_venta = ?, stock = ?, stock_minimo = ?, ubicacion = ? WHERE id = ?",
		rp.Codigo, rp.Nombre, rp.Descripcion, rp.Categoria, rp.PrecioCompra, rp.PrecioVenta, rp.Stock, rp.StockMinimo, rp.Ubicacion, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando repuesto")
		return
	}

	rp.ID = id
	respondJSON(w, http.StatusOK, rp)
}

func deleteRepuestoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	result, err := db.Exec("DELETE FROM repuestos WHERE id = ?", id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando repuesto")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		respondError(w, http.StatusNotFound, "repuesto no encontrado")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}

// Order parts handlers

func listOrdenRepuestosHandler(w http.ResponseWriter, r *http.Request) {
	ordenID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	rows, err := db.Query("SELECT id, orden_id, repuesto_id, cantidad, precio_unitario, subtotal FROM orden_repuestos WHERE orden_id = ?", ordenID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando repuestos de orden")
		return
	}
	defer rows.Close()

	var ordenRepuestos []OrdenRepuesto
	for rows.Next() {
		var or OrdenRepuesto
		if err := rows.Scan(&or.ID, &or.OrdenID, &or.RepuestoID, &or.Cantidad, &or.PrecioUnitario, &or.Subtotal); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando repuesto de orden")
			return
		}
		ordenRepuestos = append(ordenRepuestos, or)
	}

	respondJSON(w, http.StatusOK, ordenRepuestos)
}

func addOrdenRepuestoHandler(w http.ResponseWriter, r *http.Request) {
	ordenID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var or OrdenRepuesto
	if err := json.NewDecoder(r.Body).Decode(&or); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if or.RepuestoID == 0 || or.Cantidad <= 0 {
		respondError(w, http.StatusBadRequest, "repuesto_id y cantidad son requeridos")
		return
	}

	// Get repuesto price
	var precioVenta int
	err = db.QueryRow("SELECT precio_venta FROM repuestos WHERE id = ?", or.RepuestoID).Scan(&precioVenta)
	if err != nil {
		respondError(w, http.StatusNotFound, "repuesto no encontrado")
		return
	}

	// Check stock
	var stock int
	err = db.QueryRow("SELECT stock FROM repuestos WHERE id = ?", or.RepuestoID).Scan(&stock)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando stock")
		return
	}

	if stock < or.Cantidad {
		respondError(w, http.StatusBadRequest, "stock insuficiente")
		return
	}

	or.OrdenID = ordenID
	or.PrecioUnitario = int64(precioVenta)
	or.Subtotal = or.PrecioUnitario * int64(or.Cantidad)

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error iniciando transaccion")
		return
	}
	defer tx.Rollback()

	// Insert orden repuesto
	result, err := tx.Exec("INSERT INTO orden_repuestos (orden_id, repuesto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
		or.OrdenID, or.RepuestoID, or.Cantidad, or.PrecioUnitario, or.Subtotal)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error agregando repuesto a orden")
		return
	}

	// Update stock
	_, err = tx.Exec("UPDATE repuestos SET stock = stock - ? WHERE id = ?", or.Cantidad, or.RepuestoID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando stock")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(w, http.StatusInternalServerError, "error confirmando transaccion")
		return
	}

	id, _ := result.LastInsertId()
	or.ID = id

	respondJSON(w, http.StatusCreated, or)
}

func removeOrdenRepuestoHandler(w http.ResponseWriter, r *http.Request) {
	ordenID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	repuestoID, err := strconv.ParseInt(r.PathValue("rid"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "repuesto id invalido")
		return
	}

	// Get orden repuesto
	var or OrdenRepuesto
	err = db.QueryRow("SELECT id, orden_id, repuesto_id, cantidad, precio_unitario, subtotal FROM orden_repuestos WHERE orden_id = ? AND repuesto_id = ?", ordenID, repuestoID).
		Scan(&or.ID, &or.OrdenID, &or.RepuestoID, &or.Cantidad, &or.PrecioUnitario, &or.Subtotal)
	if err != nil {
		respondError(w, http.StatusNotFound, "repuesto no encontrado en orden")
		return
	}

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error iniciando transaccion")
		return
	}
	defer tx.Rollback()

	// Delete orden repuesto
	_, err = tx.Exec("DELETE FROM orden_repuestos WHERE id = ?", or.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando repuesto de orden")
		return
	}

	// Restore stock
	_, err = tx.Exec("UPDATE repuestos SET stock = stock + ? WHERE id = ?", or.Cantidad, or.RepuestoID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error restaurando stock")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(w, http.StatusInternalServerError, "error confirmando transaccion")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}

func adjustStockHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var body struct {
		Cantidad int `json:"cantidad"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	// Check current stock
	var stock int
	err = db.QueryRow("SELECT stock FROM repuestos WHERE id = ?", id).Scan(&stock)
	if err != nil {
		respondError(w, http.StatusNotFound, "repuesto no encontrado")
		return
	}

	newStock := stock + body.Cantidad
	if newStock < 0 {
		respondError(w, http.StatusBadRequest, "stock no puede ser negativo")
		return
	}

	_, err = db.Exec("UPDATE repuestos SET stock = ? WHERE id = ?", newStock, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error ajustando stock")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"stock": newStock})
}

func alertasStockHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, codigo, nombre, stock, stock_minimo FROM repuestos WHERE stock <= stock_minimo ORDER BY stock ASC")
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando alertas")
		return
	}
	defer rows.Close()

	var alertas []map[string]interface{}
	for rows.Next() {
		var id int64
		var codigo, nombre string
		var stock, stockMinimo int
		if err := rows.Scan(&id, &codigo, &nombre, &stock, &stockMinimo); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando alerta")
			return
		}
		alertas = append(alertas, map[string]interface{}{
			"id":           id,
			"codigo":       codigo,
			"nombre":       nombre,
			"stock":        stock,
			"stock_minimo": stockMinimo,
		})
	}

	respondJSON(w, http.StatusOK, alertas)
}

// Billing handlers

func listFacturasHandler(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, notas, creado_en, actualizado_en FROM facturas"
	args := []interface{}{}

	if estado := r.URL.Query().Get("estado"); estado != "" {
		query += " WHERE estado = ?"
		args = append(args, estado)
	}

	query += " ORDER BY id DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando facturas")
		return
	}
	defer rows.Close()

	var facturas []Factura
	for rows.Next() {
		var f Factura
		if err := rows.Scan(&f.ID, &f.OrdenID, &f.SubtotalManoObra, &f.SubtotalRepuestos, &f.Total, &f.Estado, &f.FechaEmision, &f.FechaVencimiento, &f.Notas, &f.CreadoEn, &f.ActualizadoEn); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando factura")
			return
		}
		facturas = append(facturas, f)
	}

	respondJSON(w, http.StatusOK, facturas)
}

func createFacturaHandler(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrdenID int64 `json:"orden_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if body.OrdenID == 0 {
		respondError(w, http.StatusBadRequest, "orden_id es requerido")
		return
	}

	// Check if order exists and has no invoice
	var ordenID int64
	err := db.QueryRow("SELECT id FROM ordenes_trabajo WHERE id = ?", body.OrdenID).Scan(&ordenID)
	if err != nil {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}

	// Check if invoice already exists for this order
	var existingID int64
	err = db.QueryRow("SELECT id FROM facturas WHERE orden_id = ?", body.OrdenID).Scan(&existingID)
	if err == nil {
		respondError(w, http.StatusConflict, "ya existe una factura para esta orden")
		return
	}

	// Calculate totals
	var totalManoObra int64
	err = db.QueryRow("SELECT total_mano_obra FROM ordenes_trabajo WHERE id = ?", body.OrdenID).Scan(&totalManoObra)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando orden")
		return
	}

	var totalRepuestos int64
	err = db.QueryRow("SELECT COALESCE(SUM(subtotal), 0) FROM orden_repuestos WHERE orden_id = ?", body.OrdenID).Scan(&totalRepuestos)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error calculando repuestos")
		return
	}

	total := totalManoObra + totalRepuestos

	// Create invoice
	result, err := db.Exec("INSERT INTO facturas (orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado) VALUES (?, ?, ?, ?, 'pendiente')",
		body.OrdenID, totalManoObra, totalRepuestos, total)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando factura")
		return
	}

	id, _ := result.LastInsertId()

	// Get created invoice
	var f Factura
	err = db.QueryRow("SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, notas, creado_en, actualizado_en FROM facturas WHERE id = ?", id).
		Scan(&f.ID, &f.OrdenID, &f.SubtotalManoObra, &f.SubtotalRepuestos, &f.Total, &f.Estado, &f.FechaEmision, &f.FechaVencimiento, &f.Notas, &f.CreadoEn, &f.ActualizadoEn)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error obteniendo factura")
		return
	}

	respondJSON(w, http.StatusCreated, f)
}

func getFacturaHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var f Factura
	err = db.QueryRow("SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, notas, creado_en, actualizado_en FROM facturas WHERE id = ?", id).
		Scan(&f.ID, &f.OrdenID, &f.SubtotalManoObra, &f.SubtotalRepuestos, &f.Total, &f.Estado, &f.FechaEmision, &f.FechaVencimiento, &f.Notas, &f.CreadoEn, &f.ActualizadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "factura no encontrada")
		return
	}

	respondJSON(w, http.StatusOK, f)
}

func updateFacturaHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var body struct {
		Notas             string     `json:"notas"`
		FechaVencimiento  *time.Time `json:"fecha_vencimiento"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	_, err = db.Exec("UPDATE facturas SET notas = ?, fecha_vencimiento = ? WHERE id = ?",
		body.Notas, body.FechaVencimiento, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando factura")
		return
	}

	var f Factura
	err = db.QueryRow("SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, notas, creado_en, actualizado_en FROM facturas WHERE id = ?", id).
		Scan(&f.ID, &f.OrdenID, &f.SubtotalManoObra, &f.SubtotalRepuestos, &f.Total, &f.Estado, &f.FechaEmision, &f.FechaVencimiento, &f.Notas, &f.CreadoEn, &f.ActualizadoEn)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error obteniendo factura")
		return
	}

	respondJSON(w, http.StatusOK, f)
}

func cancelFacturaHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	// Check if invoice exists and can be cancelled
	var estado string
	err = db.QueryRow("SELECT estado FROM facturas WHERE id = ?", id).Scan(&estado)
	if err != nil {
		respondError(w, http.StatusNotFound, "factura no encontrada")
		return
	}

	if estado == "cancelada" {
		respondError(w, http.StatusBadRequest, "la factura ya esta cancelada")
		return
	}

	_, err = db.Exec("UPDATE facturas SET estado = 'cancelada' WHERE id = ?", id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error cancelando factura")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"estado": "cancelada"})
}

func listPagosHandler(w http.ResponseWriter, r *http.Request) {
	facturaID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	rows, err := db.Query("SELECT id, factura_id, monto, metodo, fecha, notas, creado_en FROM pagos WHERE factura_id = ?", facturaID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error consultando pagos")
		return
	}
	defer rows.Close()

	var pagos []Pago
	for rows.Next() {
		var p Pago
		if err := rows.Scan(&p.ID, &p.FacturaID, &p.Monto, &p.Metodo, &p.Fecha, &p.Notas, &p.CreadoEn); err != nil {
			respondError(w, http.StatusInternalServerError, "error escaneando pago")
			return
		}
		pagos = append(pagos, p)
	}

	respondJSON(w, http.StatusOK, pagos)
}

func createPagoHandler(w http.ResponseWriter, r *http.Request) {
	facturaID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	var body struct {
		Monto  int64  `json:"monto"`
		Metodo string `json:"metodo"`
		Notas  string `json:"notas"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "json invalido")
		return
	}

	if body.Monto <= 0 {
		respondError(w, http.StatusBadRequest, "monto debe ser mayor a 0")
		return
	}

	if body.Metodo == "" {
		body.Metodo = "efectivo"
	}

	// Check if invoice exists
	var f Factura
	err = db.QueryRow("SELECT id, total, estado FROM facturas WHERE id = ?", facturaID).
		Scan(&f.ID, &f.Total, &f.Estado)
	if err != nil {
		respondError(w, http.StatusNotFound, "factura no encontrada")
		return
	}

	if f.Estado == "cancelada" {
		respondError(w, http.StatusBadRequest, "no se puede pagar una factura cancelada")
		return
	}

	// Check total paid
	var totalPaid int64
	err = db.QueryRow("SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE factura_id = ?", facturaID).Scan(&totalPaid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error calculando pagos")
		return
	}

	if totalPaid+body.Monto > f.Total {
		respondError(w, http.StatusBadRequest, "el pago excede el total de la factura")
		return
	}

	// Create payment
	result, err := db.Exec("INSERT INTO pagos (factura_id, monto, metodo, notas) VALUES (?, ?, ?, ?)",
		facturaID, body.Monto, body.Metodo, body.Notas)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando pago")
		return
	}

	// Update invoice status
	newTotal := totalPaid + body.Monto
	if newTotal >= f.Total {
		_, err = db.Exec("UPDATE facturas SET estado = 'pagada' WHERE id = ?", facturaID)
	} else {
		_, err = db.Exec("UPDATE facturas SET estado = 'parcial' WHERE id = ?", facturaID)
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando estado")
		return
	}

	id, _ := result.LastInsertId()

	var p Pago
	err = db.QueryRow("SELECT id, factura_id, monto, metodo, fecha, notas, creado_en FROM pagos WHERE id = ?", id).
		Scan(&p.ID, &p.FacturaID, &p.Monto, &p.Metodo, &p.Fecha, &p.Notas, &p.CreadoEn)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error obteniendo pago")
		return
	}

	respondJSON(w, http.StatusCreated, p)
}

func deletePagoHandler(w http.ResponseWriter, r *http.Request) {
	facturaID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "id invalido")
		return
	}

	pagoID, err := strconv.ParseInt(r.PathValue("pid"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "pago id invalido")
		return
	}

	// Check if payment exists
	var p Pago
	err = db.QueryRow("SELECT id, factura_id, monto, metodo, fecha, notas, creado_en FROM pagos WHERE id = ? AND factura_id = ?", pagoID, facturaID).
		Scan(&p.ID, &p.FacturaID, &p.Monto, &p.Metodo, &p.Fecha, &p.Notas, &p.CreadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "pago no encontrado")
		return
	}

	// Delete payment
	_, err = db.Exec("DELETE FROM pagos WHERE id = ?", pagoID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando pago")
		return
	}

	// Update invoice status
	var totalPaid int64
	err = db.QueryRow("SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE factura_id = ?", facturaID).Scan(&totalPaid)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error calculando pagos")
		return
	}

	var fTotal int64
	err = db.QueryRow("SELECT total FROM facturas WHERE id = ?", facturaID).Scan(&fTotal)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error obteniendo factura")
		return
	}

	if totalPaid <= 0 {
		_, err = db.Exec("UPDATE facturas SET estado = 'pendiente' WHERE id = ?", facturaID)
	} else if totalPaid < fTotal {
		_, err = db.Exec("UPDATE facturas SET estado = 'parcial' WHERE id = ?", facturaID)
	} else {
		_, err = db.Exec("UPDATE facturas SET estado = 'pagada' WHERE id = ?", facturaID)
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error actualizando estado")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}
