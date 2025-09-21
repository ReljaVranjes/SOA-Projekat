package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"payment-service/config"
	"payment-service/router"
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
		port = "6000"
	}
	log.Println("🚀 Payment servis pokrenut na portu", port)
	r.Run(":" + port)
}