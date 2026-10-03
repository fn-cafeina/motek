package api

import (
	"net/http"
	"testing"

	"motek/internal/store"
)

func mustCreateUsuario(t *testing.T, email, nombre, rol string) store.User {
	t.Helper()
	rr := doRequest(t, "POST", "/api/usuarios", map[string]string{
		"email": email, "nombre": nombre, "password": "password123", "rol": rol,
	})
	if rr.Code != http.StatusCreated {
		t.Fatalf("create usuario: got %d want %d (%s)", rr.Code, http.StatusCreated, rr.Body.String())
	}
	user, _, err := testServer.Store.GetUserByEmail(t.Context(), email)
	if err != nil {
		t.Fatal(err)
	}
	return user
}

func TestRecepcionistaNoGestionaRepuestos(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "recepcion@example.com", "Recep", "recepcionista")
	token := issueTokenForTest(t, "recepcion@example.com")

	rr := doRequestAuthed(t, "POST", "/api/repuestos", map[string]any{"codigo": "R-1", "nombre": "Repuesto"}, token)
	assertStatus(t, rr, http.StatusForbidden)
}

func TestRecepcionistaNoCreaUsuariosPeroSiLosLista(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "recepcion@example.com", "Recep", "recepcionista")
	token := issueTokenForTest(t, "recepcion@example.com")

	rr := doRequestAuthed(t, "POST", "/api/usuarios", map[string]string{
		"email": "otro@example.com", "nombre": "Otro", "password": "password123", "rol": "tecnico",
	}, token)
	assertStatus(t, rr, http.StatusForbidden)

	rr = doRequestAuthed(t, "GET", "/api/usuarios", nil, token)
	assertStatus(t, rr, http.StatusOK)
}

func TestTecnicoNoCreaClientes(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "tecnico@example.com", "Tecnico", "tecnico")
	token := issueTokenForTest(t, "tecnico@example.com")

	rr := doRequestAuthed(t, "POST", "/api/clientes", map[string]string{"nombre": "Cliente"}, token)
	assertStatus(t, rr, http.StatusForbidden)
}

func TestTecnicoSoloOperaSusOrdenes(t *testing.T) {
	cleanupTestDB(t)
	tecnico := mustCreateUsuario(t, "tecnico@example.com", "Tecnico", "tecnico")
	token := issueTokenForTest(t, "tecnico@example.com")

	c := mustCreateCliente(t, "Cliente Taller")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrden(t, c.ID, m.ID, "Service")

	rr := doRequestAuthed(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "en_progreso"}, token)
	assertStatus(t, rr, http.StatusForbidden)

	rr = doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/tecnico", map[string]any{"tecnico_id": tecnico.ID})
	assertStatus(t, rr, http.StatusOK)

	rr = doRequestAuthed(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "en_progreso"}, token)
	assertStatus(t, rr, http.StatusOK)
}

func TestAsignarTecnicoInvalido(t *testing.T) {
	cleanupTestDB(t)
	recepcionista := mustCreateUsuario(t, "recepcion@example.com", "Recep", "recepcionista")
	c := mustCreateCliente(t, "Cliente")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrden(t, c.ID, m.ID, "Service")

	rr := doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/tecnico", map[string]any{"tecnico_id": recepcionista.ID})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestUsuarioDesactivadoNoPuedeEntrar(t *testing.T) {
	cleanupTestDB(t)
	u := mustCreateUsuario(t, "dev@example.com", "Dev", "recepcionista")

	rr := doRequest(t, "PATCH", "/api/usuarios/"+itoa(u.ID), map[string]any{
		"nombre": "Dev", "rol": "recepcionista", "activo": false,
	})
	assertStatus(t, rr, http.StatusOK)

	rr = doRequestNoAuth(t, "POST", "/api/auth/login", map[string]string{"email": "dev@example.com", "password": "password123"})
	assertStatus(t, rr, http.StatusForbidden)
}

func TestAdminNoPuedeDegradarseASiMismo(t *testing.T) {
	cleanupTestDB(t)
	testToken(t)
	user, _, err := testServer.Store.GetUserByEmail(t.Context(), "test-admin@example.com")
	if err != nil {
		t.Fatal(err)
	}

	rr := doRequest(t, "PATCH", "/api/usuarios/"+itoa(user.ID), map[string]any{"nombre": "Admin", "rol": "tecnico"})
	assertStatus(t, rr, http.StatusBadRequest)
}

func TestRecepcionistaNoCancelaFacturas(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "recepcion@example.com", "Recep", "recepcionista")
	token := issueTokenForTest(t, "recepcion@example.com")

	c := mustCreateCliente(t, "Cliente Factura")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrden(t, c.ID, m.ID, "Service")
	assertStatus(t, doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/estado", map[string]string{"estado": "entregado"}), http.StatusOK)
	f := mustCreateFactura(t, o.ID)

	rr := doRequestAuthed(t, "PATCH", "/api/facturas/"+itoa(f.ID)+"/cancelar", nil, token)
	assertStatus(t, rr, http.StatusForbidden)

	rr = doRequest(t, "PATCH", "/api/facturas/"+itoa(f.ID)+"/cancelar", nil)
	assertStatus(t, rr, http.StatusOK)
}

func TestActualizarDiagnostico(t *testing.T) {
	cleanupTestDB(t)
	tecnico := mustCreateUsuario(t, "tecnico@example.com", "Tecnico", "tecnico")
	token := issueTokenForTest(t, "tecnico@example.com")

	c := mustCreateCliente(t, "Cliente Diagnostico")
	m := mustCreateMoto(t, c.ID, "Honda", "Titan")
	o := mustCreateOrden(t, c.ID, m.ID, "Service")

	rr := doRequestAuthed(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/diagnostico", map[string]string{"diagnostico": "Revisado"}, token)
	assertStatus(t, rr, http.StatusForbidden)

	rr = doRequest(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/tecnico", map[string]any{"tecnico_id": tecnico.ID})
	assertStatus(t, rr, http.StatusOK)

	rr = doRequestAuthed(t, "PATCH", "/api/ordenes/"+itoa(o.ID)+"/diagnostico", map[string]string{"diagnostico": "Revisado"}, token)
	assertStatus(t, rr, http.StatusOK)

	rr = doRequest(t, "GET", "/api/ordenes/"+itoa(o.ID), nil)
	var actualizada store.OrdenTrabajo
	decodeBody(t, rr, &actualizada)
	if actualizada.Diagnostico != "Revisado" {
		t.Errorf("diagnostico: got %q want Revisado", actualizada.Diagnostico)
	}
}

func TestListarUsuariosPorRol(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "tecnico@example.com", "Tecnico", "tecnico")
	mustCreateUsuario(t, "recepcion@example.com", "Recep", "recepcionista")

	rr := doRequest(t, "GET", "/api/usuarios?rol=tecnico", nil)
	assertStatus(t, rr, http.StatusOK)
	var response []store.User
	decodeBody(t, rr, &response)
	if len(response) != 1 || response[0].Rol != "tecnico" {
		t.Errorf("got %v want 1 tecnico", response)
	}
}
