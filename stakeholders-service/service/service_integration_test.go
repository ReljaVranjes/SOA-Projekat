//go:build integration
package service

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"stakeholders-service/config"
	"stakeholders-service/model"
	"stakeholders-service/repo"

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/mongodb"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoC *mongodb.MongoDBContainer
	client *mongo.Client
)

func TestMain(m *testing.M) {
	ctx := context.Background()

	c, err := mongodb.RunContainer(ctx,
		testcontainers.WithImage("mongo:7"),
		mongodb.WithUsername("test"),
		mongodb.WithPassword("test"),
	)
	if err != nil {
		fmt.Println("failed to start mongo container:", err)
		os.Exit(1)
	}
	mongoC = c

	uri, err := c.ConnectionString(ctx)
	if err != nil {
		fmt.Println("failed to get connection string:", err)
		_ = mongoC.Terminate(ctx)
		os.Exit(1)
	}

	client, err = mongo.NewClient(options.Client().ApplyURI(uri))
	if err != nil {
		fmt.Println("failed to make client:", err)
		_ = mongoC.Terminate(ctx)
		os.Exit(1)
	}
	if err = client.Connect(ctx); err != nil {
		fmt.Println("connect error:", err)
		_ = mongoC.Terminate(ctx)
		os.Exit(1)
	}

	// čekaj dok ping ne prođe
	deadline := time.Now().Add(90 * time.Second)
	for {
		pctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		err = client.Ping(pctx, nil)
		cancel()
		if err == nil || time.Now().After(deadline) {
			break
		}
		time.Sleep(1 * time.Second)
	}
	if err != nil {
		fmt.Println("mongo never responded to ping:", err)
		_ = client.Disconnect(context.Background())
		_ = mongoC.Terminate(ctx)
		os.Exit(1)
	}

	dbName := fmt.Sprintf("itest_svc_%d", time.Now().UnixNano())
	config.MongoDB = client.Database(dbName)

	code := m.Run()

	_ = client.Disconnect(ctx)
	_ = mongoC.Terminate(ctx)
	os.Exit(code)
}


func cleanUsersSvc(t *testing.T) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := config.MongoDB.Collection("users").Drop(ctx)
	require.NoError(t, err)
}

func TestUpdateUserLocation_Service(t *testing.T) {
	cleanUsersSvc(t)

	require.NoError(t, repo.CreateUser(model.User{
		Username: "dora",
		Email:    "dora@example.com",
		Password: "hash",
		Role:     model.Guide,
		Status:   model.Active,
	}))

	loc := model.Location{Lat: 44.8125, Lng: 20.4612} // Belgrade-ish
	after, err := UpdateUserLocation("dora@example.com", loc)
	require.NoError(t, err)
	require.NotNil(t, after.CurrentLocation)
	require.InDelta(t, 44.8125, after.CurrentLocation.Lat, 1e-9)
	require.InDelta(t, 20.4612, after.CurrentLocation.Lng, 1e-9)
}

func TestAdmin_BlockAndUnblock(t *testing.T) {
	cleanUsersSvc(t)

	require.NoError(t, repo.CreateUser(model.User{
		Username: "eve",
		Email:    "eve@example.com",
		Password: "hash",
		Role:     model.Tourist,
		Status:   model.Active,
	}))

	// fetch ID
	u, err := repo.FindUserByEmail("eve@example.com")
	require.NoError(t, err)
	idHex := u.ID.Hex()

	// block
	require.NoError(t, BlockUser(model.Admin, idHex))
	refetched, err := repo.FindUserByEmail("eve@example.com")
	require.NoError(t, err)
	require.Equal(t, model.Blocked, refetched.Status)

	// unblock
	require.NoError(t, UnblockUser(model.Admin, idHex))
	refetched, err = repo.FindUserByEmail("eve@example.com")
	require.NoError(t, err)
	require.Equal(t, model.Active, refetched.Status)
}

func TestGetUserById_Service(t *testing.T) {
	cleanUsersSvc(t)

	require.NoError(t, repo.CreateUser(model.User{
		Username: "frank",
		Email:    "frank@example.com",
		Password: "hash",
		Role:     model.Tourist,
		Status:   model.Active,
	}))

	u, err := repo.FindUserByEmail("frank@example.com")
	require.NoError(t, err)

	got, err := GetUserById(u.ID.Hex())
	require.NoError(t, err)
	require.Equal(t, "frank@example.com", got.Email)
	require.Empty(t, got.Password)
}
