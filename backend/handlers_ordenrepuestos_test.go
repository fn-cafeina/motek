package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestListOrdenRepuestosHandler(t *testing.T) {
	defer cleanupTestDB(t)

	clientBody, _ := json.Marshal(map[string]string{"nombre": "Test"})
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)
	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	motoBody, _ := json.Marshal(map[string]interface{}{"marca": "Honda"})
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)
	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	ordenBody, _ := json.Marshal(map[string]interface{}{
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Test order",
	})
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)
	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	repuestoBody, _ := json.Marshal(map[string]interface{}{
		"codigo":       "PART-001",
		"nombre":       "Filtro",
		"precio_venta": 10000,
		"stock":        10,
	})
	repuestoReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(repuestoBody))
	repuestoReq.Header.Set("Content-Type", "application/json")
	repuestoRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(repuestoRR, repuestoReq)
	var repuesto Repuesto
	json.Unmarshal(repuestoRR.Body.Bytes(), &repuesto)

	addBody, _ := json.Marshal(map[string]interface{}{
		"repuesto_id": repuesto.ID,
		"cantidad":    2,
	})
	addReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/ordenes/%d/repuestos", orden.ID), bytes.NewBuffer(addBody))
	addReq.Header.Set("Content-Type", "application/json")
	addReq.SetPathValue("id", fmt.Sprintf("%d", orden.ID))
	addRR := httptest.NewRecorder()
	http.HandlerFunc(addOrdenRepuestoHandler).ServeHTTP(addRR, addReq)

	if addRR.Code != http.StatusCreated {
		t.Errorf("add repuesto: got %v want %v", addRR.Code, http.StatusCreated)
	}

	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/ordenes/%d/repuestos", orden.ID), nil)
	req.SetPathValue("id", fmt.Sprintf("%d", orden.ID))

	rr := httptest.NewRecorder()
	http.HandlerFunc(listOrdenRepuestosHandler).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", rr.Code, http.StatusOK)
	}

	var response []OrdenRepuesto
	json.Unmarshal(rr.Body.Bytes(), &response)

	if len(response) != 1 {
		t.Errorf("expected 1 repuesto, got %v", len(response))
	}

	if response[0].Cantidad != 2 {
		t.Errorf("expected cantidad 2, got %v", response[0].Cantidad)
	}
}

func TestAddOrdenRepuestoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	clientBody, _ := json.Marshal(map[string]string{"nombre": "Test"})
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)
	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	motoBody, _ := json.Marshal(map[string]interface{}{"marca": "Honda"})
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)
	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	ordenBody, _ := json.Marshal(map[string]interface{}{
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Test order",
	})
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)
	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	repuestoBody, _ := json.Marshal(map[string]interface{}{
		"codigo":       "PART-002",
		"nombre":       "Cadena",
		"precio_venta": 20000,
		"stock":        5,
	})
	repuestoReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(repuestoBody))
	repuestoReq.Header.Set("Content-Type", "application/json")
	repuestoRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(repuestoRR, repuestoReq)
	var repuesto Repuesto
	json.Unmarshal(repuestoRR.Body.Bytes(), &repuesto)

	addBody, _ := json.Marshal(map[string]interface{}{
		"repuesto_id": repuesto.ID,
		"cantidad":    3,
	})
	addReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/ordenes/%d/repuestos", orden.ID), bytes.NewBuffer(addBody))
	addReq.Header.Set("Content-Type", "application/json")
	addReq.SetPathValue("id", fmt.Sprintf("%d", orden.ID))

	rr := httptest.NewRecorder()
	http.HandlerFunc(addOrdenRepuestoHandler).ServeHTTP(rr, addReq)

	if rr.Code != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", rr.Code, http.StatusCreated)
	}

	var response OrdenRepuesto
	json.Unmarshal(rr.Body.Bytes(), &response)

	if response.Cantidad != 3 {
		t.Errorf("expected cantidad 3, got %v", response.Cantidad)
	}

	if response.Subtotal != 60000 {
		t.Errorf("expected subtotal 60000, got %v", response.Subtotal)
	}

	var stock int
	db.QueryRow("SELECT stock FROM repuestos WHERE id = ?", repuesto.ID).Scan(&stock)
	if stock != 2 {
		t.Errorf("expected stock 2 after add, got %v", stock)
	}
}

