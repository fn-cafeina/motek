package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateClienteHandler(t *testing.T) {
	defer cleanupTestDB(t)

	body := map[string]string{
		"nombre":    "Juan Perez",
		"telefono":  "123456789",
		"email":     "juan@example.com",
		"direccion": "Calle Principal 123",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createClienteHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response Cliente
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Nombre != "Juan Perez" {
		t.Errorf("handler returned unexpected nombre: got %v", response.Nombre)
	}

	if response.ID == 0 {
		t.Errorf("handler returned zero ID")
	}
}

func TestCreateClienteHandlerMissingName(t *testing.T) {
	defer cleanupTestDB(t)

	body := map[string]string{
		"nombre": "",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(createClienteHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestGetClienteHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	createBody := map[string]string{
		"nombre": "Maria Garcia",
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(createRR, createReq)

	var created Cliente
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Get the client
	req, err := http.NewRequest("GET", "/api/clientes/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(getClienteHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Cliente
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Nombre != "Maria Garcia" {
		t.Errorf("handler returned unexpected nombre: got %v", response.Nombre)
	}
}

func TestUpdateClienteHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	createBody := map[string]string{
		"nombre": "Pedro Lopez",
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(createRR, createReq)

	var created Cliente
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Update the client
	updateBody := map[string]string{
		"nombre": "Pedro Lopez Actualizado",
	}
	updateJsonBody, _ := json.Marshal(updateBody)
	req, err := http.NewRequest("PUT", "/api/clientes/1", bytes.NewBuffer(updateJsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(updateClienteHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response Cliente
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response.Nombre != "Pedro Lopez Actualizado" {
		t.Errorf("handler returned unexpected nombre: got %v", response.Nombre)
	}
}

func TestDeleteClienteHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create a client first
	createBody := map[string]string{
		"nombre": "Ana Torres",
	}
	createJsonBody, _ := json.Marshal(createBody)
	createReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(createJsonBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(createRR, createReq)

	var created Cliente
	json.Unmarshal(createRR.Body.Bytes(), &created)

	// Delete the client
	req, err := http.NewRequest("DELETE", "/api/clientes/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	req.SetPathValue("id", fmt.Sprintf("%d", created.ID))

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(deleteClienteHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusNoContent)
	}
}

func TestListClientesHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// Create some clients
	for _, name := range []string{"Cliente 1", "Cliente 2", "Cliente 3"} {
		body := map[string]string{"nombre": name}
		jsonBody, _ := json.Marshal(body)
		req, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()
		http.HandlerFunc(createClienteHandler).ServeHTTP(rr, req)
	}

	// List clients
	req, err := http.NewRequest("GET", "/api/clientes", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(listClientesHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response []Cliente
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if len(response) != 3 {
		t.Errorf("handler returned unexpected number of clients: got %v want 3", len(response))
	}
}
