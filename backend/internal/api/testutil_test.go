package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"motek/internal/config"
	"motek/internal/store"
)

func openTestDB(cfg config.Config, dbName string) (*sql.DB, error) {
	db, err := sql.Open("mysql", cfg.DSN(dbName))
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(2)
	return db, nil
}

func cleanupTestDB(t *testing.T) {
	t.Helper()
	tables := []string{"pagos", "facturas", "orden_repuestos", "repuestos", "ordenes_trabajo", "motos", "clientes", "users"}
	for _, table := range tables {
		if _, err := testServer.Store.DB.Exec(fmt.Sprintf("DELETE FROM %s", table)); err != nil {
			t.Fatalf("could not clean table %s: %v", table, err)
		}
	}
}

func doRequest(t *testing.T, method, target string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var buf *bytes.Buffer
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		buf = bytes.NewBuffer(b)
	} else {
		buf = bytes.NewBuffer(nil)
	}
	req := httptest.NewRequest(method, target, buf)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token := testToken(t); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rr := httptest.NewRecorder()
	testServer.Routes().ServeHTTP(rr, req)
	return rr
}

func doRequestAuthed(t *testing.T, method, target string, body any, token string) *httptest.ResponseRecorder {
	t.Helper()
	var buf *bytes.Buffer
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		buf = bytes.NewBuffer(b)
	} else {
		buf = bytes.NewBuffer(nil)
	}
	req := httptest.NewRequest(method, target, buf)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rr := httptest.NewRecorder()
	testServer.Routes().ServeHTTP(rr, req)
	return rr
}

func doRequestNoAuth(t *testing.T, method, target string, body any) *httptest.ResponseRecorder {
	t.Helper()
	return doRequestAuthed(t, method, target, body, "")
}

var testUserToken string

func testToken(t *testing.T) string {
	t.Helper()
	if testUserToken != "" {
		return testUserToken
	}
	email := "test-admin@example.com"
	hash, err := hashForTest("password123")
	if err != nil {
		t.Fatal(err)
	}
	id, err := testServer.Store.CreateUser(t.Context(), email, hash)
	if err != nil {
		if _, _, gerr := testServer.Store.GetUserByEmail(t.Context(), email); gerr == nil {
			return issueTokenForTest(t, email)
		}
		t.Fatal(err)
	}
	_ = id
	return issueTokenForTest(t, email)
}

func decodeBody(t *testing.T, rr *httptest.ResponseRecorder, dst any) {
	t.Helper()
	if err := json.Unmarshal(rr.Body.Bytes(), dst); err != nil {
		t.Fatalf("error unmarshaling response %q: %v", rr.Body.String(), err)
	}
}

func mustCreateCliente(t *testing.T, nombre string) store.Cliente {
	t.Helper()
	rr := doRequest(t, "POST", "/api/clientes", map[string]string{"nombre": nombre})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create cliente: got %d want %d (%s)", rr.Code, http.StatusCreated, rr.Body.String())
	}
	var c store.Cliente
	decodeBody(t, rr, &c)
	if c.ID == 0 {
		t.Fatal("create cliente returned zero ID")
	}
	return c
}

func mustCreateMoto(t *testing.T, clienteID int64, marca, modelo string) store.Moto {
	t.Helper()
	rr := doRequest(t, "POST", fmt.Sprintf("/api/clientes/%d/motos", clienteID),
		map[string]string{"marca": marca, "modelo": modelo})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create moto: got %d want %d (%s)", rr.Code, http.StatusCreated, rr.Body.String())
	}
	var m store.Moto
	decodeBody(t, rr, &m)
	return m
}

func mustCreateOrden(t *testing.T, clienteID, motoID int64, descripcion string) store.OrdenTrabajo {
	t.Helper()
	rr := doRequest(t, "POST", "/api/ordenes", map[string]any{
		"cliente_id":  clienteID,
		"moto_id":     motoID,
		"descripcion": descripcion,
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create orden: got %d want %d (%s)", rr.Code, http.StatusCreated, rr.Body.String())
	}
	var o store.OrdenTrabajo
	decodeBody(t, rr, &o)
	return o
}

func mustCreateRepuesto(t *testing.T, codigo string, precioVenta, stock int) store.Repuesto {
	t.Helper()
	rr := doRequest(t, "POST", "/api/repuestos", map[string]any{
		"codigo":       codigo,
		"nombre":       "Repuesto " + codigo,
		"precio_venta": precioVenta,
		"stock":        stock,
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create repuesto: got %d want %d (%s)", rr.Code, http.StatusCreated, rr.Body.String())
	}
	var rp store.Repuesto
	decodeBody(t, rr, &rp)
	return rp
}

func mustCreateFactura(t *testing.T, ordenID int64) store.Factura {
	t.Helper()
	rr := doRequest(t, "POST", "/api/facturas", map[string]int64{"orden_id": ordenID})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create factura: got %d want %d (%s)", rr.Code, http.StatusCreated, rr.Body.String())
	}
	var f store.Factura
	decodeBody(t, rr, &f)
	return f
}

func mustGetStock(t *testing.T, repuestoID int64) int {
	t.Helper()
	stock, err := testServer.Store.GetStock(t.Context(), repuestoID)
	if err != nil {
		t.Fatal(err)
	}
	return stock
}

func assertStatus(t *testing.T, rr *httptest.ResponseRecorder, want int) {
	t.Helper()
	if rr.Code != want {
		t.Errorf("wrong status code: got %v want %v (body: %s)", rr.Code, want, rr.Body.String())
	}
}

func assertContentType(t *testing.T, rr *httptest.ResponseRecorder) {
	t.Helper()
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("wrong Content-Type: got %q want %q", ct, "application/json")
	}
}
