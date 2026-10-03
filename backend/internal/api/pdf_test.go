package api

import (
	"bytes"
	"net/http"
	"strings"
	"testing"
)

func TestFacturaPDF(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Cliente PDF")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrdenConMonto(t, c.ID, m.ID, "Service PDF", 5000)
	f := mustCreateFactura(t, o.ID)

	rr := doRequest(t, "GET", "/api/facturas/"+itoa(f.ID)+"/pdf", nil)
	assertStatus(t, rr, http.StatusOK)
	if ct := rr.Header().Get("Content-Type"); ct != "application/pdf" {
		t.Errorf("content-type: got %q want application/pdf", ct)
	}
	if cd := rr.Header().Get("Content-Disposition"); !strings.Contains(cd, "factura-") {
		t.Errorf("content-disposition: got %q", cd)
	}
	if !bytes.HasPrefix(rr.Body.Bytes(), []byte("%PDF")) {
		t.Errorf("el cuerpo no parece un PDF: %q", rr.Body.String())
	}
}

func TestFacturaPDFNotFound(t *testing.T) {
	cleanupTestDB(t)
	rr := doRequest(t, "GET", "/api/facturas/999999/pdf", nil)
	assertStatus(t, rr, http.StatusNotFound)
}

func TestFacturaPDFNoVeTecnico(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "tecnico@example.com", "Tecnico", "tecnico")
	token := issueTokenForTest(t, "tecnico@example.com")

	c := mustCreateCliente(t, "Cliente PDF")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrdenConMonto(t, c.ID, m.ID, "Service PDF", 5000)
	f := mustCreateFactura(t, o.ID)

	rr := doRequestAuthed(t, "GET", "/api/facturas/"+itoa(f.ID)+"/pdf", nil, token)
	assertStatus(t, rr, http.StatusForbidden)
}
