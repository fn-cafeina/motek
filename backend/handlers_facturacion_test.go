package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateFacturaHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	clientBody := map[string]string{"nombre": "Juan Perez"}
	clientJsonBody, _ := json.Marshal(clientBody)
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientJsonBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)

	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	// Create a motorcycle
	motoBody := map[string]interface{}{
		"marca":  "Honda",
		"modelo": "CBR600",
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)

	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	// Create a work order
	ordenBody := map[string]interface{}{
		"cliente_id":     client.ID,
		"moto_id":        moto.ID,
		"descripcion":    "Cambio de aceite",
		"total_mano_obra": 5000,
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)

	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	// Create invoice
	facturaBody := map[string]int64{
		"orden_id": orden.ID,
	}
	facturaJsonBody, _ := json.Marshal(facturaBody)
	req, err := http.NewRequest("POST", "/api/facturas", bytes.NewBuffer(facturaJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createFacturaHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response Factura
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Estado != "pendiente" {
		t.Errorf("handler returned unexpected estado: got %v", response.Estado)
	}

	if response.Total != 5000 {
		t.Errorf("handler returned unexpected total: got %v want 5000", response.Total)
	}
}

func TestGetFacturaHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	clientBody := map[string]string{"nombre": "Maria Garcia"}
	clientJsonBody, _ := json.Marshal(clientBody)
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientJsonBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)

	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	// Create a motorcycle
	motoBody := map[string]interface{}{
		"marca":  "Yamaha",
		"modelo": "MT-09",
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)

	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	// Create a work order
	ordenBody := map[string]interface{}{
		"cliente_id":     client.ID,
		"moto_id":        moto.ID,
		"descripcion":    "Reparacion de frenos",
		"total_mano_obra": 8000,
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)

	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	// Create invoice
	facturaBody := map[string]int64{
		"orden_id": orden.ID,
	}
	facturaJsonBody, _ := json.Marshal(facturaBody)
	createReq, _ := http.NewRequest("POST", "/api/facturas", bytes.NewBuffer(facturaJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createFacturaHandler).ServeHTTP(createRR, createReq)

	var created Factura
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Get the invoice
	req, err := http.NewRequest("GET", "/api/facturas/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(getFacturaHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Factura
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Total != 8000 {
		t.Errorf("handler returned unexpected total: got %v want 8000", response.Total)
	}
}

func TestCancelFacturaHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	clientBody := map[string]string{"nombre": "Pedro Lopez"}
	clientJsonBody, _ := json.Marshal(clientBody)
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientJsonBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)

	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	// Create a motorcycle
	motoBody := map[string]interface{}{
		"marca":  "Suzuki",
		"modelo": "GSX-R750",
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)

	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	// Create a work order
	ordenBody := map[string]interface{}{
		"cliente_id":     client.ID,
		"moto_id":        moto.ID,
		"descripcion":    "Cambio de correa",
		"total_mano_obra": 3000,
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)

	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	// Create invoice
	facturaBody := map[string]int64{
		"orden_id": orden.ID,
	}
	facturaJsonBody, _ := json.Marshal(facturaBody)
	createReq, _ := http.NewRequest("POST", "/api/facturas", bytes.NewBuffer(facturaJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createFacturaHandler).ServeHTTP(createRR, createReq)

	var created Factura
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Cancel the invoice
	req, err := http.NewRequest("PATCH", "/api/facturas/1/cancelar", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(cancelFacturaHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response["estado"] != "cancelada" {
		t.Errorf("handler returned unexpected estado: got %v", response["estado"])
	}
}

func TestCreatePagoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	clientBody := map[string]string{"nombre": "Ana Torres"}
	clientJsonBody, _ := json.Marshal(clientBody)
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientJsonBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)

	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	// Create a motorcycle
	motoBody := map[string]interface{}{
		"marca":  "Kawasaki",
		"modelo": "Ninja 650",
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)

	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	// Create a work order
	ordenBody := map[string]interface{}{
		"cliente_id":     client.ID,
		"moto_id":        moto.ID,
		"descripcion":    "Cambio de aceite",
		"total_mano_obra": 5000,
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)

	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	// Create invoice
	facturaBody := map[string]int64{
		"orden_id": orden.ID,
	}
	facturaJsonBody, _ := json.Marshal(facturaBody)
	facturaReq, _ := http.NewRequest("POST", "/api/facturas", bytes.NewBuffer(facturaJsonBody))
	facturaReq.Header.Set("Content-Type", "application/json")
	facturaRR := httptest.NewRecorder()
	http.HandlerFunc(createFacturaHandler).ServeHTTP(facturaRR, facturaReq)

	var factura Factura
	json.Unmarshal(facturaRR.Body.Bytes(), &factura)

	// Create payment
	pagoBody := map[string]interface{}{
		"monto":  3000,
		"metodo": "efectivo",
	}
	pagoJsonBody, _ := json.Marshal(pagoBody)
	req, err := http.NewRequest("POST", fmt.Sprintf("/api/facturas/%d/pagos", factura.ID), bytes.NewBuffer(pagoJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", factura.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createPagoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response Pago
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Monto != 3000 {
		t.Errorf("handler returned unexpected monto: got %v want 3000", response.Monto)
	}

	if response.Metodo != "efectivo" {
		t.Errorf("handler returned unexpected metodo: got %v", response.Metodo)
	}
}

func TestListPagosHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	clientBody := map[string]string{"nombre": "Carlos Ruiz"}
	clientJsonBody, _ := json.Marshal(clientBody)
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientJsonBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)

	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	// Create a motorcycle
	motoBody := map[string]interface{}{
		"marca":  "Honda",
		"modelo": "CBR600",
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)

	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	// Create a work order
	ordenBody := map[string]interface{}{
		"cliente_id":     client.ID,
		"moto_id":        moto.ID,
		"descripcion":    "Cambio de aceite",
		"total_mano_obra": 5000,
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)

	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	// Create invoice
	facturaBody := map[string]int64{
		"orden_id": orden.ID,
	}
	facturaJsonBody, _ := json.Marshal(facturaBody)
	facturaReq, _ := http.NewRequest("POST", "/api/facturas", bytes.NewBuffer(facturaJsonBody))
	facturaReq.Header.Set("Content-Type", "application/json")
	facturaRR := httptest.NewRecorder()
	http.HandlerFunc(createFacturaHandler).ServeHTTP(facturaRR, facturaReq)

	var factura Factura
	json.Unmarshal(facturaRR.Body.Bytes(), &factura)

	// Create some payments
	for _, monto := range []int{2000, 1500} {
		pagoBody := map[string]interface{}{
			"monto":  monto,
			"metodo": "efectivo",
		}
		pagoJsonBody, _ := json.Marshal(pagoBody)
		pagoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/facturas/%d/pagos", factura.ID), bytes.NewBuffer(pagoJsonBody))
		pagoReq.Header.Set("Content-Type", "application/json")
		pagoReq.SetPathValue("id", fmt.Sprintf("%d", factura.ID))
		pagoRR := httptest.NewRecorder()
		http.HandlerFunc(createPagoHandler).ServeHTTP(pagoRR, pagoReq)
	}

	// List payments
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/facturas/%d/pagos", factura.ID), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", factura.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(listPagosHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response []Pago
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if len(response) != 2 {
		t.Errorf("handler returned unexpected number of pagos: got %v want 2", len(response))
	}
}

func TestDeletePagoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	clientBody := map[string]string{"nombre": "Laura Martinez"}
	clientJsonBody, _ := json.Marshal(clientBody)
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientJsonBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)

	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	// Create a motorcycle
	motoBody := map[string]interface{}{
		"marca":  "Yamaha",
		"modelo": "MT-09",
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)

	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	// Create a work order
	ordenBody := map[string]interface{}{
		"cliente_id":     client.ID,
		"moto_id":        moto.ID,
		"descripcion":    "Cambio de aceite",
		"total_mano_obra": 5000,
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)

	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	// Create invoice
	facturaBody := map[string]int64{
		"orden_id": orden.ID,
	}
	facturaJsonBody, _ := json.Marshal(facturaBody)
	facturaReq, _ := http.NewRequest("POST", "/api/facturas", bytes.NewBuffer(facturaJsonBody))
	facturaReq.Header.Set("Content-Type", "application/json")
	facturaRR := httptest.NewRecorder()
	http.HandlerFunc(createFacturaHandler).ServeHTTP(facturaRR, facturaReq)

	var factura Factura
	json.Unmarshal(facturaRR.Body.Bytes(), &factura)

	// Create a payment
	pagoBody := map[string]interface{}{
		"monto":  3000,
		"metodo": "efectivo",
	}
	pagoJsonBody, _ := json.Marshal(pagoBody)
	createReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/facturas/%d/pagos", factura.ID), bytes.NewBuffer(pagoJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.SetPathValue("id", fmt.Sprintf("%d", factura.ID))
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createPagoHandler).ServeHTTP(createRR, createReq)

	var created Pago
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Delete the payment
	req, err := http.NewRequest("DELETE", fmt.Sprintf("/api/facturas/%d/pagos/%d", factura.ID, created.ID), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", factura.ID))
	req.SetPathValue("pid", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(deletePagoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}
