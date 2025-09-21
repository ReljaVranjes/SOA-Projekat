package repo

import (
	"context"
	"stakeholders-service/config"
	"stakeholders-service/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func GetAllUsers() ([]model.User, error) {
	collection := config.MongoDB.Collection(getUserCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []model.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

func UpdateUserStatus(userID string, status model.UserStatus) error {
	collection := config.MongoDB.Collection(getUserCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	filter := bson.M{"_id": objID}
	update := bson.M{"$set": bson.M{"status": status}}

	_, err = collection.UpdateOne(ctx, filter, update)
	return err
}

func UpdateUserProfile(email string, updates bson.M) error {
	collection := config.MongoDB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"email": email}
	update := bson.M{"$set": updates}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

func FindUserByID(userID string) (model.User, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return model.User{}, err
	}

	collection := config.MongoDB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user model.User
	filter := bson.M{"_id": objectID}
	err = collection.FindOne(ctx, filter).Decode(&user)
	return user, err
}

func UpdateUserBalance(userID string, amount float64) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	collection := config.MongoDB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": objectID}
	update := bson.M{"$inc": bson.M{"balance": amount}}

	_, err = collection.UpdateOne(ctx, filter, update)
	return err
}

func SetUserBalance(userID string, balance float64) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	collection := config.MongoDB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": objectID}
	update := bson.M{"$set": bson.M{"balance": balance}}

	_, err = collection.UpdateOne(ctx, filter, update)
	return err
}
