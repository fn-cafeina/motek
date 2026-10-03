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

const (
	userIDKey contextKey = "userID"
	userKey   contextKey = "user"
)

func UserID(r *http.Request) int64 {
	if id, ok := r.Context().Value(userIDKey).(int64); ok {
		return id
	}
	return 0
}

func User(r *http.Request) store.User {
	if u, ok := r.Context().Value(userKey).(store.User); ok {
		return u
	}
	return store.User{}
}

func Rol(r *http.Request) string {
	return User(r).Rol
}

var (
	rolesTodos      = []string{"admin", "recepcionista", "tecnico"}
	rolesAdminRecep = []string{"admin", "recepcionista"}
	rolesSoloAdmin  = []string{"admin"}
)

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

// auth valida el token y resuelve el usuario contra la base en cada pedido:
// un cambio de rol o una desactivacion tienen efecto inmediato.
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
		user, err := s.Store.GetUserByID(r.Context(), userID)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "token invalido")
			return
		}
		if !user.Activo {
			writeError(w, http.StatusUnauthorized, "usuario desactivado")
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, user.ID)
		ctx = context.WithValue(ctx, userKey, user)
		ctx = store.WithUsuario(ctx, user.ID)
		next(w, r.WithContext(ctx))
	}
}

func (s *Server) requireRoles(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, rol := range roles {
		allowed[rol] = true
	}
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !allowed[Rol(r)] {
				writeError(w, http.StatusForbidden, "no tenes permisos para esta accion")
				return
			}
			next(w, r)
		}
	}
}

