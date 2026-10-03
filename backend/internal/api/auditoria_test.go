package api

import (
	"net/http"
	"strings"
	"testing"

	"motek/internal/store"
)

func TestAuditoriaRegistraCreacionConUsuario(t *testing.T) {
	cleanupTestDB(t)
	token := testToken(t)
	admin, _, err := testServer.Store.GetUserByEmail(t.Context(), "test-admin@example.com")
	if err != nil {
		t.Fatal(err)
	}

	rr := doRequestAuthed(t, "POST", "/api/clientes", map[string]string{"nombre": "Cliente Auditado"}, token)
	assertStatus(t, rr, http.StatusCreated)
	var c store.Cliente
	decodeBody(t, rr, &c)

	rr = doRequest(t, "GET", "/api/auditoria?tabla=clientes&registro_id="+itoa(c.ID), nil)
	assertStatus(t, rr, http.StatusOK)
	var items []store.AuditoriaItem
	decodeBody(t, rr, &items)
	if len(items) != 1 {
		t.Fatalf("got %d registros de auditoria want 1", len(items))
	}
	reg := items[0]
	if reg.Accion != "crear" {
		t.Errorf("accion: got %q want crear", reg.Accion)
	}
	if reg.UsuarioID == nil || *reg.UsuarioID != admin.ID {
		t.Errorf("usuario_id: got %v want %d", reg.UsuarioID, admin.ID)
	}
	if reg.UsuarioEmail != "test-admin@example.com" {
		t.Errorf("usuario_email: got %q", reg.UsuarioEmail)
	}
	if !strings.Contains(string(reg.DatosDespues), "Cliente Auditado") {
		t.Errorf("datos_despues sin el nombre: %s", reg.DatosDespues)
	}
	if got := string(reg.DatosAntes); got != "null" {
		t.Errorf("datos_antes deberia ser null en una creacion: %s", got)
	}
}

func TestAuditoriaRegistraEdicionConAntesYDespues(t *testing.T) {
	cleanupTestDB(t)
	c := mustCreateCliente(t, "Nombre Original")

	rr := doRequest(t, "PUT", "/api/clientes/"+itoa(c.ID), map[string]string{"nombre": "Nombre Nuevo"})
	assertStatus(t, rr, http.StatusOK)

	rr = doRequest(t, "GET", "/api/auditoria?tabla=clientes&registro_id="+itoa(c.ID), nil)
	var items []store.AuditoriaItem
	decodeBody(t, rr, &items)
	if len(items) != 2 {
		t.Fatalf("got %d registros want 2", len(items))
	}
	if items[0].Accion != "editar" {
		t.Errorf("accion: got %q want editar", items[0].Accion)
	}
	if !strings.Contains(string(items[0].DatosAntes), "Nombre Original") {
		t.Errorf("datos_antes: %s", items[0].DatosAntes)
	}
	if !strings.Contains(string(items[0].DatosDespues), "Nombre Nuevo") {
		t.Errorf("datos_despues: %s", items[0].DatosDespues)
	}
}

func TestAuditoriaSoloAdmin(t *testing.T) {
	cleanupTestDB(t)
	mustCreateUsuario(t, "recepcion@example.com", "Recep", "recepcionista")
	token := issueTokenForTest(t, "recepcion@example.com")

	rr := doRequestAuthed(t, "GET", "/api/auditoria", nil, token)
	assertStatus(t, rr, http.StatusForbidden)
}
