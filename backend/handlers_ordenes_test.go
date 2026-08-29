package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateOrdenHandler(t *testing.T) {
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
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Cambio de aceite y filtros",
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	req, err := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createOrdenHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response OrdenTrabajo
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Estado != "recibido" {
		t.Errorf("handler returned unexpected estado: got %v", response.Estado)
	}

	if response.ClienteID != client.ID {
		t.Errorf("handler returned unexpected cliente_id: got %v want %v", response.ClienteID, client.ID)
	}
}

func TestGetOrdenHandler(t *testing.T) {
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
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Reparacion de frenos",
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	createReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(createRR, createReq)

	var created OrdenTrabajo
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Get the work order
	req, err := http.NewRequest("GET", "/api/ordenes/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(getOrdenHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response OrdenTrabajo
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Descripcion != "Reparacion de frenos" {
		t.Errorf("handler returned unexpected descripcion: got %v", response.Descripcion)
	}
}

func TestUpdateOrdenHandler(t *testing.T) {
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
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Cambio de correa",
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	createReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(createRR, createReq)

	var created OrdenTrabajo
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Update the work order
	updateBody := map[string]interface{}{
		"descripcion":   "Cambio de correa actualizado",
		"diagnostico":   "Correa desgastada",
		"total_mano_obra": 5000,
	}
	updateJsonBody, _ := json.Marshal(updateBody)
	req, err := http.NewRequest("PUT", "/api/ordenes/1", bytes.NewBuffer(updateJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(updateOrdenHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response OrdenTrabajo
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Descripcion != "Cambio de correa actualizado" {
		t.Errorf("handler returned unexpected descripcion: got %v", response.Descripcion)
	}
}

func TestUpdateEstadoOrdenHandler(t *testing.T) {
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
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Cambio de aceite",
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	createReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(createRR, createReq)

	var created OrdenTrabajo
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Update status
	statusBody := map[string]string{
		"estado": "en_progreso",
	}
	statusJsonBody, _ := json.Marshal(statusBody)
	req, err := http.NewRequest("PATCH", "/api/ordenes/1/estado", bytes.NewBuffer(statusJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(updateEstadoOrdenHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response["estado"] != "en_progreso" {
		t.Errorf("handler returned unexpected estado: got %v", response["estado"])
	}
}

func TestDeleteOrdenHandler(t *testing.T) {
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
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Cambio de aceite",
	}
	ordenJsonBody, _ := json.Marshal(ordenBody)
	createReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(createRR, createReq)

	var created OrdenTrabajo
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Delete the work order
	req, err := http.NewRequest("DELETE", "/api/ordenes/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(deleteOrdenHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}

func TestListOrdenesHandler(t *testing.T) {
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

	// Create some work orders
	for _, desc := range []string{"Orden 1", "Orden 2", "Orden 3"} {
		ordenBody := map[string]interface{}{
			"cliente_id":  client.ID,
			"moto_id":     moto.ID,
			"descripcion": desc,
		}
		ordenJsonBody, _ := json.Marshal(ordenBody)
		req, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenJsonBody))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		http.HandlerFunc(createOrdenHandler).ServeHTTP(rr, req)
	}

	// List orders
	req, err := http.NewRequest("GET", "/api/ordenes", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(listOrdenesHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response []OrdenTrabajo
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if len(response) != 3 {
		t.Errorf("handler returned unexpected number of orders: got %v want 3", len(response))
	}
}
