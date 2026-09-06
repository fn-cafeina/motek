package api

import (
	"fmt"
	"os"
	"testing"

	"github.com/joho/godotenv"

	"motek/internal/auth"
	"motek/internal/config"
	"motek/internal/store"
)

var testServer *Server

func TestMain(m *testing.M) {
	_ = godotenv.Load("../../.env")

	cfg := config.FromEnv()
	dbName := os.Getenv("TEST_DB_NAME")
	if dbName == "" {
		dbName = "motek_test"
	}

	db, err := openTestDB(cfg, dbName)
	if err != nil {
		fmt.Printf("error opening test database: %v\n", err)
		os.Exit(1)
	}
	s := &store.Store{DB: db}
	if err := s.Migrate(); err != nil {
		fmt.Printf("error running migrations: %v\n", err)
		os.Exit(1)
	}

	secret := cfg.JWTSecret
	if secret == "" {
		secret = "test-secret"
	}
	testServer = NewServer(s, auth.New(secret), nil)

	code := m.Run()
	db.Close()
	os.Exit(code)
}
