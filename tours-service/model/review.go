package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Review struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	TourID    primitive.ObjectID `bson:"tourId" json:"tourId"`
	TouristID primitive.ObjectID `bson:"touristId" json:"touristId"`
	Rate      int                `bson:"rate" json:"rate"` // 1-5
	Comment   string             `bson:"comment" json:"comment"`
	TourDate  primitive.DateTime `bson:"tourDate" json:"tourDate"`
	CreatedAt primitive.DateTime `bson:"createdAt" json:"createdAt"`
	Images    []string           `bson:"images" json:"images"`
}
