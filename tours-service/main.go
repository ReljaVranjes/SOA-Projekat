package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"tours-service/config"
	"tours-service/router"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  .env fajl nije pronađen, koristi se sistemski ENV")
	}

	config.ConnectToMongo()

	r := router.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}
	log.Println("🚀 Tours servis pokrenut na portu", port)
	r.Run(":" + port)
}
