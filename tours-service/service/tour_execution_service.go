package service

import (
    "errors"
    "time"
    "tours-service/model"
    "tours-service/repo"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Create a new TourExecution
// service
func CreateTourExecution(tourID, touristID string, lat, lng float64) (model.TourExecution, error) {
    tourOID, err := primitive.ObjectIDFromHex(tourID)
    if err != nil { return model.TourExecution{}, errors.New("neispravan tour ID") }
    touristOID, err := primitive.ObjectIDFromHex(touristID)
    if err != nil { return model.TourExecution{}, errors.New("neispravan tourist ID") }

    now := time.Now().UTC()
    exec := model.TourExecution{
        TourID:         tourOID,
        TouristID:      touristOID,
        Status:         model.Active,
        StartedAt:      primitive.NewDateTimeFromTime(now),
        LastActivityAt: primitive.NewDateTimeFromTime(now),
        KeyPoints:      []model.KeyPointExecution{},
    }

    if err := repo.AddTourExecution(&exec); err != nil {
        return model.TourExecution{}, err
    }
    return exec, nil // exec.ID is now set
}

// Get TourExecution by ID
func GetTourExecutionByID(executionID primitive.ObjectID) (model.TourExecution, error) {
    return repo.GetTourExecutionByID(executionID)
}

// Change status of a TourExecution (completed or abandoned)
func UpdateTourExecutionStatus(executionID string, status model.TourExecutionStatus) error {
    execObjectID, err := primitive.ObjectIDFromHex(executionID)
    if err != nil {
        return errors.New("neispravan execution ID")
    }
    now := primitive.NewDateTimeFromTime(time.Now())
    return repo.UpdateTourExecutionStatus(execObjectID, status, now)
}

// Add completed key point to TourExecution
func AddCompletedKeyPoint(executionID string, keyPointID string) error {
    execObjectID, err := primitive.ObjectIDFromHex(executionID)
    if err != nil {
        return errors.New("neispravan execution ID")
    }
    kpObjectID, err := primitive.ObjectIDFromHex(keyPointID)
    if err != nil {
        return errors.New("neispravan key point ID")
    }
    now := primitive.NewDateTimeFromTime(time.Now())
    return repo.AddKeyPointToExecution(execObjectID, kpObjectID, now)
}