func TestAddOrdenRepuestoInsufficientStock(t *testing.T) {
	defer cleanupTestDB(t)

	clientBody, _ := json.Marshal(map[string]string{"nombre": "Test"})
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)
	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	motoBody, _ := json.Marshal(map[string]interface{}{"marca": "Honda"})
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)
	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	ordenBody, _ := json.Marshal(map[string]interface{}{
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Test order",
	})
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)
	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	repuestoBody, _ := json.Marshal(map[string]interface{}{
		"codigo":       "PART-003",
		"nombre":       "Filtro",
		"precio_venta": 10000,
		"stock":        2,
	})
	repuestoReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(repuestoBody))
	repuestoReq.Header.Set("Content-Type", "application/json")
	repuestoRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(repuestoRR, repuestoReq)
	var repuesto Repuesto
	json.Unmarshal(repuestoRR.Body.Bytes(), &repuesto)

	addBody, _ := json.Marshal(map[string]interface{}{
		"repuesto_id": repuesto.ID,
		"cantidad":    10,
	})
	addReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/ordenes/%d/repuestos", orden.ID), bytes.NewBuffer(addBody))
	addReq.Header.Set("Content-Type", "application/json")
	addReq.SetPathValue("id", fmt.Sprintf("%d", orden.ID))

	rr := httptest.NewRecorder()
	http.HandlerFunc(addOrdenRepuestoHandler).ServeHTTP(rr, addReq)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code: got %v want %v", rr.Code, http.StatusBadRequest)
	}
}

func TestRemoveOrdenRepuestoHandler(t *testing.T) {
	defer cleanupTestDB(t)

	clientBody, _ := json.Marshal(map[string]string{"nombre": "Test"})
	clientReq, _ := http.NewRequest("POST", "/api/clientes", bytes.NewBuffer(clientBody))
	clientReq.Header.Set("Content-Type", "application/json")
	clientRR := httptest.NewRecorder()
	http.HandlerFunc(createClienteHandler).ServeHTTP(clientRR, clientReq)
	var client Cliente
	json.Unmarshal(clientRR.Body.Bytes(), &client)

	motoBody, _ := json.Marshal(map[string]interface{}{"marca": "Honda"})
	motoReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/clientes/%d/motos", client.ID), bytes.NewBuffer(motoBody))
	motoReq.Header.Set("Content-Type", "application/json")
	motoReq.SetPathValue("id", fmt.Sprintf("%d", client.ID))
	motoRR := httptest.NewRecorder()
	http.HandlerFunc(createMotoHandler).ServeHTTP(motoRR, motoReq)
	var moto Moto
	json.Unmarshal(motoRR.Body.Bytes(), &moto)

	ordenBody, _ := json.Marshal(map[string]interface{}{
		"cliente_id":  client.ID,
		"moto_id":     moto.ID,
		"descripcion": "Test order",
	})
	ordenReq, _ := http.NewRequest("POST", "/api/ordenes", bytes.NewBuffer(ordenBody))
	ordenReq.Header.Set("Content-Type", "application/json")
	ordenRR := httptest.NewRecorder()
	http.HandlerFunc(createOrdenHandler).ServeHTTP(ordenRR, ordenReq)
	var orden OrdenTrabajo
	json.Unmarshal(ordenRR.Body.Bytes(), &orden)

	repuestoBody, _ := json.Marshal(map[string]interface{}{
		"codigo":       "PART-004",
		"nombre":       "Disco",
		"precio_venta": 30000,
		"stock":        5,
	})
	repuestoReq, _ := http.NewRequest("POST", "/api/repuestos", bytes.NewBuffer(repuestoBody))
	repuestoReq.Header.Set("Content-Type", "application/json")
	repuestoRR := httptest.NewRecorder()
	http.HandlerFunc(createRepuestoHandler).ServeHTTP(repuestoRR, repuestoReq)
	var repuesto Repuesto
	json.Unmarshal(repuestoRR.Body.Bytes(), &repuesto)

	addBody, _ := json.Marshal(map[string]interface{}{
		"repuesto_id": repuesto.ID,
		"cantidad":    2,
	})
	addReq, _ := http.NewRequest("POST", fmt.Sprintf("/api/ordenes/%d/repuestos", orden.ID), bytes.NewBuffer(addBody))
	addReq.Header.Set("Content-Type", "application/json")
	addReq.SetPathValue("id", fmt.Sprintf("%d", orden.ID))
	addRR := httptest.NewRecorder()
	http.HandlerFunc(addOrdenRepuestoHandler).ServeHTTP(addRR, addReq)

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/ordenes/%d/repuestos/%d", orden.ID, repuesto.ID), nil)
	req.SetPathValue("id", fmt.Sprintf("%d", orden.ID))
	req.SetPathValue("rid", fmt.Sprintf("%d", repuesto.ID))

	rr := httptest.NewRecorder()
	http.HandlerFunc(removeOrdenRepuestoHandler).ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Errorf("handler returned wrong status code: got %v want %v", rr.Code, http.StatusNoContent)
	}

	var stock int
	db.QueryRow("SELECT stock FROM repuestos WHERE id = ?", repuesto.ID).Scan(&stock)
	if stock != 5 {
		t.Errorf("expected stock 5 after remove, got %v", stock)
	}
}
