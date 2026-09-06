package api

import (
	"net/http"
	"testing"

	"motek/internal/store"
)

func TestCreateCliente(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/clientes", map[string]string{
		"nombre":    "Juan Perez",
		"telefono":  "123456789",
		"email":     "juan@example.com",
		"direccion": "Calle Principal 123",
	})
	assertStatus(t, rr, http.StatusCreated)
	assertContentType(t, rr)
	var response store.Cliente
	decodeBody(t, rr, &response)
	if response.Nombre != "Juan Perez" {
		t.Errorf("unexpected nombre: %v", response.Nombre)
	}
	if response.ID == 0 {
		t.Error("zero ID")
	}
}

func TestCreateClienteMissingName(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/clientes", map[string]string{"nombre": ""})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestGetCliente(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateCliente(t, "Maria Garcia")

	rr := doRequest(t, "GET", "/api/clientes/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusOK)
	var response store.Cliente
	decodeBody(t, rr, &response)
	if response.Nombre != "Maria Garcia" {
		t.Errorf("unexpected nombre: %v", response.Nombre)
	}
}

func TestGetClienteNotFound(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "GET", "/api/clientes/999999", nil)
	assertStatus(t, rr, http.StatusNotFound)
}

func TestUpdateCliente(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateCliente(t, "Pedro Lopez")

	rr := doRequest(t, "PUT", "/api/clientes/"+itoa(created.ID), map[string]string{"nombre": "Pedro Lopez Actualizado"})
	assertStatus(t, rr, http.StatusOK)
	var response store.Cliente
	decodeBody(t, rr, &response)
	if response.Nombre != "Pedro Lopez Actualizado" {
		t.Errorf("unexpected nombre: %v", response.Nombre)
	}
}

func TestDeleteCliente(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateCliente(t, "Ana Torres")

	rr := doRequest(t, "DELETE", "/api/clientes/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusNoContent)
	if rr.Body.Len() != 0 {
		t.Errorf("expected empty body on 204, got %q", rr.Body.String())
	}
}

func TestListClientes(t *testing.T) {
	cleanupTestDB(t)
	for _, name := range []string{"Cliente 1", "Cliente 2", "Cliente 3"} {
		mustCreateCliente(t, name)
	}

	rr := doRequest(t, "GET", "/api/clientes", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Cliente
	decodeBody(t, rr, &response)
	if len(response) != 3 {
		t.Errorf("got %v want 3", len(response))
	}
}

func TestListClientesEmpty(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "GET", "/api/clientes", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Cliente
	decodeBody(t, rr, &response)
	if response == nil || len(response) != 0 {
		t.Errorf("expected empty array, got %q", rr.Body.String())
	}
}
