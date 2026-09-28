package main

import (
	"context"
	"errors"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"motek/internal/api"
	"motek/internal/auth"
	"motek/internal/config"
	"motek/internal/store"

	"github.com/joho/godotenv"
)

func main() {
	logger := slog.Default()

	if err := godotenv.Load(); err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			logger.Warn(".env no encontrado, se usan las variables del entorno")
		} else {
			logger.Error("no se pudo cargar .env", "error", err)
			os.Exit(1)
		}
	}

	cfg := config.FromEnv()
	if cfg.JWTSecret == "" {
		logger.Error("JWT_SECRET es obligatorio")
		os.Exit(1)
	}

	st, err := store.Open(cfg)
	if err != nil {
		logger.Error("no se pudo abrir la base de datos", "error", err)
		os.Exit(1)
	}
	defer st.Close()

	srv := api.NewServer(st, auth.New(cfg.JWTSecret), logger)

	httpSrv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           srv.Routes(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		logger.Info("servidor escuchando", "addr", httpSrv.Addr)
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("el servidor fallo", "error", err)
			os.Exit(1)
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	<-ctx.Done()
	stop()

	logger.Info("apagando el servidor")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpSrv.Shutdown(shutdownCtx); err != nil {
		logger.Error("el apagado no fue limpio", "error", err)
	}
}
