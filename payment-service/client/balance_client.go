package client

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	balancepb "payment-service/proto/balance"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type BalanceClient struct {
	client balancepb.BalanceServiceClient
	conn   *grpc.ClientConn
}

func NewBalanceClient() (*BalanceClient, error) {
	stakeholdersGrpcURL := os.Getenv("STAKEHOLDERS_GRPC_URL")
	if stakeholdersGrpcURL == "" {
		stakeholdersGrpcURL = "stakeholders-service:4001"
	}

	log.Printf("🔵 Connecting to stakeholders gRPC at: %s", stakeholdersGrpcURL)

	conn, err := grpc.Dial(stakeholdersGrpcURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to stakeholders service: %w", err)
	}

	client := balancepb.NewBalanceServiceClient(conn)

	return &BalanceClient{
		client: client,
		conn:   conn,
	}, nil
}

func (bc *BalanceClient) Close() error {
	return bc.conn.Close()
}

func (bc *BalanceClient) GetBalance(userID string) (float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req := &balancepb.GetBalanceRequest{
		UserId: userID,
	}

	resp, err := bc.client.GetBalance(ctx, req)
	if err != nil {
		return 0, fmt.Errorf("failed to get balance: %w", err)
	}

	if !resp.Success {
		return 0, fmt.Errorf("get balance failed: %s", resp.Message)
	}

	return resp.Balance, nil
}

func (bc *BalanceClient) AddBalance(userID string, amount float64) (float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req := &balancepb.AddBalanceRequest{
		UserId: userID,
		Amount: amount,
	}

	resp, err := bc.client.AddBalance(ctx, req)
	if err != nil {
		return 0, fmt.Errorf("failed to add balance: %w", err)
	}

	if !resp.Success {
		return 0, fmt.Errorf("add balance failed: %s", resp.Message)
	}

	log.Printf("✅ Balance updated for user %s: new balance = %f", userID, resp.NewBalance)
	return resp.NewBalance, nil
}

func (bc *BalanceClient) DeductBalance(userID string, amount float64) (float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req := &balancepb.DeductBalanceRequest{
		UserId: userID,
		Amount: amount,
	}

	resp, err := bc.client.DeductBalance(ctx, req)
	if err != nil {
		return 0, fmt.Errorf("failed to deduct balance: %w", err)
	}

	if !resp.Success {
		if strings.Contains(resp.Message, "Insufficient balance") {
			return resp.NewBalance, fmt.Errorf("insufficient balance: %s", resp.Message)
		}
		return resp.NewBalance, fmt.Errorf("deduct balance failed: %s", resp.Message)
	}

	log.Printf("✅ Balance deducted for user %s: new balance = %f", userID, resp.NewBalance)
	return resp.NewBalance, nil
}
