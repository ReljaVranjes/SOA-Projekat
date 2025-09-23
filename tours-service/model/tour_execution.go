package model

import (
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type TourExecutionStatus string

const (
    Active     TourExecutionStatus = "active"
    Completed  TourExecutionStatus = "completed"
    Abandoned  TourExecutionStatus = "abandoned"
)

type KeyPointExecution struct {
    KeyPointID primitive.ObjectID `bson:"keyPointId"`
    CompletedAt primitive.DateTime `bson:"completedAt"`
}

type TourExecution struct {
    ID             primitive.ObjectID  `bson:"_id,omitempty" json:"id,omitempty"`
    TourID         primitive.ObjectID  `bson:"tourId" json:"tourId"`
    TouristID      primitive.ObjectID  `bson:"touristId" json:"touristId"`
    Status         TourExecutionStatus `bson:"status" json:"status"`
    StartedAt      primitive.DateTime  `bson:"startedAt" json:"startedAt"`
    EndedAt        *primitive.DateTime `bson:"endedAt,omitempty" json:"endedAt,omitempty"`
    LastActivityAt primitive.DateTime  `bson:"lastActivityAt" json:"lastActivityAt"`
    KeyPoints      []KeyPointExecution `bson:"keyPoints" json:"keyPoints"`
}