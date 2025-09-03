package repo

import (
	"context"
	"time"
	"tours-service/config"
	"tours-service/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getReviewCollection() string {
	return "reviews"
}

func CreateReview(review model.Review) error {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, review)
	return err
}

func GetReviewsByTourID(tourID primitive.ObjectID) ([]model.Review, error) {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	filter := bson.M{"tourId": tourID}

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reviews []model.Review
	if err = cursor.All(ctx, &reviews); err != nil {
		return nil, err
	}

	return reviews, nil
}

func GetReviewsByTouristID(touristID primitive.ObjectID) ([]model.Review, error) {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	filter := bson.M{"touristId": touristID}

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reviews []model.Review
	if err = cursor.All(ctx, &reviews); err != nil {
		return nil, err
	}

	return reviews, nil
}

func GetReviewByID(reviewID primitive.ObjectID) (model.Review, error) {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var review model.Review
	filter := bson.M{"_id": reviewID}
	err := collection.FindOne(ctx, filter).Decode(&review)
	return review, err
}

func UpdateReview(reviewID primitive.ObjectID, updates bson.M) error {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": reviewID}
	update := bson.M{"$set": updates}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

func DeleteReview(reviewID primitive.ObjectID) error {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": reviewID}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

func HasTouristReviewedTour(touristID, tourID primitive.ObjectID) (bool, error) {
	collection := config.MongoDB.Collection(getReviewCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"touristId": touristID,
		"tourId":    tourID,
	}

	count, err := collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
