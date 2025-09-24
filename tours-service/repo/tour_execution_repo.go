package repo

import (
    "context"
    "time"
    "tours-service/config"
    "tours-service/model"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

func getTourExecutionCollection() string {
    return "tour_executions"
}

// Add a new TourExecution
func AddTourExecution(execution *model.TourExecution) error {
    col := config.MongoDB.Collection(getTourExecutionCollection())
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    res, err := col.InsertOne(ctx, execution)
    if err != nil {
        return err
    }
    if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
        execution.ID = oid
    }
    return nil
}

// Get TourExecution by ID
func GetTourExecutionByID(executionID primitive.ObjectID) (model.TourExecution, error) {
    collection := config.MongoDB.Collection(getTourExecutionCollection())
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var execution model.TourExecution
    filter := bson.M{"_id": executionID}
    err := collection.FindOne(ctx, filter).Decode(&execution)
    return execution, err
}

// Update TourExecution status (completed/abandoned) and set endedAt
func UpdateTourExecutionStatus(executionID primitive.ObjectID, status model.TourExecutionStatus, endedAt primitive.DateTime) error {
    collection := config.MongoDB.Collection(getTourExecutionCollection())
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    filter := bson.M{"_id": executionID}
    update := bson.M{
        "$set": bson.M{
            "status":   status,
            "endedAt":  endedAt,
            "lastActivityAt": primitive.NewDateTimeFromTime(time.Now()),
        },
    }
    _, err := collection.UpdateOne(ctx, filter, update)
    return err
}

// Add completed key point to TourExecution
func AddKeyPointToExecution(executionID primitive.ObjectID, keyPointID primitive.ObjectID, completedAt primitive.DateTime) error {
    collection := config.MongoDB.Collection(getTourExecutionCollection())
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    update := bson.M{
        "$push": bson.M{
            "keyPoints": bson.M{
                "keyPointId":  keyPointID,
                "completedAt": completedAt,
            },
        },
        "$set": bson.M{
            "lastActivityAt": primitive.NewDateTimeFromTime(time.Now()),
        },
    }
    filter := bson.M{"_id": executionID}
    _, err := collection.UpdateOne(ctx, filter, update)
    return err
}

// Update last activity time for TourExecution
func UpdateTourExecutionLastActivity(executionID primitive.ObjectID) error {
    collection := config.MongoDB.Collection(getTourExecutionCollection())
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    update := bson.M{
        "$set": bson.M{
            "lastActivityAt": primitive.NewDateTimeFromTime(time.Now()),
        },
    }
    filter := bson.M{"_id": executionID}
    _, err := collection.UpdateOne(ctx, filter, update)
    return err
}