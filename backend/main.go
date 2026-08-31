package main

import (
	"log"
	"net/http"
	"os"

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

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(mux)))
}
