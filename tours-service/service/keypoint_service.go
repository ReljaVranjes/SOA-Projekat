package service

import (
	"errors"
	"fmt"
	"mime/multipart"
	"tours-service/model"
	"tours-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateKeyPoint(keyPointData model.KeyPoint, image *multipart.FileHeader) (model.KeyPoint, error) {
	if keyPointData.Name == "" {
		return model.KeyPoint{}, errors.New("ime ključne tačke je obavezno")
	}
	// Note: Coordinates can legitimately be 0, so we don't validate for non-zero values
	// Validation for required coordinates should be done at the handler level
	if keyPointData.TourID.IsZero() {
		return model.KeyPoint{}, errors.New("tour ID je obavezan")
	}

	// Handle image upload if provided
	var imagePath string
	if image != nil {
		fmt.Printf("DEBUG: Uploading image: %s, size: %d bytes\n", image.Filename, image.Size)
		uploadedPath, err := UploadImageToDir(image, "keypoints")
		if err != nil {
			fmt.Printf("DEBUG: Image upload failed: %v\n", err)
			return model.KeyPoint{}, errors.New("greška prilikom upload-a slike: " + err.Error())
		}
		fmt.Printf("DEBUG: Image uploaded successfully to: %s\n", uploadedPath)
		imagePath = uploadedPath
	} else {
		fmt.Printf("DEBUG: No image provided\n")
	}

	keyPoint := model.KeyPoint{
		TourID:      keyPointData.TourID,
		Name:        keyPointData.Name,
		Description: keyPointData.Description,
		Image:       imagePath,
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

func UpdateKeyPoint(keyPointID string, updateData model.KeyPoint, image *multipart.FileHeader) (model.KeyPoint, error) {
	objectID, err := primitive.ObjectIDFromHex(keyPointID)
	if err != nil {
		return model.KeyPoint{}, errors.New("neispravan ID ključne tačke")
	}

	updates := make(map[string]interface{})
	if updateData.Name != "" {
		updates["name"] = updateData.Name
	}
	updates["description"] = updateData.Description
	
	// Handle image upload if provided
	if image != nil {
		imagePath, err := UploadImageToDir(image, "keypoints")
		if err != nil {
			return model.KeyPoint{}, errors.New("greška prilikom upload-a slike: " + err.Error())
		}
		updates["image"] = imagePath
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
