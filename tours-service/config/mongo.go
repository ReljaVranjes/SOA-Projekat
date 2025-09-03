package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client
var MongoDB *mongo.Database

func ConnectToMongo() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("❌ MONGO_URI nije definisan u .env fajlu")
	}

	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("❌ Greška pri konekciji na Mongo:", err)
	}

	// Proveri konekciju
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("❌ Mongo ping neuspešan:", err)
	}

	MongoClient = client
	MongoDB = client.Database("stakeholders-db")

	fmt.Println("✅ Povezano na MongoDB")
}
