package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"

	"stakeholders-service/config"
	"stakeholders-service/router"
)

func main() {
	// Učitaj .env fajl
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  .env fajl nije pronađen, koristi se sistemski ENV")
	}

	config.ConnectToMongo()
	
	r := router.SetupRouter();

	// Pokreni server
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	log.Println("🚀 Stakeholders servis pokrenut na portu", port)
	r.Run(":" + port)
}
