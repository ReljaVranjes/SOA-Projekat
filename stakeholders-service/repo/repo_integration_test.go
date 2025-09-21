//go:build integration

package repo

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"stakeholders-service/config"
	"stakeholders-service/model"

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoC *mongodb.MongoDBContainer
	client *mongo.Client
)

// TestMain bootstraps a disposable MongoDB and points config.MongoDB to it.
func TestMain(m *testing.M) {
	ctx := context.Background()

	// Start MongoDB 7 in a container
	c, err := mongodb.RunContainer(ctx,
		testcontainers.WithImage("mongo:7"),
		mongodb.WithUsername("test"),
		mongodb.WithPassword("test"),
	)
	if err != nil {
		panic(err)
	}
	mongoC = c

	uri, err := c.ConnectionString(ctx)
	if err != nil {
		panic(err)
	}

	// Connect client
	client, err = mongo.NewClient(options.Client().ApplyURI(uri))
	if err != nil {
		panic(err)
	}
	if err = client.Connect(ctx); err != nil {
		panic(err)
	}

	// Use a fresh db name per run to avoid collisions in CI
	dbName := fmt.Sprintf("itest_%d", time.Now().UnixNano())
	config.MongoDB = client.Database(dbName)

	// Run tests
	code := m.Run()

	// Teardown
	_ = client.Disconnect(ctx)
	_ = mongoC.Terminate(ctx)
	os.Exit(code)
}

// Helper: clean the "users" collection between tests
func cleanUsers(t *testing.T) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := config.MongoDB.Collection(getUserCollection()).Drop(ctx)
	require.NoError(t, err)
}

func TestCreateUser_ThenFindAndExists(t *testing.T) {
	cleanUsers(t)

	u := model.User{
		Username:  "alice",
		Email:     "alice@example.com",
		Password:  "hashedPW",
		Role:      model.Tourist,
		Status:    model.Active,
		FirstName: "Alice",
		LastName:  "Liddell",
	}

	require.NoError(t, CreateUser(u))

	// Find by email returns full doc incl. _id
	got, err := FindUserByEmail("alice@example.com")
	require.NoError(t, err)
	require.Equal(t, "alice", got.Username)
	require.Equal(t, model.Tourist, got.Role)
	require.False(t, got.ID.IsZero(), "expected inserted document to have an ObjectID")

	// Exists by email should be true
	exists, err := UserExistsByEmail("alice@example.com")
	require.NoError(t, err)
	require.True(t, exists)
}

func TestUpdateUserStatus_ByID(t *testing.T) {
	cleanUsers(t)

	u := model.User{
		Username: "bob",
		Email:    "bob@example.com",
		Password: "pw",
		Role:     model.Guide,
		Status:   model.Active,
	}
	require.NoError(t, CreateUser(u))

	// Find to get ID
	got, err := FindUserByEmail("bob@example.com")
	require.NoError(t, err)
	require.False(t, got.ID.IsZero())

	// Block user
	require.NoError(t, UpdateUserStatus(got.ID.Hex(), model.Blocked))

	// Verify updated
	refetched, err := FindUserByEmail("bob@example.com")
	require.NoError(t, err)
	require.Equal(t, model.Blocked, refetched.Status)
}

func TestUpdateUserProfile_AndGetAll(t *testing.T) {
	cleanUsers(t)

	// Seed a couple
	for i := 0; i < 2; i++ {
		require.NoError(t, CreateUser(model.User{
			Username: fmt.Sprintf("u%d", i),
			Email:    fmt.Sprintf("u%d@example.com", i),
			Password: "pw",
			Role:     model.Tourist,
			Status:   model.Active,
		}))
	}

	// Update one user’s profile fields
	updates := bson.M{
		"firstName":    "Updated",
		"lastName":     "Name",
		"profileImage": "http://img",
		"biography":    "bio",
		"motto":        "hi",
	}
	require.NoError(t, UpdateUserProfile("u0@example.com", updates))

	u0, err := FindUserByEmail("u0@example.com")
	require.NoError(t, err)
	require.Equal(t, "Updated", u0.FirstName)
	require.Equal(t, "Name", u0.LastName)
	require.Equal(t, "http://img", u0.ProfileImage)
	require.Equal(t, "bio", u0.Biography)
	require.Equal(t, "hi", u0.Motto)

	// Get all
	all, err := GetAllUsers()
	require.NoError(t, err)
	require.Len(t, all, 2)
}
