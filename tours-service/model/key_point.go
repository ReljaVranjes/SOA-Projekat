package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type KeyPoint struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	TourID      primitive.ObjectID `bson:"tourId" json:"tourId"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Image       string             `bson:"image" json:"image"`
	Longitude   float64            `bson:"longitude" json:"longitude"`
	Latitude    float64            `bson:"latitude" json:"latitude"`
}
