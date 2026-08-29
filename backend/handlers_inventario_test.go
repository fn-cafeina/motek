package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateRepuestoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	body := map[string]interface{}{
		"codigo":         "ACEITE-10W40",
		"nombre":         "Aceite 10W40",
		"descripcion":    "Aceite motor 4T",
		"categoria":      "Aceites",
		"precio_compra":  5000,
		"precio_venta":   8000,
		"stock":          10,
		"stock_minimo":   3,
		"ubicacion":      "Estante A1",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createRepuestoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response Repuesto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Codigo != "ACEITE-10W40" {
		t.Errorf("handler returned unexpected codigo: got %v", response.Codigo)
	}

	if response.Stock != 10 {
		t.Errorf("handler returned unexpected stock: got %v want 10", response.Stock)
	}
}

func TestGetRepuestoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a repuesto first
	createBody := map[string]interface{}{
		"codigo":        "FILTRO-AIRE-001",
		"nombre":        "Filtro de Aire",
		"precio_venta":  15000,
		"stock":         5,
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(createRR, createReq)

	var created Repuesto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Get the repuesto
	req, err := http.NewRequest("GET", "/api/repuestos/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(getRepuestoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Repuesto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Codigo != "FILTRO-AIRE-001" {
		t.Errorf("handler returned unexpected codigo: got %v", response.Codigo)
	}
}

func TestUpdateRepuestoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a repuesto first
	createBody := map[string]interface{}{
		"codigo":        "CADENA-001",
		"nombre":        "Cadena 520",
		"precio_venta":  25000,
		"stock":         3,
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(createRR, createReq)

	var created Repuesto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Update the repuesto
	updateBody := map[string]interface{}{
		"codigo":        "CADENA-001",
		"nombre":        "Cadena 520 HD",
		"precio_venta":  30000,
		"stock":         5,
	}
	updateJsonBody, _ := json.Marshal(updateBody)
	req, err := http.NewRequest("PUT", "/api/repuestos/1", bytes.NewBuffer(updateJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(updateRepuestoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Repuesto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Nombre != "Cadena 520 HD" {
		t.Errorf("handler returned unexpected nombre: got %v", response.Nombre)
	}
}

func TestDeleteRepuestoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a repuesto first
	createBody := map[string]interface{}{
		"codigo":        "DISCO-FRENO-001",
		"nombre":        "Disco de Freno",
		"precio_venta":  45000,
		"stock":         2,
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(createRR, createReq)

	var created Repuesto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Delete the repuesto
	req, err := http.NewRequest("DELETE", "/api/repuestos/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(deleteRepuestoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}

func TestListRepuestosHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create some repuestos
	for _, codigo := range []string{"REP-001", "REP-002", "REP-003"} {
		body := map[string]interface{}{
			"codigo":       codigo,
			"nombre":       "Repuesto " + codigo,
			"precio_venta": 10000,
			"stock":        5,
		}
		jsonBody, _ := json.Marshal(body)
		req, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		http.HandlerFunc(createRepuestoHandler).ServeHTTP(rr, req)
	}

	// List repuestos
	req, err := http.NewRequest("GET", "/api/repuestos", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(listRepuestosHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response []Repuesto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if len(response) != 3 {
		t.Errorf("handler returned unexpected number of repuestos: got %v want 3", len(response))
	}
}

func TestAdjustStockHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a repuesto first
	createBody := map[string]interface{}{
		"codigo":        "STOCK-TEST-001",
		"nombre":        "Stock Test",
		"precio_venta":  10000,
		"stock":         10,
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(createRR, createReq)

	var created Repuesto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Adjust stock (add 5)
	adjustBody := map[string]int{
		"cantidad": 5,
	}
	adjustJsonBody, _ := json.Marshal(adjustBody)
	req, err := http.NewRequest("POST", "/api/repuestos/1/stock", bytes.NewBuffer(adjustJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(adjustStockHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]int
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response["stock"] != 15 {
		t.Errorf("handler returned unexpected stock: got %v want 15", response["stock"])
	}
}

func TestAlertasStockHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create repuestos with low stock
	for _, codigo := range []string{"LOW-001", "LOW-002"} {
		body := map[string]interface{}{
			"codigo":       codigo,
			"nombre":       "Low Stock " + codigo,
			"precio_venta": 10000,
			"stock":        1,
			"stock_minimo": 5,
		}
		jsonBody, _ := json.Marshal(body)
		req, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		http.HandlerFunc(createRepuestoHandler).ServeHTTP(rr, req)
	}

	// Create a repuesto with enough stock
	normalBody := map[string]interface{}{
		"codigo":       "NORMAL-001",
		"nombre":       "Normal Stock",
		"precio_venta": 10000,
		"stock":        10,
		"stock_minimo": 5,
	}
	normalJsonBody, _ := json.Marshal(normalBody)
	normalReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(normalJsonBody))
	normalReq.Header.Set("Content-Type", "application/json")
	normalRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(normalRR, normalReq)

	// Get alerts
	req, err := http.NewRequest("GET", "/api/alertas/stock", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(alertasStockHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response []map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if len(response) != 2 {
		t.Errorf("handler returned unexpected number of alerts: got %v want 2", len(response))
	}
}
