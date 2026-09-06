package api

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	"motek/internal/auth"
	"motek/internal/store"
)

type contextKey string

const userIDKey contextKey = "userID"

func UserID(r *http.Request) int64 {
	if id, ok := r.Context().Value(userIDKey).(int64); ok {
		return id
	}
	return 0
}

type Server struct {
	Store *store.Store
	Auth  *auth.Auth
	Log   *slog.Logger
}

func NewServer(s *store.Store, a *auth.Auth, log *slog.Logger) *Server {
	if log == nil {
		log = slog.Default()
	}
	return &Server{Store: s, Auth: a, Log: log}
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" {
			writeError(w, http.StatusUnauthorized, "token requerido")
			return
		}
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			writeError(w, http.StatusUnauthorized, "formato de token invalido")
			return
		}
		userID, err := s.Auth.Validate(parts[1])
		if err != nil {
			writeError(w, http.StatusUnauthorized, "token invalido")
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", s.handleHealth)

	mux.HandleFunc("POST /api/auth/register", s.handleRegister)
	mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	mux.HandleFunc("GET /api/auth/me", s.auth(s.handleMe))

	mux.HandleFunc("GET /api/clientes", s.auth(s.handleListClientes))
	mux.HandleFunc("POST /api/clientes", s.auth(s.handleCreateCliente))
	mux.HandleFunc("GET /api/clientes/{id}", s.auth(s.handleGetCliente))
	mux.HandleFunc("PUT /api/clientes/{id}", s.auth(s.handleUpdateCliente))
	mux.HandleFunc("DELETE /api/clientes/{id}", s.auth(s.handleDeleteCliente))

	mux.HandleFunc("GET /api/clientes/{id}/motos", s.auth(s.handleListMotosByCliente))
	mux.HandleFunc("POST /api/clientes/{id}/motos", s.auth(s.handleCreateMoto))
	mux.HandleFunc("GET /api/motos", s.auth(s.handleListMotos))
	mux.HandleFunc("GET /api/motos/{id}", s.auth(s.handleGetMoto))
	mux.HandleFunc("PUT /api/motos/{id}", s.auth(s.handleUpdateMoto))
	mux.HandleFunc("DELETE /api/motos/{id}", s.auth(s.handleDeleteMoto))

	mux.HandleFunc("GET /api/ordenes", s.auth(s.handleListOrdenes))
	mux.HandleFunc("POST /api/ordenes", s.auth(s.handleCreateOrden))
	mux.HandleFunc("GET /api/ordenes/{id}", s.auth(s.handleGetOrden))
	mux.HandleFunc("PUT /api/ordenes/{id}", s.auth(s.handleUpdateOrden))
	mux.HandleFunc("PATCH /api/ordenes/{id}/estado", s.auth(s.handleUpdateOrdenEstado))
	mux.HandleFunc("DELETE /api/ordenes/{id}", s.auth(s.handleDeleteOrden))

	mux.HandleFunc("GET /api/repuestos", s.auth(s.handleListRepuestos))
	mux.HandleFunc("POST /api/repuestos", s.auth(s.handleCreateRepuesto))
	mux.HandleFunc("GET /api/repuestos/{id}", s.auth(s.handleGetRepuesto))
	mux.HandleFunc("PUT /api/repuestos/{id}", s.auth(s.handleUpdateRepuesto))
	mux.HandleFunc("DELETE /api/repuestos/{id}", s.auth(s.handleDeleteRepuesto))

	mux.HandleFunc("GET /api/ordenes/{id}/repuestos", s.auth(s.handleListOrdenRepuestos))
	mux.HandleFunc("POST /api/ordenes/{id}/repuestos", s.auth(s.handleAddOrdenRepuesto))
	mux.HandleFunc("DELETE /api/ordenes/{id}/repuestos/{rid}", s.auth(s.handleRemoveOrdenRepuesto))

	mux.HandleFunc("POST /api/repuestos/{id}/stock", s.auth(s.handleAdjustStock))
	mux.HandleFunc("GET /api/alertas/stock", s.auth(s.handleAlertasStock))

	mux.HandleFunc("GET /api/facturas", s.auth(s.handleListFacturas))
	mux.HandleFunc("POST /api/facturas", s.auth(s.handleCreateFactura))
	mux.HandleFunc("GET /api/facturas/{id}", s.auth(s.handleGetFactura))
	mux.HandleFunc("PUT /api/facturas/{id}", s.auth(s.handleUpdateFactura))
	mux.HandleFunc("PATCH /api/facturas/{id}/cancelar", s.auth(s.handleCancelFactura))

	mux.HandleFunc("GET /api/facturas/{id}/pagos", s.auth(s.handleListPagos))
	mux.HandleFunc("POST /api/facturas/{id}/pagos", s.auth(s.handleCreatePago))
	mux.HandleFunc("DELETE /api/facturas/{id}/pagos/{pid}", s.auth(s.handleDeletePago))

	return s.cors(mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
