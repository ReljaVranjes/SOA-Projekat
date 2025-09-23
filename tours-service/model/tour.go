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
	Distance    float64              `bson:"distance" json:"distance"`       // Total distance in kilometers
	TravelTimeOnFoot float64          `bson:"travelTimeOnFoot" json:"travelTimeOnFoot"` // Travel time by foot in hours
	TravelTimeBike   float64          `bson:"travelTimeBike" json:"travelTimeBike"`     // Travel time by bike in hours
	TravelTimeCar    float64          `bson:"travelTimeCar" json:"travelTimeCar"`       // Travel time by car in hours
	GuideID     primitive.ObjectID   `bson:"guideId" json:"guideId"`
	CreatedAt   primitive.DateTime   `bson:"createdAt" json:"createdAt"`
	UpdatedAt   primitive.DateTime   `bson:"updatedAt" json:"updatedAt"`
	PublishedAt *primitive.DateTime  `bson:"publishedAt,omitempty" json:"publishedAt,omitempty"`
	ArchivedAt  *primitive.DateTime  `bson:"archivedAt,omitempty" json:"archivedAt,omitempty"`
}

type TourStatus string

const (
	Draft     TourStatus = "Draft"
	Published TourStatus = "Published"
	Archived  TourStatus = "Archived"
)

type MethodOfTravel string

const (
	OnFoot    MethodOfTravel = "OnFoot"
	Bicycle   MethodOfTravel = "Bicycle"
	Car       MethodOfTravel = "Car"
)

// Travel speeds in km/h
const (
	SpeedOnFoot  = 5.0  // 5 km/h walking speed
	SpeedBicycle = 25.0 // 25 km/h cycling speed
	SpeedCar     = 80.0 // 80 km/h driving speed
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
