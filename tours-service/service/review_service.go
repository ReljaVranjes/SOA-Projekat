package service

import (
	"errors"
	"mime/multipart"
	"strconv"
	"time"
	"tours-service/model"
	"tours-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateReview(reviewData model.Review, touristID string, images []*multipart.FileHeader) (model.Review, error) {
	touristObjectID, err := primitive.ObjectIDFromHex(touristID)
	if err != nil {
		return model.Review{}, errors.New("neispravan tourist ID")
	}

	if reviewData.Rate < 1 || reviewData.Rate > 5 {
		return model.Review{}, errors.New("ocena mora biti između 1 i 5")
	}
	if reviewData.Comment == "" {
		return model.Review{}, errors.New("komentar je obavezan")
	}
	if reviewData.TourID.IsZero() {
		return model.Review{}, errors.New("tour ID je obavezan")
	}
	if reviewData.TourDate.Time().IsZero() {
		return model.Review{}, errors.New("datum ture je obavezan")
	}

	hasReviewed, err := repo.HasTouristReviewedTour(touristObjectID, reviewData.TourID)
	if err != nil {
		return model.Review{}, errors.New("greška pri proveri postojeće recenzije")
	}
	if hasReviewed {
		return model.Review{}, errors.New("već ste recenzirali ovu turu")
	}

	var imagePaths []string
	for _, image := range images {
		imagePath, err := UploadImageToDir(image, "reviews")
		if err != nil {
			return model.Review{}, errors.New("greška prilikom upload-a slike: " + err.Error())
		}
		imagePaths = append(imagePaths, imagePath)
	}

	review := model.Review{
		TourID:    reviewData.TourID,
		TouristID: touristObjectID,
		Rate:      reviewData.Rate,
		Comment:   reviewData.Comment,
		TourDate:  reviewData.TourDate,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		Images:    imagePaths,
	}

	err = repo.CreateReview(review)
	if err != nil {
		return model.Review{}, errors.New("greška prilikom kreiranja recenzije")
	}

	return review, nil
}

func GetReviewsByTour(tourID string) ([]model.Review, error) {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return nil, errors.New("neispravan tour ID")
	}

	reviews, err := repo.GetReviewsByTourID(tourObjectID)
	if err != nil {
		return nil, errors.New("greška prilikom dobavljanja recenzija")
	}

	return reviews, nil
}

func GetReviewsByTourist(touristID string) ([]model.Review, error) {
	touristObjectID, err := primitive.ObjectIDFromHex(touristID)
	if err != nil {
		return nil, errors.New("neispravan tourist ID")
	}

	reviews, err := repo.GetReviewsByTouristID(touristObjectID)
	if err != nil {
		return nil, errors.New("greška prilikom dobavljanja recenzija")
	}

	return reviews, nil
}

func UpdateReview(reviewID string, touristID string, updateData model.Review, images []*multipart.FileHeader) (model.Review, error) {
	reviewObjectID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		return model.Review{}, errors.New("neispravan review ID")
	}

	touristObjectID, err := primitive.ObjectIDFromHex(touristID)
	if err != nil {
		return model.Review{}, errors.New("neispravan tourist ID")
	}

	existingReview, err := repo.GetReviewByID(reviewObjectID)
	if err != nil {
		return model.Review{}, errors.New("recenzija nije pronađena")
	}

	if existingReview.TouristID != touristObjectID {
		return model.Review{}, errors.New("nemate dozvolu za ovu recenziju")
	}

	updates := make(map[string]interface{})

	if updateData.Rate >= 1 && updateData.Rate <= 5 {
		updates["rate"] = updateData.Rate
	}
	if updateData.Comment != "" {
		updates["comment"] = updateData.Comment
	}
	if !updateData.TourDate.Time().IsZero() {
		updates["tourDate"] = updateData.TourDate
	}

	if len(images) > 0 {
		var imagePaths []string
		for _, image := range images {
			imagePath, err := UploadImageToDir(image, "reviews")
			if err != nil {
				return model.Review{}, errors.New("greška prilikom upload-a slike: " + err.Error())
			}
			imagePaths = append(imagePaths, imagePath)
		}
		allImages := append(existingReview.Images, imagePaths...)
		updates["images"] = allImages
	}

	err = repo.UpdateReview(reviewObjectID, updates)
	if err != nil {
		return model.Review{}, errors.New("greška prilikom ažuriranja recenzije")
	}

	return repo.GetReviewByID(reviewObjectID)
}

func DeleteReview(reviewID string, touristID string) error {
	reviewObjectID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		return errors.New("neispravan review ID")
	}

	touristObjectID, err := primitive.ObjectIDFromHex(touristID)
	if err != nil {
		return errors.New("neispravan tourist ID")
	}

	existingReview, err := repo.GetReviewByID(reviewObjectID)
	if err != nil {
		return errors.New("recenzija nije pronađena")
	}

	if existingReview.TouristID != touristObjectID {
		return errors.New("nemate dozvolu za ovu recenziju")
	}

	err = repo.DeleteReview(reviewObjectID)
	if err != nil {
		return errors.New("greška prilikom brisanja recenzije")
	}

	return nil
}

func ParseReviewFormData(rate, comment, tourDate string) (model.Review, error) {
	var reviewData model.Review

	rateInt, err := strconv.Atoi(rate)
	if err != nil || rateInt < 1 || rateInt > 5 {
		return reviewData, errors.New("ocena mora biti broj između 1 i 5")
	}
	reviewData.Rate = rateInt

	reviewData.Comment = comment

	tourDateTime, err := time.Parse("2006-01-02", tourDate)
	if err != nil {
		return reviewData, errors.New("neispravan format datuma (koristi YYYY-MM-DD)")
	}
	reviewData.TourDate = primitive.NewDateTimeFromTime(tourDateTime)

	return reviewData, nil
}
