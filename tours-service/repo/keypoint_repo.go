package repo

import (
	"context"
	"time"
	"tours-service/config"
	"tours-service/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func getKeyPointCollection() string {
	return "keypoints"
}

func CreateKeyPoint(keyPoint model.KeyPoint) error {
	collection := config.MongoDB.Collection(getKeyPointCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, keyPoint)
	return err
}

func GetAllKeyPoints() ([]model.KeyPoint, error) {
	collection := config.MongoDB.Collection(getKeyPointCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var keyPoints []model.KeyPoint
	if err = cursor.All(ctx, &keyPoints); err != nil {
		return nil, err
	}

	return keyPoints, nil
}

func GetKeyPointByID(keyPointID primitive.ObjectID) (model.KeyPoint, error) {
	collection := config.MongoDB.Collection(getKeyPointCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var keyPoint model.KeyPoint
	filter := bson.M{"_id": keyPointID}
	err := collection.FindOne(ctx, filter).Decode(&keyPoint)
	return keyPoint, err
}

func UpdateKeyPoint(keyPointID primitive.ObjectID, updates bson.M) error {
	collection := config.MongoDB.Collection(getKeyPointCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": keyPointID}
	update := bson.M{"$set": updates}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

func GetKeyPointsByTourID(tourID primitive.ObjectID) ([]model.KeyPoint, error) {
	collection := config.MongoDB.Collection(getKeyPointCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"tourId": tourID}
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var keyPoints []model.KeyPoint
	if err = cursor.All(ctx, &keyPoints); err != nil {
		return nil, err
	}

	return keyPoints, nil
}

func DeleteKeyPoint(keyPointID primitive.ObjectID) error {
	collection := config.MongoDB.Collection(getKeyPointCollection())
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": keyPointID}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}