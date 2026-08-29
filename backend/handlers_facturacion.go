package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

func listFacturasHandler(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, COALESCE(notas, ''), creado_en, actualizado_en FROM facturas"
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

	var ordenID int64
	err := db.QueryRow("SELECT id FROM ordenes_trabajo WHERE id = ?", body.OrdenID).Scan(&ordenID)
	if err != nil {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}

	var existingID int64
	err = db.QueryRow("SELECT id FROM facturas WHERE orden_id = ?", body.OrdenID).Scan(&existingID)
	if err == nil {
		respondError(w, http.StatusConflict, "ya existe una factura para esta orden")
		return
	}

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

	result, err := db.Exec("INSERT INTO facturas (orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado) VALUES (?, ?, ?, ?, 'pendiente')",
		body.OrdenID, totalManoObra, totalRepuestos, total)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando factura")
		return
	}

	id, _ := result.LastInsertId()

	var f Factura
	err = db.QueryRow("SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, COALESCE(notas, ''), creado_en, actualizado_en FROM facturas WHERE id = ?", id).
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
	err = db.QueryRow("SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, COALESCE(notas, ''), creado_en, actualizado_en FROM facturas WHERE id = ?", id).
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
		Notas            string     `json:"notas"`
		FechaVencimiento *time.Time `json:"fecha_vencimiento"`
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
	err = db.QueryRow("SELECT id, orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, fecha_vencimiento, COALESCE(notas, ''), creado_en, actualizado_en FROM facturas WHERE id = ?", id).
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

	rows, err := db.Query("SELECT id, factura_id, monto, metodo, fecha, COALESCE(notas, ''), creado_en FROM pagos WHERE factura_id = ?", facturaID)
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

	result, err := db.Exec("INSERT INTO pagos (factura_id, monto, metodo, notas) VALUES (?, ?, ?, ?)",
		facturaID, body.Monto, body.Metodo, body.Notas)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error creando pago")
		return
	}

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
	err = db.QueryRow("SELECT id, factura_id, monto, metodo, fecha, COALESCE(notas, ''), creado_en FROM pagos WHERE id = ?", id).
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

	var p Pago
	err = db.QueryRow("SELECT id, factura_id, monto, metodo, fecha, COALESCE(notas, ''), creado_en FROM pagos WHERE id = ? AND factura_id = ?", pagoID, facturaID).
		Scan(&p.ID, &p.FacturaID, &p.Monto, &p.Metodo, &p.Fecha, &p.Notas, &p.CreadoEn)
	if err != nil {
		respondError(w, http.StatusNotFound, "pago no encontrado")
		return
	}

	_, err = db.Exec("DELETE FROM pagos WHERE id = ?", pagoID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error eliminando pago")
		return
	}

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
