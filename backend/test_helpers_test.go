package main

import (
	"database/sql"
	"fmt"
	"os"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func TestMain(m *testing.M) {
	_ = godotenv.Load("../.env")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		"motek_test",
	)

	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		fmt.Printf("error opening test database: %v\n", err)
		os.Exit(1)
	}

	if err = db.Ping(); err != nil {
		fmt.Printf("error connecting to test database: %v\n", err)
		os.Exit(1)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(2)

	if err = migrate(); err != nil {
		fmt.Printf("error running migrations: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()

	db.Close()
	os.Exit(code)
}

func cleanupTestDB(t *testing.T) {
	tables := []string{"pagos", "facturas", "orden_repuestos", "repuestos", "ordenes_trabajo", "motos", "clientes", "users"}
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if err != nil {
			t.Logf("warning: could not clean table %s: %v", table, err)
		}
	}
}
