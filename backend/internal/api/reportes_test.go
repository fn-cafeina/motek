package api

import (
	"net/http"
	"testing"
	"time"

	"motek/internal/store"
)

func TestResumenTablero(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Cliente Reportes")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrdenConMonto(t, c.ID, m.ID, "Service con reporte", 10000)
	assertStatus(t, doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "entregado"}), http.StatusOK)
	f := mustCreateFactura(t, o.ID)
	assertStatus(t, doRequest(t, "POST", "/api/facturas/"+itoa(f.ID)+"/pagos", map[string]any{"monto": 4000, "metodo": "efectivo"}), http.StatusCreated)

	rr := doRequest(t, "GET", "/api/reportes/tablero", nil)
	assertStatus(t, rr, http.StatusOK)
	var res store.ResumenTablero
	decodeBody(t, rr, &res)

	if res.SaldoPorCobrar != 6000 {
		t.Errorf("saldo_por_cobrar: got %d want 6000", res.SaldoPorCobrar)
	}
	if res.FacturasSinCobrar != 1 {
		t.Errorf("facturas_sin_cobrar: got %d want 1", res.FacturasSinCobrar)
	}
	mesActual := time.Now().Format("2006-01")
	if len(res.FacturacionMensual) != 1 || res.FacturacionMensual[0].Mes != mesActual || res.FacturacionMensual[0].Total != 10000 {
		t.Errorf("facturacion_mensual inesperada: %+v", res.FacturacionMensual)
	}
	if len(res.IngresosMensuales) != 1 || res.IngresosMensuales[0].Total != 4000 {
		t.Errorf("ingresos_mensuales inesperados: %+v", res.IngresosMensuales)
	}
}

func TestResumenTableroNoVeTecnico(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "tecnico@example.com", "Tecnico", "tecnico")
	token := issueTokenForTest(t, "tecnico@example.com")

	rr := doRequestAuthed(t, "GET", "/api/reportes/tablero", nil, token)
	assertStatus(t, rr, http.StatusForbidden)
}

func TestOrdenEntregadaNoCambiaDeEstado(t *testing.T) {
	cleanupTestDB(t)
	c, m := setupOrden(t, "Terminal")
	o := mustCreateOrden(t, c.ID, m.ID, "Service terminal")

	assertStatus(t, doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "entregado"}), http.StatusOK)

	rr := doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "recibido"})
	assertStatus(t, rr, http.StatusConflict)

	// volver a marcar entregado es un no-op valido
	assertStatus(t, doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "entregado"}), http.StatusOK)
}
