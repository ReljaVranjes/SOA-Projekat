package main

import (
	"log"
	"net"
	"os"

	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"stakeholders-service/config"
	"stakeholders-service/handler"
	pb "stakeholders-service/proto/block"
	"stakeholders-service/router"
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
	lis, err := net.Listen("tcp", ":4001")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpsServer := grpc.NewServer()
	reflection.Register(grpsServer)

    blockHandler := handler.BlockHandler{}
    pb.RegisterBlockServiceServer(grpsServer, &blockHandler)

	log.Println("🚀 gRPC server running on port 4001")
	if err := grpsServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC: %v", err)
	}
}

func startHttpServer() {
	r := router.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	log.Println("🚀 HTTP server running on port", port)
	r.Run(":" + port)
}
