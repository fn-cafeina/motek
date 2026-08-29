package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRegisterHandler(t *testing.T) {
	defer cleanupTestDB(t)

	body := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(registerHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response["email"] != "test@example.com" {
		t.Errorf("handler returned unexpected email: got %v", response["email"])
	}
}

func TestRegisterHandlerMissingFields(t *testing.T) {
	defer cleanupTestDB(t)

	body := map[string]string{
		"email": "",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(registerHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestLoginHandler(t *testing.T) {
	defer cleanupTestDB(t)

	// First register a user
	regBody := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	regJsonBody, _ := json.Marshal(regBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(regJsonBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	http.HandlerFunc(registerHandler).ServeHTTP(rr, req)

	// Then login
	loginBody := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	loginJsonBody, _ := json.Marshal(loginBody)
	req, _ = http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(loginJsonBody))
	req.Header.Set("Content-Type", "application/json")
	rr = httptest.NewRecorder()
	http.HandlerFunc(loginHandler).ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var response map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("error unmarshaling response: %v", err)
	}

	if response["token"] == "" {
		t.Errorf("handler returned empty token")
	}
}

func TestLoginHandlerInvalidCredentials(t *testing.T) {
	defer cleanupTestDB(t)

	body := map[string]string{
		"email":    "wrong@example.com",
		"password": "wrongpassword",
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(loginHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusUnauthorized {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusUnauthorized)
	}
}
