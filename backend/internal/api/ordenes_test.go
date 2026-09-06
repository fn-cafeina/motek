package api

import (
	"net/http"
	"testing"

	"motek/internal/store"
)

func setupOrden(t *testing.T, nombre string) (store.Cliente, store.Moto) {
	t.Helper()
	c := mustCreateCliente(t, nombre)
	m := mustCreateMoto(t, c.ID, "Honda", "CBR600")
	return c, m
}

func TestCreateOrden(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Juan Perez")

	rr := doRequest(t, "POST", "/api/ordenes", map[string]any{
		"cliente_id": c.ID, "moto_id": m.ID, "descripcion": "Cambio de aceite y filtros",
	})
	assertStatus(t, rr, http.StatusCreated)
	var response store.OrdenTrabajo
	decodeBody(t, rr, &response)
	if response.Estado != "recibido" {
		t.Errorf("unexpected estado: %v", response.Estado)
	}
	if response.ClienteID != c.ID {
		t.Errorf("unexpected cliente_id: got %v want %v", response.ClienteID, c.ID)
	}
}

func TestCreateOrdenMissingFields(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/ordenes", map[string]any{"descripcion": "sin ids"})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestGetOrden(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Maria Garcia")
	created := mustCreateOrden(t, c.ID, m.ID, "Reparacion de frenos")

	rr := doRequest(t, "GET", "/api/ordenes/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusOK)
	var response store.OrdenTrabajo
	decodeBody(t, rr, &response)
	if response.Descripcion != "Reparacion de frenos" {
		t.Errorf("unexpected descripcion: %v", response.Descripcion)
	}
}

func TestUpdateOrden(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Pedro Lopez")
	created := mustCreateOrden(t, c.ID, m.ID, "Cambio de correa")

	rr := doRequest(t, "PUT", "/api/ordenes/"+itoa(created.ID), map[string]any{
		"descripcion": "Cambio de correa actualizado", "diagnostico": "Correa desgastada", "total_mano_obra": 5000,
	})
	assertStatus(t, rr, http.StatusOK)
	var response store.OrdenTrabajo
	decodeBody(t, rr, &response)
	if response.Descripcion != "Cambio de correa actualizado" {
		t.Errorf("unexpected descripcion: %v", response.Descripcion)
	}
}

func TestUpdateEstadoOrden(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Ana Torres")
	created := mustCreateOrden(t, c.ID, m.ID, "Cambio de aceite")

	rr := doRequest(t, "PATCH", "/api/ordenes/"+itoa(created.ID)+"/estado", map[string]string{"estado": "en_progreso"})
	assertStatus(t, rr, http.StatusOK)
	var response map[string]string
	decodeBody(t, rr, &response)
	if response["estado"] != "en_progreso" {
		t.Errorf("unexpected estado: %v", response["estado"])
	}
}

func TestUpdateEstadoOrdenInvalid(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Estado Invalido")
	created := mustCreateOrden(t, c.ID, m.ID, "Cambio de aceite")

	rr := doRequest(t, "PATCH", "/api/ordenes/"+itoa(created.ID)+"/estado", map[string]string{"estado": "volando"})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestDeleteOrden(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Carlos Ruiz")
	created := mustCreateOrden(t, c.ID, m.ID, "Cambio de aceite")

	rr := doRequest(t, "DELETE", "/api/ordenes/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusNoContent)
}

func TestListOrdenes(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Laura Martinez")
	for _, desc := range []string{"Orden 1", "Orden 2", "Orden 3"} {
		mustCreateOrden(t, c.ID, m.ID, desc)
	}

	rr := doRequest(t, "GET", "/api/ordenes", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.OrdenTrabajo
	decodeBody(t, rr, &response)
	if len(response) != 3 {
		t.Errorf("got %v want 3", len(response))
	}
}

func TestListOrdenesFilterEstado(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Filtro Estado")
	o := mustCreateOrden(t, c.ID, m.ID, "Orden filtro")
	assertStatus(t, doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "terminado"}), http.StatusOK)

	rr := doRequest(t, "GET", "/api/ordenes?estado=terminado", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.OrdenTrabajo
	decodeBody(t, rr, &response)
	if len(response) != 1 {
		t.Errorf("got %v want 1", len(response))
	}
}
