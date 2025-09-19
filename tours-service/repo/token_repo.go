package repo

import (
	"context"
	"time"
	"tours-service/config"
	"tours-service/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const TokenCollection = "tour_purchase_tokens"

// CreateToken creates a purchase token for user-tour pair
func CreateToken(token model.TourPurchaseToken) error {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, token)
	return err
}

// CreateMultipleTokens creates tokens for multiple tours atomically
func CreateMultipleTokens(tokens []model.TourPurchaseToken) error {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Convert to []interface{} for InsertMany
	docs := make([]interface{}, len(tokens))
	for i, token := range tokens {
		docs[i] = token
	}

	_, err := collection.InsertMany(ctx, docs)
	return err
}

// HasUserPurchasedTour checks if user has purchased a specific tour
func HasUserPurchasedTour(userID string, tourID primitive.ObjectID) (bool, error) {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"userId": userID,
		"tourId": tourID,
	}

	count, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// GetUserPurchasedTours returns all tours purchased by user
func GetUserPurchasedTours(userID string) ([]model.TourPurchaseToken, error) {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tokens []model.TourPurchaseToken
	err = cursor.All(ctx, &tokens)
	return tokens, err
}

// DeleteToken removes a purchase token (for rollback)
func DeleteToken(userID string, tourID primitive.ObjectID) error {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"userId": userID,
		"tourId": tourID,
	}

	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// DeleteMultipleTokens removes multiple tokens (for rollback)
func DeleteMultipleTokens(userID string, tourIDs []primitive.ObjectID) error {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"userId": userID,
		"tourId": bson.M{"$in": tourIDs},
	}

	_, err := collection.DeleteMany(ctx, filter)
	return err
}

// EnsureTokenIndexes creates compound unique index on (userId, tourId)
func EnsureTokenIndexes() error {
	collection := config.MongoDB.Collection(TokenCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	indexModel := mongo.IndexModel{
		Keys: bson.D{
			{Key: "userId", Value: 1},
			{Key: "tourId", Value: 1},
		},
		Options: &options.IndexOptions{
			Unique: func() *bool { b := true; return &b }(), // Prevent duplicate purchases
		},
	}

	_, err := collection.Indexes().CreateOne(ctx, indexModel)
	return err
}
