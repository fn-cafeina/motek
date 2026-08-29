package main

import "net/http"

func setupRoutes() http.Handler {
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("GET /health", healthHandler)

	// Auth (public)
	mux.HandleFunc("POST /api/auth/register", registerHandler)
	mux.HandleFunc("POST /api/auth/login", loginHandler)

	// Auth (protected)
	mux.HandleFunc("GET /api/auth/me", authMiddleware(meHandler))

	// Clientes (protected)
	mux.HandleFunc("GET /api/clientes", authMiddleware(listClientesHandler))
	mux.HandleFunc("POST /api/clientes", authMiddleware(createClienteHandler))
	mux.HandleFunc("GET /api/clientes/{id}", authMiddleware(getClienteHandler))
	mux.HandleFunc("PUT /api/clientes/{id}", authMiddleware(updateClienteHandler))
	mux.HandleFunc("DELETE /api/clientes/{id}", authMiddleware(deleteClienteHandler))

	// Motos (protected)
	mux.HandleFunc("GET /api/clientes/{id}/motos", authMiddleware(listMotosByClienteHandler))
	mux.HandleFunc("POST /api/clientes/{id}/motos", authMiddleware(createMotoHandler))
	mux.HandleFunc("GET /api/motos/{id}", authMiddleware(getMotoHandler))
	mux.HandleFunc("PUT /api/motos/{id}", authMiddleware(updateMotoHandler))
	mux.HandleFunc("DELETE /api/motos/{id}", authMiddleware(deleteMotoHandler))

	// Ordenes de trabajo (protected)
	mux.HandleFunc("GET /api/ordenes", authMiddleware(listOrdenesHandler))
	mux.HandleFunc("POST /api/ordenes", authMiddleware(createOrdenHandler))
	mux.HandleFunc("GET /api/ordenes/{id}", authMiddleware(getOrdenHandler))
	mux.HandleFunc("PUT /api/ordenes/{id}", authMiddleware(updateOrdenHandler))
	mux.HandleFunc("PATCH /api/ordenes/{id}/estado", authMiddleware(updateEstadoOrdenHandler))
	mux.HandleFunc("DELETE /api/ordenes/{id}", authMiddleware(deleteOrdenHandler))

	return mux
}