func (s *Server) authRoles(roles []string, next http.HandlerFunc) http.HandlerFunc {
	return s.auth(s.requireRoles(roles...)(next))
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", s.handleHealth)

	mux.HandleFunc("POST /api/auth/register", s.handleRegister)
	mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	mux.HandleFunc("GET /api/auth/me", s.auth(s.handleMe))

	mux.HandleFunc("GET /api/usuarios", s.authRoles(rolesAdminRecep, s.handleListUsuarios))
	mux.HandleFunc("POST /api/usuarios", s.authRoles(rolesSoloAdmin, s.handleCreateUsuario))
	mux.HandleFunc("PATCH /api/usuarios/{id}", s.authRoles(rolesSoloAdmin, s.handleUpdateUsuario))

	mux.HandleFunc("GET /api/auditoria", s.authRoles(rolesSoloAdmin, s.handleListAuditoria))

	mux.HandleFunc("GET /api/reportes/tablero", s.authRoles(rolesAdminRecep, s.handleResumenTablero))

	mux.HandleFunc("GET /api/clientes", s.authRoles(rolesTodos, s.handleListClientes))
	mux.HandleFunc("POST /api/clientes", s.authRoles(rolesAdminRecep, s.handleCreateCliente))
	mux.HandleFunc("GET /api/clientes/{id}", s.authRoles(rolesTodos, s.handleGetCliente))
	mux.HandleFunc("PUT /api/clientes/{id}", s.authRoles(rolesAdminRecep, s.handleUpdateCliente))
	mux.HandleFunc("DELETE /api/clientes/{id}", s.authRoles(rolesAdminRecep, s.handleDeleteCliente))

	mux.HandleFunc("GET /api/clientes/{id}/motos", s.authRoles(rolesTodos, s.handleListMotosByCliente))
	mux.HandleFunc("POST /api/clientes/{id}/motos", s.authRoles(rolesAdminRecep, s.handleCreateMoto))
	mux.HandleFunc("GET /api/motos", s.authRoles(rolesTodos, s.handleListMotos))
	mux.HandleFunc("GET /api/motos/{id}", s.authRoles(rolesTodos, s.handleGetMoto))
	mux.HandleFunc("PUT /api/motos/{id}", s.authRoles(rolesAdminRecep, s.handleUpdateMoto))
	mux.HandleFunc("DELETE /api/motos/{id}", s.authRoles(rolesAdminRecep, s.handleDeleteMoto))

	mux.HandleFunc("GET /api/ordenes", s.authRoles(rolesTodos, s.handleListOrdenes))
	mux.HandleFunc("POST /api/ordenes", s.authRoles(rolesAdminRecep, s.handleCreateOrden))
	mux.HandleFunc("GET /api/ordenes/{id}", s.authRoles(rolesTodos, s.handleGetOrden))
	mux.HandleFunc("PUT /api/ordenes/{id}", s.authRoles(rolesAdminRecep, s.handleUpdateOrden))
	mux.HandleFunc("PATCH /api/ordenes/{id}/estado", s.authRoles(rolesTodos, s.handleUpdateOrdenEstado))
	mux.HandleFunc("PATCH /api/ordenes/{id}/diagnostico", s.authRoles(rolesTodos, s.handleUpdateOrdenDiagnostico))
	mux.HandleFunc("PATCH /api/ordenes/{id}/tecnico", s.authRoles(rolesAdminRecep, s.handleUpdateOrdenTecnico))
	mux.HandleFunc("DELETE /api/ordenes/{id}", s.authRoles(rolesAdminRecep, s.handleDeleteOrden))

	mux.HandleFunc("GET /api/repuestos", s.authRoles(rolesTodos, s.handleListRepuestos))
	mux.HandleFunc("POST /api/repuestos", s.authRoles(rolesSoloAdmin, s.handleCreateRepuesto))
	mux.HandleFunc("GET /api/repuestos/{id}", s.authRoles(rolesTodos, s.handleGetRepuesto))
	mux.HandleFunc("PUT /api/repuestos/{id}", s.authRoles(rolesSoloAdmin, s.handleUpdateRepuesto))
	mux.HandleFunc("DELETE /api/repuestos/{id}", s.authRoles(rolesSoloAdmin, s.handleDeleteRepuesto))

	mux.HandleFunc("GET /api/ordenes/{id}/repuestos", s.authRoles(rolesTodos, s.handleListOrdenRepuestos))
	mux.HandleFunc("POST /api/ordenes/{id}/repuestos", s.authRoles(rolesTodos, s.handleAddOrdenRepuesto))
	mux.HandleFunc("DELETE /api/ordenes/{id}/repuestos/{rid}", s.authRoles(rolesTodos, s.handleRemoveOrdenRepuesto))

	mux.HandleFunc("POST /api/repuestos/{id}/stock", s.authRoles(rolesSoloAdmin, s.handleAdjustStock))
	mux.HandleFunc("GET /api/alertas/stock", s.authRoles(rolesTodos, s.handleAlertasStock))

	mux.HandleFunc("GET /api/facturas", s.authRoles(rolesAdminRecep, s.handleListFacturas))
	mux.HandleFunc("POST /api/facturas", s.authRoles(rolesAdminRecep, s.handleCreateFactura))
	mux.HandleFunc("GET /api/facturas/{id}", s.authRoles(rolesAdminRecep, s.handleGetFactura))
	mux.HandleFunc("PUT /api/facturas/{id}", s.authRoles(rolesAdminRecep, s.handleUpdateFactura))
	mux.HandleFunc("PATCH /api/facturas/{id}/cancelar", s.authRoles(rolesSoloAdmin, s.handleCancelFactura))
	mux.HandleFunc("GET /api/facturas/{id}/pdf", s.authRoles(rolesAdminRecep, s.handleFacturaPDF))

	mux.HandleFunc("GET /api/facturas/{id}/pagos", s.authRoles(rolesAdminRecep, s.handleListPagos))
	mux.HandleFunc("POST /api/facturas/{id}/pagos", s.authRoles(rolesAdminRecep, s.handleCreatePago))
	mux.HandleFunc("DELETE /api/facturas/{id}/pagos/{pid}", s.authRoles(rolesSoloAdmin, s.handleDeletePago))

	return s.cors(mux)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
