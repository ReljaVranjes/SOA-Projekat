package main

import (
	"log"
	"net"
	"os"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"tours-service/config"
	"tours-service/handler"
	pb "tours-service/proto/tours"
	"tours-service/router"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  .env fajl nije pronađen, koristi se sistemski ENV")
	}

	config.ConnectToMongo()

	// Start gRPC server in a goroutine
	go startGrpcServer()

	// Start HTTP server
	startHttpServer()
}

func startGrpcServer() {
	lis, err := net.Listen("tcp", ":5001")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	reflection.Register(grpcServer)

	toursHandler := handler.ToursHandler{}
	pb.RegisterToursServiceServer(grpcServer, &toursHandler)

	log.Println("🚀 gRPC server running on port 5001")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}

func startHttpServer() {
	r := router.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}
	log.Println("🚀 Tours servis pokrenut na portu", port)
	r.Run(":" + port)
}