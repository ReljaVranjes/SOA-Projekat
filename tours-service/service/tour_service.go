package service

import (
	"errors"
	"time"
	"tours-service/model"
	"tours-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateTour(tourData model.Tour, guideID string) (model.Tour, error) {
	guideObjectID, err := primitive.ObjectIDFromHex(guideID)
	if err != nil {
		return model.Tour{}, errors.New("neispravan guide ID")
	}

	tour := model.Tour{
		Name:        tourData.Name,
		Description: tourData.Description,
		Level:       tourData.Level,
		Tags:        tourData.Tags,
		Status:      model.Draft,
		Price:       tourData.Price,
		Duration:    tourData.Duration,
		MaxPeople:   tourData.MaxPeople,
		KeyPoints:   tourData.KeyPoints,
		GuideID:     guideObjectID,
		CreatedAt:   primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:   primitive.NewDateTimeFromTime(time.Now()),
	}

	err = repo.CreateTour(tour)
	if err != nil {
		return model.Tour{}, errors.New("greška prilikom kreiranja ture")
	}

	return tour, nil
}

func GetToursByGuide(guideID string) ([]model.Tour, error) {
	guideObjectID, err := primitive.ObjectIDFromHex(guideID)
	if err != nil {
		return nil, errors.New("neispravan guide ID")
	}

	tours, err := repo.GetToursByGuideID(guideObjectID)
	if err != nil {
		return nil, errors.New("greška prilikom dobavljanja tura")
	}

	return tours, nil
}

func GetTourByID(id string) (model.Tour, error) {
	if id == "" {
		return model.Tour{}, errors.New("neispravan tour ID")
	}

	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return model.Tour{}, errors.New("neispravan tour ID")
	}

	tour, err := repo.GetTourByID(oid)
	if err != nil {
		return model.Tour{}, errors.New("greška prilikom dobavljanja ture")
	}

	return tour, nil
}

func PublishTour(tourID string, guideID string) error {
	tour, err := getTourByIDAndVerifyOwnership(tourID, guideID)
	if err != nil {
		return err
	}

	if tour.Status != model.Draft {
		return errors.New("može se objaviti samo tura sa statusom Draft")
	}

	tourObjectID, _ := primitive.ObjectIDFromHex(tourID)
	return repo.UpdateTourStatus(tourObjectID, model.Published)
}

func ArchiveTour(tourID string, guideID string) error {
	tour, err := getTourByIDAndVerifyOwnership(tourID, guideID)
	if err != nil {
		return err
	}

	if tour.Status != model.Published {
		return errors.New("može se arhivirati samo objavljena tura")
	}

	tourObjectID, _ := primitive.ObjectIDFromHex(tourID)
	return repo.UpdateTourStatus(tourObjectID, model.Archived)
}

func GetAllTours() ([]model.Tour, error) {
	tours, err := repo.GetAllTours()
	if err != nil {
		return nil, errors.New("greška prilikom dohvatanja svih tura")
	}
	return tours, nil
}

func getTourByIDAndVerifyOwnership(tourID string, guideID string) (model.Tour, error) {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return model.Tour{}, errors.New("neispravan tour ID")
	}

	guideObjectID, err := primitive.ObjectIDFromHex(guideID)
	if err != nil {
		return model.Tour{}, errors.New("neispravan guide ID")
	}

	tour, err := repo.GetTourByID(tourObjectID)
	if err != nil {
		return model.Tour{}, errors.New("tura nije pronađena")
	}

	if tour.GuideID != guideObjectID {
		return model.Tour{}, errors.New("nemate dozvolu za ovu turu")
	}

	return tour, nil
}
