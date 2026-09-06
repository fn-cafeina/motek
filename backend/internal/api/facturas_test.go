package api

import (
	"net/http"
	"testing"

	"motek/internal/store"
)

func setupFactura(t *testing.T, nombre, descripcion string, manoObra int) (store.OrdenTrabajo, store.Factura) {
	t.Helper()
	c := mustCreateCliente(t, nombre)
	m := mustCreateMoto(t, c.ID, "Honda", "CBR600")
	o := mustCreateOrdenConMonto(t, c.ID, m.ID, descripcion, manoObra)
	return o, mustCreateFactura(t, o.ID)
}

func mustCreateOrdenConMonto(t *testing.T, clienteID, motoID int64, descripcion string, manoObra int) store.OrdenTrabajo {
	t.Helper()
	rr := doRequest(t, "POST", "/api/ordenes", map[string]any{
		"cliente_id": clienteID, "moto_id": motoID,
		"descripcion": descripcion, "total_mano_obra": manoObra,
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create orden: got %d (%s)", rr.Code, rr.Body.String())
	}
	var o store.OrdenTrabajo
	decodeBody(t, rr, &o)
	return o
}

func TestCreateFactura(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Juan Perez")
	m := mustCreateMoto(t, c.ID, "Honda", "CBR600")
	o := mustCreateOrdenConMonto(t, c.ID, m.ID, "Cambio de aceite", 5000)

	rr := doRequest(t, "POST", "/api/facturas", map[string]int64{"orden_id": o.ID})
	assertStatus(t, rr, http.StatusCreated)
	var response store.Factura
	decodeBody(t, rr, &response)
	if response.Estado != "pendiente" {
		t.Errorf("unexpected estado: %v", response.Estado)
	}
	if response.Total != 5000 {
		t.Errorf("unexpected total: got %v want 5000", response.Total)
	}
}

func TestCreateFacturaDuplicate(t *testing.T) {
	cleanupTestDB(t)
	o, _ := setupFactura(t, "Dup Factura", "Orden dup", 1000)
	rr := doRequest(t, "POST", "/api/facturas", map[string]int64{"orden_id": o.ID})
	assertStatus(t, rr, http.StatusConflict)
}

func TestGetFactura(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Maria Garcia")
	m := mustCreateMoto(t, c.ID, "Yamaha", "MT-09")
	o := mustCreateOrdenConMonto(t, c.ID, m.ID, "Reparacion de frenos", 8000)
	created := mustCreateFactura(t, o.ID)

	rr := doRequest(t, "GET", "/api/facturas/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusOK)
	var response store.Factura
	decodeBody(t, rr, &response)
	if response.Total != 8000 {
		t.Errorf("unexpected total: got %v want 8000", response.Total)
	}
}

func TestCancelFactura(t *testing.T) {
	cleanupTestDB(t)
	_, f := setupFactura(t, "Pedro Lopez", "Cambio de correa", 3000)

	rr := doRequest(t, "PATCH", "/api/facturas/"+itoa(f.ID)+"/cancelar", nil)
	assertStatus(t, rr, http.StatusOK)
	var response map[string]string
	decodeBody(t, rr, &response)
	if response["estado"] != "cancelada" {
		t.Errorf("unexpected estado: %v", response["estado"])
	}
}

func TestCancelFacturaTwice(t *testing.T) {
	cleanupTestDB(t)
	_, f := setupFactura(t, "Doble Cancel", "Orden x", 1000)
	assertStatus(t, doRequest(t, "PATCH", "/api/facturas/"+itoa(f.ID)+"/cancelar", nil), http.StatusOK)
	assertStatus(t, doRequest(t, "PATCH", "/api/facturas/"+itoa(f.ID)+"/cancelar", nil), http.StatusBadRequest)
}

func TestCreatePago(t *testing.T) {
	cleanupTestDB(t)
	_, f := setupFactura(t, "Ana Torres", "Cambio de aceite", 5000)

	rr := doRequest(t, "POST", "/api/facturas/"+itoa(f.ID)+"/pagos", map[string]any{"monto": 3000, "metodo": "efectivo"})
	assertStatus(t, rr, http.StatusCreated)
	var response store.Pago
	decodeBody(t, rr, &response)
	if response.Monto != 3000 {
		t.Errorf("unexpected monto: got %v want 3000", response.Monto)
	}
	if response.Metodo != "efectivo" {
		t.Errorf("unexpected metodo: %v", response.Metodo)
	}
}

func TestCreatePagoExceedsTotal(t *testing.T) {
	cleanupTestDB(t)
	_, f := setupFactura(t, "Exceso Pago", "Orden x", 1000)
	rr := doRequest(t, "POST", "/api/facturas/"+itoa(f.ID)+"/pagos", map[string]any{"monto": 5000, "metodo": "efectivo"})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestListPagos(t *testing.T) {
	cleanupTestDB(t)
	_, f := setupFactura(t, "Carlos Ruiz", "Cambio de aceite", 5000)
	for _, monto := range []int{2000, 1500} {
		assertStatus(t, doRequest(t, "POST", "/api/facturas/"+itoa(f.ID)+"/pagos",
			map[string]any{"monto": monto, "metodo": "efectivo"}), http.StatusCreated)
	}

	rr := doRequest(t, "GET", "/api/facturas/"+itoa(f.ID)+"/pagos", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.Pago
	decodeBody(t, rr, &response)
	if len(response) != 2 {
		t.Errorf("got %v want 2", len(response))
	}
}

func TestDeletePago(t *testing.T) {
	cleanupTestDB(t)
	_, f := setupFactura(t, "Laura Martinez", "Cambio de aceite", 5000)
	createRR := doRequest(t, "POST", "/api/facturas/"+itoa(f.ID)+"/pagos", map[string]any{"monto": 3000, "metodo": "efectivo"})
	assertStatus(t, createRR, http.StatusCreated)
	var created store.Pago
	decodeBody(t, createRR, &created)

	rr := doRequest(t, "DELETE", "/api/facturas/"+itoa(f.ID)+"/pagos/"+itoa(created.ID), nil)
	assertStatus(t, rr, http.StatusNoContent)
}
