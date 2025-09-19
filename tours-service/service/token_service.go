package service

import (
	"errors"
	"tours-service/model"
	"tours-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GenerateTokensForTours validates tours and generates purchase tokens
func GenerateTokensForTours(userID string, tourIDStrings []string) (model.TokenResponse, error) {
	if userID == "" {
		return model.TokenResponse{}, errors.New("user ID je obavezan")
	}

	if len(tourIDStrings) == 0 {
		return model.TokenResponse{}, errors.New("lista tura je obavezna")
	}

	// Convert tour ID strings to ObjectIDs and validate
	var tourIDs []primitive.ObjectID
	var validatedTours []model.Tour

	for _, tourIDStr := range tourIDStrings {
		// Convert to ObjectID
		tourID, err := primitive.ObjectIDFromHex(tourIDStr)
		if err != nil {
			return model.TokenResponse{}, errors.New("neispravan tour ID: " + tourIDStr)
		}

		// Validate tour exists and is purchasable
		tour, err := GetTourByID(tourIDStr)
		if err != nil {
			return model.TokenResponse{}, errors.New("tura nije pronađena: " + tourIDStr)
		}

		// Check if tour is published
		if tour.Status != model.Published {
			return model.TokenResponse{}, errors.New("tura nije dostupna za kupovinu: " + tour.Name)
		}

		// Check if user already purchased this tour
		hasPurchased, err := repo.HasUserPurchasedTour(userID, tourID)
		if err != nil {
			return model.TokenResponse{}, errors.New("greška pri proveri postojeće kupovine")
		}

		if hasPurchased {
			return model.TokenResponse{}, errors.New("tura je već kupljena: " + tour.Name)
		}

		tourIDs = append(tourIDs, tourID)
		validatedTours = append(validatedTours, tour)
	}

	// Create tokens for all validated tours
	var tokens []model.TourPurchaseToken
	for _, tourID := range tourIDs {
		token := model.NewTourPurchaseToken(userID, tourID)
		tokens = append(tokens, token)
	}

	// Save all tokens atomically
	err := repo.CreateMultipleTokens(tokens)
	if err != nil {
		return model.TokenResponse{}, errors.New("greška pri kreiranju tokena")
	}

	response := model.TokenResponse{
		Message:      "Tokeni su uspešno kreirani",
		GeneratedFor: tourIDs,
		Tokens:       tokens,
	}

	return response, nil
}

// GetUserPurchasedTours returns all tours user has purchased
func GetUserPurchasedTours(userID string) ([]model.Tour, error) {
	// Get all tokens for user
	tokens, err := repo.GetUserPurchasedTours(userID)
	if err != nil {
		return nil, errors.New("greška pri dobavljanju kupljenih tura")
	}

	// Get tour details for each token
	var tours []model.Tour
	for _, token := range tokens {
		tour, err := repo.GetTourByID(token.TourID)
		if err != nil {
			// Skip tours that no longer exist
			continue
		}
		tours = append(tours, tour)
	}

	return tours, nil
}

// DeleteTokensForRollback removes tokens for SAGA rollback
func DeleteTokensForRollback(userID string, tourIDStrings []string) error {
	var tourIDs []primitive.ObjectID

	for _, tourIDStr := range tourIDStrings {
		tourID, err := primitive.ObjectIDFromHex(tourIDStr)
		if err != nil {
			continue // Skip invalid IDs during rollback
		}
		tourIDs = append(tourIDs, tourID)
	}

	return repo.DeleteMultipleTokens(userID, tourIDs)
}