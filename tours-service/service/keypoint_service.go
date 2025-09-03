package service

import (
	"errors"
	"tours-service/model"
	"tours-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateKeyPoint(keyPointData model.KeyPoint) (model.KeyPoint, error) {
	if keyPointData.Name == "" {
		return model.KeyPoint{}, errors.New("ime ključne tačke je obavezno")
	}
	if keyPointData.Longitude == 0 || keyPointData.Latitude == 0 {
		return model.KeyPoint{}, errors.New("koordinate su obavezne")
	}
	if keyPointData.TourID.IsZero() {
		return model.KeyPoint{}, errors.New("tour ID je obavezan")
	}

	keyPoint := model.KeyPoint{
		TourID:      keyPointData.TourID,
		Name:        keyPointData.Name,
		Description: keyPointData.Description,
		Image:       keyPointData.Image,
		Longitude:   keyPointData.Longitude,
		Latitude:    keyPointData.Latitude,
	}

	err := repo.CreateKeyPoint(keyPoint)
	if err != nil {
		return model.KeyPoint{}, errors.New("greška prilikom kreiranja ključne tačke")
	}

	return keyPoint, nil
}

func GetAllKeyPoints() ([]model.KeyPoint, error) {
	keyPoints, err := repo.GetAllKeyPoints()
	if err != nil {
		return nil, errors.New("greška prilikom dobavljanja ključnih tačaka")
	}
	return keyPoints, nil
}

func GetKeyPointByID(keyPointID string) (model.KeyPoint, error) {
	objectID, err := primitive.ObjectIDFromHex(keyPointID)
	if err != nil {
		return model.KeyPoint{}, errors.New("neispravan ID ključne tačke")
	}

	keyPoint, err := repo.GetKeyPointByID(objectID)
	if err != nil {
		return model.KeyPoint{}, errors.New("ključna tačka nije pronađena")
	}

	return keyPoint, nil
}

func UpdateKeyPoint(keyPointID string, updateData model.KeyPoint) (model.KeyPoint, error) {
	objectID, err := primitive.ObjectIDFromHex(keyPointID)
	if err != nil {
		return model.KeyPoint{}, errors.New("neispravan ID ključne tačke")
	}

	updates := make(map[string]interface{})
	if updateData.Name != "" {
		updates["name"] = updateData.Name
	}
	updates["description"] = updateData.Description
	if updateData.Image != "" {
		updates["image"] = updateData.Image
	}
	if updateData.Longitude != 0 {
		updates["longitude"] = updateData.Longitude
	}
	if updateData.Latitude != 0 {
		updates["latitude"] = updateData.Latitude
	}

	err = repo.UpdateKeyPoint(objectID, updates)
	if err != nil {
		return model.KeyPoint{}, errors.New("greška prilikom ažuriranja ključne tačke")
	}

	return repo.GetKeyPointByID(objectID)
}

func DeleteKeyPoint(keyPointID string) error {
	objectID, err := primitive.ObjectIDFromHex(keyPointID)
	if err != nil {
		return errors.New("neispravan ID ključne tačke")
	}

	err = repo.DeleteKeyPoint(objectID)
	if err != nil {
		return errors.New("greška prilikom brisanja ključne tačke")
	}

	return nil
}

func GetKeyPointsByTour(tourID string) ([]model.KeyPoint, error) {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return nil, errors.New("neispravan tour ID")
	}

	keyPoints, err := repo.GetKeyPointsByTourID(tourObjectID)
	if err != nil {
		return nil, errors.New("greška prilikom dobavljanja ključnih tačaka za turu")
	}

	return keyPoints, nil
}
