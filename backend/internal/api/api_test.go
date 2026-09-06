package api

import (
	"fmt"
	"net/http"
	"testing"

	"motek/internal/store"
)

func TestHealth(t *testing.T) {
	rr := doRequest(t, "GET", "/health", nil)
	assertStatus(t, rr, http.StatusOK)
	assertContentType(t, rr)
	var response map[string]string
	decodeBody(t, rr, &response)
	if response["status"] != "ok" {
		t.Errorf("unexpected body: %v", response)
	}
}

func TestRegister(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/auth/register", map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	})
	assertStatus(t, rr, http.StatusCreated)
	var response map[string]any
	decodeBody(t, rr, &response)
	if response["email"] != "test@example.com" {
		t.Errorf("unexpected email: %v", response["email"])
	}
}

func TestRegisterMissingFields(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/auth/register", map[string]string{"email": ""})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestRegisterDuplicate(t *testing.T) {
	cleanupTestDB(t)
	body := map[string]string{"email": "dup@example.com", "password": "password123"}
	assertStatus(t, doRequest(t, "POST", "/api/auth/register", body), http.StatusCreated)
	assertStatus(t, doRequest(t, "POST", "/api/auth/register", body), http.StatusConflict)
}

func TestLogin(t *testing.T) {
	cleanupTestDB(t)
	testUserToken = ""
	assertStatus(t, doRequest(t, "POST", "/api/auth/register", map[string]string{
		"email": "test@example.com", "password": "password123",
	}), http.StatusCreated)

	rr := doRequest(t, "POST", "/api/auth/login", map[string]string{
		"email": "test@example.com", "password": "password123",
	})
	assertStatus(t, rr, http.StatusOK)
	var response map[string]string
	decodeBody(t, rr, &response)
	if response["token"] == "" {
		t.Error("empty token")
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/auth/login", map[string]string{
		"email": "wrong@example.com", "password": "wrongpassword",
	})
	assertStatus(t, rr, http.StatusUnauthorized)
}

func TestMe(t *testing.T) {
	cleanupTestDB(t)
	testUserToken = ""
	assertStatus(t, doRequest(t, "POST", "/api/auth/register", map[string]string{
		"email": "me@test.com", "password": "password123",
	}), http.StatusCreated)

	rr := doRequest(t, "POST", "/api/auth/login", map[string]string{
		"email": "me@test.com", "password": "password123",
	})
	var loginResp map[string]string
	decodeBody(t, rr, &loginResp)

	req := doRequestAuthed(t, "GET", "/api/auth/me", nil, loginResp["token"])
	assertStatus(t, req, http.StatusOK)
	var response store.User
	decodeBody(t, req, &response)
	if response.Email != "me@test.com" {
		t.Errorf("unexpected email: %v", response.Email)
	}
}

func TestMeNoToken(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequestNoAuth(t, "GET", "/api/auth/me", nil)
	assertStatus(t, rr, http.StatusUnauthorized)
}

func TestMeInvalidToken(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequestAuthed(t, "GET", "/api/auth/me", nil, "invalid-token")
	assertStatus(t, rr, http.StatusUnauthorized)
}

func TestProtectedRequiresAuth(t *testing.T) {
	cleanupTestDB(t)
	for _, target := range []string{"/api/clientes", "/api/motos", "/api/ordenes", "/api/repuestos", "/api/facturas", "/api/alertas/stock"} {
		rr := doRequestNoAuth(t, "GET", target, nil)
		if rr.Code != http.StatusUnauthorized {
			t.Errorf("%s: got %d want %d", target, rr.Code, http.StatusUnauthorized)
		}
	}
}

func TestListMotos(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Lista Motos")
	mustCreateMoto(t, c.ID, "Honda", "CBR600")
	mustCreateMoto(t, c.ID, "Yamaha", "MT-09")

	rr := doRequest(t, "GET", "/api/motos", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Moto
	decodeBody(t, rr, &response)
	if len(response) != 2 {
		t.Errorf("got %d motos want 2", len(response))
	}
}

func TestListFacturas(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Lista Facturas")
	m := mustCreateMoto(t, c.ID, "Honda", "CBR600")
	o := mustCreateOrden(t, c.ID, m.ID, "Orden facturada")
	mustCreateFactura(t, o.ID)

	rr := doRequest(t, "GET", "/api/facturas", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Factura
	decodeBody(t, rr, &response)
	if len(response) != 1 {
		t.Errorf("got %d facturas want 1", len(response))
	}
}

func TestUpdateFactura(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Update Factura")
	m := mustCreateMoto(t, c.ID, "Honda", "CBR600")
	o := mustCreateOrden(t, c.ID, m.ID, "Orden update")
	f := mustCreateFactura(t, o.ID)

	rr := doRequest(t, "PUT", fmt.Sprintf("/api/facturas/%d", f.ID), map[string]string{"notas": "nota actualizada"})
	assertStatus(t, rr, http.StatusOK)
	var updated store.Factura
	decodeBody(t, rr, &updated)
	if updated.Notas != "nota actualizada" {
		t.Errorf("unexpected notas: %q", updated.Notas)
	}
}
