package repo

import (
	"context"
	"stakeholders-service/config"
	"stakeholders-service/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

func getUserCollection() string {
	return "users" // ime kolekcije u MongoDB
}

func UserExistsByEmail(email string) (bool, error) {
	collection := config.MongoDB.Collection(getUserCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"email": email}
	count, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func CreateUser(user model.User) error {
	collection := config.MongoDB.Collection(getUserCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, user)
	return err
}

func FindUserByEmail(email string) (model.User, error) {
	collection := config.MongoDB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user model.User
	err := collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	return user, err
}
