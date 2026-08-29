package main

import (
	"log"
	"net/http"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	if err := initDB(); err != nil {
		log.Fatal("Database connection failed:", err)
	}
	defer db.Close()

	mux := setupRoutes()

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
