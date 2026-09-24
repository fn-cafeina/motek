package api

import (
	"net/http"
	"testing"

	"motek/internal/store"
)

func TestCreateRepuesto(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "POST", "/api/repuestos", map[string]any{
		"codigo": "ACEITE-10W40", "nombre": "Aceite 10W40", "descripcion": "Aceite motor 4T",
		"categoria": "Aceites", "precio_compra": 5000, "precio_venta": 8000,
		"stock": 10, "stock_minimo": 3, "ubicacion": "Estante A1",
	})
	assertStatus(t, rr, http.StatusCreated)
	var response store.Repuesto
	decodeBody(t, rr, &response)
	if response.Codigo != "ACEITE-10W40" {
		t.Errorf("unexpected codigo: %v", response.Codigo)
	}
	if response.Stock != 10 {
		t.Errorf("unexpected stock: got %v want 10", response.Stock)
	}
}

func TestCreateRepuestoDuplicate(t *testing.T) {
	cleanupTestDB(t)
	mustCreateRepuesto(t, "DUP-001", 10000, 5)
	rr := doRequest(t, "POST", "/api/repuestos", map[string]any{
		"codigo": "DUP-001", "nombre": "Dup", "precio_venta": 10000, "stock": 5,
	})
	assertStatus(t, rr, http.StatusConflict)
}

