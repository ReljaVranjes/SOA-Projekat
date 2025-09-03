package repo

import (
	"context"
	"time"
	"tours-service/config"
	"tours-service/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func getTourCollection() string {
	return "tours"
}

func CreateTour(tour model.Tour) error {
	collection := config.MongoDB.Collection(getTourCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, tour)
	return err
}

func GetToursByGuideID(guideID primitive.ObjectID) ([]model.Tour, error) {
	collection := config.MongoDB.Collection(getTourCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"guideId": guideID}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tours []model.Tour
	if err = cursor.All(ctx, &tours); err != nil {
		return nil, err
	}

	return tours, nil
}

func GetTourByID(tourID primitive.ObjectID) (model.Tour, error) {
	collection := config.MongoDB.Collection(getTourCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var tour model.Tour
	filter := bson.M{"_id": tourID}
	err := collection.FindOne(ctx, filter).Decode(&tour)
	return tour, err
}

func UpdateTourStatus(tourID primitive.ObjectID, status model.TourStatus) error {
	collection := config.MongoDB.Collection(getTourCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": tourID}
	update := bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": primitive.NewDateTimeFromTime(time.Now()),
		},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

func GetAllTours() ([]model.Tour, error) {
	collection := config.MongoDB.Collection(getTourCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tours []model.Tour
	if err = cursor.All(ctx, &tours); err != nil {
		return nil, err
	}

	return tours, nil
}
