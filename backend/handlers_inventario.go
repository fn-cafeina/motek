package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func listRepuestosHandler(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, codigo, nombre, COALESCE(descripcion, ''), categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion, creado_en, actualizado_en FROM repuestos"
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
	err = db.QueryRow("SELECT id, codigo, nombre, COALESCE(descripcion, ''), categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion, creado_en, actualizado_en FROM repuestos WHERE id = ?", id).
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

	var precioVenta int
	err = db.QueryRow("SELECT precio_venta FROM repuestos WHERE id = ?", or.RepuestoID).Scan(&precioVenta)
	if err != nil {
		respondError(w, http.StatusNotFound, "repuesto no encontrado")
		return
	}

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

	tx, err := db.Begin()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error iniciando transaccion")
		return
	}
	defer tx.Rollback()

	result, err := tx.Exec("INSERT INTO orden_repuestos (orden_id, repuesto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
		or.OrdenID, or.RepuestoID, or.Cantidad, or.PrecioUnitario, or.Subtotal)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error agregando repuesto a orden")
		return
	}

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

	var or OrdenRepuesto
	err = db.QueryRow("SELECT id, orden_id, repuesto_id, cantidad, precio_unitario, subtotal FROM orden_repuestos WHERE orden_id = ? AND repuesto_id = ?", ordenID, repuestoID).
		Scan(&or.ID, &or.OrdenID, &or.RepuestoID, &or.Cantidad, &or.PrecioUnitario, &or.Subtotal)
	if err != nil {
		respondError(w, http.StatusNotFound, "repuesto no encontrado en orden")
		return
	}

	tx, err := db.Begin()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error iniciando transaccion")
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM orden_repuestos WHERE id = ?", or.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando repuesto de orden")
		return
	}

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
