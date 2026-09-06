package api

import (
	"net/http"
	"strconv"
	"testing"

	"motek/internal/store"
)

func itoa(id int64) string { return strconv.FormatInt(id, 10) }

func TestCreateMoto(t *testing.T) {
	cleanupTestDB(t)
	client := mustCreateCliente(t, "Juan Perez")

	rr := doRequest(t, "POST", "/api/clientes/"+itoa(client.ID)+"/motos", map[string]any{
		"marca": "Honda", "modelo": "CBR600", "anio": 2020,
		"placa": "ABC123", "color": "Rojo", "vin": "123456789", "kilometraje": 15000,
	})
	assertStatus(t, rr, http.StatusCreated)
	var response store.Moto
	decodeBody(t, rr, &response)
	if response.Marca != "Honda" {
		t.Errorf("unexpected marca: %v", response.Marca)
	}
	if response.ClienteID != client.ID {
		t.Errorf("unexpected cliente_id: got %v want %v", response.ClienteID, client.ID)
	}
}

func TestCreateMotoMissingMarca(t *testing.T) {
	cleanupTestDB(t)
	client := mustCreateCliente(t, "Sin Marca")
	rr := doRequest(t, "POST", "/api/clientes/"+itoa(client.ID)+"/motos", map[string]any{"modelo": "X"})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestCreateMotoUnknownCliente(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/clientes/999999/motos", map[string]any{"marca": "Honda"})
	assertStatus(t, rr, http.StatusNotFound)
}

func TestGetMoto(t *testing.T) {
	cleanupTestDB(t)
	client := mustCreateCliente(t, "Maria Garcia")
	created := mustCreateMoto(t, client.ID, "Yamaha", "MT-09")

	rr := doRequest(t, "GET", "/api/motos/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusOK)
	var response store.Moto
	decodeBody(t, rr, &response)
	if response.Marca != "Yamaha" {
		t.Errorf("unexpected marca: %v", response.Marca)
	}
}

func TestUpdateMoto(t *testing.T) {
	cleanupTestDB(t)
	client := mustCreateCliente(t, "Pedro Lopez")
	created := mustCreateMoto(t, client.ID, "Suzuki", "GSX-R750")

	rr := doRequest(t, "PUT", "/api/motos/"+itoa(created.ID), map[string]any{
		"marca": "Suzuki", "modelo": "GSX-R750 Updated", "anio": 2021,
	})
	assertStatus(t, rr, http.StatusOK)
	var response store.Moto
	decodeBody(t, rr, &response)
	if response.Modelo != "GSX-R750 Updated" {
		t.Errorf("unexpected modelo: %v", response.Modelo)
	}
}

func TestDeleteMoto(t *testing.T) {
	cleanupTestDB(t)
	client := mustCreateCliente(t, "Ana Torres")
	created := mustCreateMoto(t, client.ID, "Kawasaki", "Ninja 650")

	rr := doRequest(t, "DELETE", "/api/motos/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusNoContent)
}

func TestListMotosByCliente(t *testing.T) {
	cleanupTestDB(t)
	client := mustCreateCliente(t, "Carlos Ruiz")
	for _, modelo := range []string{"CBR600", "MT-09", "GSX-R750"} {
		mustCreateMoto(t, client.ID, "Honda", modelo)
	}

	rr := doRequest(t, "GET", "/api/clientes/"+itoa(client.ID)+"/motos", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Moto
	decodeBody(t, rr, &response)
	if len(response) != 3 {
		t.Errorf("got %v want 3", len(response))
	}
}
