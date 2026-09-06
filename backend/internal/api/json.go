package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"motek/internal/store"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	if status == http.StatusNoContent {
		w.WriteHeader(status)
		return
	}
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func writeStoreError(w http.ResponseWriter, log *slog.Logger, err error) {
	var nf *store.NotFoundError
	if errors.As(err, &nf) {
		writeError(w, http.StatusNotFound, nf.Message)
		return
	}
	var cf *store.ConflictError
	if errors.As(err, &cf) {
		status := http.StatusConflict
		switch cf.Message {
		case "stock insuficiente", "stock no puede ser negativo",
			"la factura ya esta cancelada", "no se puede pagar una factura cancelada",
			"el pago excede el total de la factura":
			status = http.StatusBadRequest
		}
		writeError(w, status, cf.Message)
		return
	}
	log.Error("store error", "err", err)
	writeError(w, http.StatusInternalServerError, "error interno")
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "json invalido")
		return false
	}
	return true
}

func pathID(w http.ResponseWriter, r *http.Request, name string) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue(name), 10, 64)
	if err != nil {
		msg := "id invalido"
		switch name {
		case "rid":
			msg = "repuesto id invalido"
		case "pid":
			msg = "pago id invalido"
		}
		writeError(w, http.StatusBadRequest, msg)
		return 0, false
	}
	return id, true
}
