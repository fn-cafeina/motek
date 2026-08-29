package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateMotoHandler(t *testing.T) {
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
		"marca":       "Honda",
		"modelo":      "CBR600",
		"anio":        2020,
		"placa":       "ABC123",
		"color":       "Rojo",
		"vin":         "123456789",
		"kilometraje": 15000,
	}
	motoJsonBody, _ := json.Marshal(motoBody)
	req, err := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", client.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createMotoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response Moto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Marca != "Honda" {
		t.Errorf("handler returned unexpected marca: got %v", response.Marca)
	}

	if response.ClienteID != client.ID {
		t.Errorf("handler returned unexpected cliente_id: got %v want %v", response.ClienteID, client.ID)
	}
}

func TestGetMotoHandler(t *testing.T) {
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
	createReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(createRR, createReq)

	var created Moto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Get the motorcycle
	req, err := http.NewRequest("GET", "/api/motos/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(getMotoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Moto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Marca != "Yamaha" {
		t.Errorf("handler returned unexpected marca: got %v", response.Marca)
	}
}

func TestUpdateMotoHandler(t *testing.T) {
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
	createReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(createRR, createReq)

	var created Moto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Update the motorcycle
	updateBody := map[string]interface{}{
		"marca":  "Suzuki",
		"modelo": "GSX-R750 Updated",
		"anio":   2021,
	}
	updateJsonBody, _ := json.Marshal(updateBody)
	req, err := http.NewRequest("PUT", "/api/motos/1", bytes.NewBuffer(updateJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(updateMotoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Moto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Modelo != "GSX-R750 Updated" {
		t.Errorf("handler returned unexpected modelo: got %v", response.Modelo)
	}
}

func TestDeleteMotoHandler(t *testing.T) {
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
	createReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(createRR, createReq)

	var created Moto
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Delete the motorcycle
	req, err := http.NewRequest("DELETE", "/api/motos/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(deleteMotoHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}

func TestListMotosByClienteHandler(t *testing.T) {
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

	// Create some motorcycles
	for _, modelo := range []string{"CBR600", "MT-09", "GSX-R750"} {
		motoBody := map[string]interface{}{
			"marca":  "Honda",
			"modelo": modelo,
		}
		motoJsonBody, _ := json.Marshal(motoBody)
		req, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoJsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.SetPathValue("id", fmt.Sprintf("%d", client.ID))
		rr := httptest.NewRecorder()
		http.HandlerFunc(createMotoHandler).ServeHTTP(rr, req)
	}

	// List motos for client
	req, err := http.NewRequest("GET", fmt.Sprintf("/api/clientes/%d/motos", client.ID), nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", client.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(listMotosByClienteHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response []Moto
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if len(response) != 3 {
		t.Errorf("handler returned unexpected number of motos: got %v want 3", len(response))
	}
}
