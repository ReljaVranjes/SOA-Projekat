package model

import (
	"encoding/json"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Tour struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id,omitempty"`
	Name        string               `bson:"name" json:"name"`
	Description string               `bson:"description" json:"description"`
	Level       string               `bson:"level" json:"level"`
	Tags        []string             `bson:"tags" json:"tags"`
	Status      TourStatus           `bson:"status" json:"status"`
	Price       float64              `bson:"price" json:"price"`
	Duration    int                  `bson:"duration" json:"duration"`
	MaxPeople   int                  `bson:"maxPeople" json:"maxPeople"`
	KeyPoints   []primitive.ObjectID `bson:"keyPoints" json:"keyPoints"`
	GuideID     primitive.ObjectID   `bson:"guideId" json:"guideId"`
	CreatedAt   primitive.DateTime   `bson:"createdAt" json:"createdAt"`
	UpdatedAt   primitive.DateTime   `bson:"updatedAt" json:"updatedAt"`
}

type TourStatus string

const (
	Draft     TourStatus = "Draft"
	Published TourStatus = "Published"
	Archived  TourStatus = "Archived"
)

func NewTour() Tour {
	return Tour{
		Status:    Draft,
		Price:     0.0,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt: primitive.NewDateTimeFromTime(time.Now()),
	}
}

func (s *TourStatus) UnmarshalJSON(data []byte) error {
	var status string
	if err := json.Unmarshal(data, &status); err != nil {
		return err
	}

	switch TourStatus(status) {
	case Draft, Published, Archived:
		*s = TourStatus(status)
		return nil
	default:
		return errors.New("invalid tour status")
	}
}