func TestGetRepuesto(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateRepuesto(t, "FILTRO-AIRE-001", 15000, 5)

	rr := doRequest(t, "GET", "/api/repuestos/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusOK)
	var response store.Repuesto
	decodeBody(t, rr, &response)
	if response.Codigo != "FILTRO-AIRE-001" {
		t.Errorf("unexpected codigo: %v", response.Codigo)
	}
}

func TestUpdateRepuesto(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateRepuesto(t, "CADENA-001", 25000, 3)

	rr := doRequest(t, "PUT", "/api/repuestos/"+itoa(created.ID), map[string]any{
		"codigo": "CADENA-001", "nombre": "Cadena 520 HD", "precio_venta": 30000, "stock": 5,
	})
	assertStatus(t, rr, http.StatusOK)
	var response store.Repuesto
	decodeBody(t, rr, &response)
	if response.Nombre != "Cadena 520 HD" {
		t.Errorf("unexpected nombre: %v", response.Nombre)
	}
}

func TestDeleteRepuesto(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateRepuesto(t, "DISCO-FRENO-001", 45000, 2)

	rr := doRequest(t, "DELETE", "/api/repuestos/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusNoContent)
}

func TestListRepuestos(t *testing.T) {
	cleanupTestDB(t)
	for _, codigo := range []string{"REP-001", "REP-002", "REP-003"} {
		mustCreateRepuesto(t, codigo, 10000, 5)
	}

	rr := doRequest(t, "GET", "/api/repuestos", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Repuesto
	decodeBody(t, rr, &response)
	if len(response) != 3 {
		t.Errorf("got %v want 3", len(response))
	}
}

func TestAdjustStock(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateRepuesto(t, "STOCK-TEST-001", 10000, 10)

	rr := doRequest(t, "POST", "/api/repuestos/"+itoa(created.ID)+"/stock", map[string]int{"cantidad": 5})
	assertStatus(t, rr, http.StatusOK)
	var response map[string]int
	decodeBody(t, rr, &response)
	if response["stock"] != 15 {
		t.Errorf("got %v want 15", response["stock"])
	}
}

func TestAdjustStockNegative(t *testing.T) {
	cleanupTestDB(t)
	created := mustCreateRepuesto(t, "STOCK-NEG-001", 10000, 2)

	rr := doRequest(t, "POST", "/api/repuestos/"+itoa(created.ID)+"/stock", map[string]int{"cantidad": -5})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestAlertasStock(t *testing.T) {
	cleanupTestDB(t)
	mustCreateRepuestoLow(t, "LOW-001")
	mustCreateRepuestoLow(t, "LOW-002")
	mustCreateRepuesto(t, "NORMAL-001", 10000, 10)

	rr := doRequest(t, "GET", "/api/alertas/stock", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []map[string]any
	decodeBody(t, rr, &response)
	if len(response) != 2 {
		t.Errorf("got %v want 2", len(response))
	}
	for _, alerta := range response {
		if alerta["id"] == nil {
			t.Errorf("alerta sin id: %v", alerta)
		}
	}
}

func mustCreateRepuestoLow(t *testing.T, codigo string) store.Repuesto {
	t.Helper()
	rr := doRequest(t, "POST", "/api/repuestos", map[string]any{
		"codigo": codigo, "nombre": "Low Stock " + codigo,
		"precio_venta": 10000, "stock": 1, "stock_minimo": 5,
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create repuesto low: got %d (%s)", rr.Code, rr.Body.String())
	}
	var rp store.Repuesto
	decodeBody(t, rr, &rp)
	return rp
}

func TestListOrdenRepuestos(t *testing.T) {
	cleanupTestDB(t)
	o, rp := setupOrdenConRepuesto(t, "PART-001", 10)

	addRR := doRequest(t, "POST", "/api/ordenes/"+itoa(o.ID)+"/repuestos", map[string]any{
		"repuesto_id": rp.ID, "cantidad": 2,
	})
	assertStatus(t, addRR, http.StatusCreated)

	rr := doRequest(t, "GET", "/api/ordenes/"+itoa(o.ID)+"/repuestos", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.OrdenRepuesto
	decodeBody(t, rr, &response)
	if len(response) != 1 {
		t.Fatalf("expected 1 repuesto, got %v", len(response))
	}
	if response[0].Cantidad != 2 {
		t.Errorf("expected cantidad 2, got %v", response[0].Cantidad)
	}
}

func TestAddOrdenRepuesto(t *testing.T) {
	cleanupTestDB(t)
	o, rp := setupOrdenConRepuesto(t, "PART-002", 5)

	rr := doRequest(t, "POST", "/api/ordenes/"+itoa(o.ID)+"/repuestos", map[string]any{
		"repuesto_id": rp.ID, "cantidad": 3,
	})
	assertStatus(t, rr, http.StatusCreated)
	var response store.OrdenRepuesto
	decodeBody(t, rr, &response)
	if response.Cantidad != 3 {
		t.Errorf("expected cantidad 3, got %v", response.Cantidad)
	}
	if response.Subtotal != 60000 {
		t.Errorf("expected subtotal 60000, got %v", response.Subtotal)
	}
	if stock := mustGetStock(t, rp.ID); stock != 2 {
		t.Errorf("expected stock 2 after add, got %v", stock)
	}
}

func TestAddOrdenRepuestoInsufficientStock(t *testing.T) {
	cleanupTestDB(t)
	o, rp := setupOrdenConRepuesto(t, "PART-003", 2)

	rr := doRequest(t, "POST", "/api/ordenes/"+itoa(o.ID)+"/repuestos", map[string]any{
		"repuesto_id": rp.ID, "cantidad": 10,
	})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestRemoveOrdenRepuesto(t *testing.T) {
	cleanupTestDB(t)
	o, rp := setupOrdenConRepuesto(t, "PART-004", 5)

	assertStatus(t, doRequest(t, "POST", "/api/ordenes/"+itoa(o.ID)+"/repuestos", map[string]any{
		"repuesto_id": rp.ID, "cantidad": 2,
	}), http.StatusCreated)

	rr := doRequest(t, "DELETE", "/api/ordenes/"+itoa(o.ID)+"/repuestos/"+itoa(rp.ID), nil)
	assertStatus(t, rr, http.StatusNoContent)
	if stock := mustGetStock(t, rp.ID); stock != 5 {
		t.Errorf("expected stock 5 after remove, got %v", stock)
	}
}

func setupOrdenConRepuesto(t *testing.T, codigo string, stock int) (store.OrdenTrabajo, store.Repuesto) {
	t.Helper()
	c := mustCreateCliente(t, "Taller "+codigo)
	m := mustCreateMoto(t, c.ID, "Honda", "CBR600")
	o := mustCreateOrden(t, c.ID, m.ID, "Orden "+codigo)
	rp := mustCreateRepuesto(t, codigo, precioPara(codigo), stock)
	return o, rp
}

func precioPara(codigo string) int {
	switch codigo {
	case "PART-002":
		return 20000
	case "PART-004":
		return 30000
	default:
		return 10000
	}
}
