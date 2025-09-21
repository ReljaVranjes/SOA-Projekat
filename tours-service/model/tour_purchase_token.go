package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TourPurchaseToken represents proof that a user has purchased a specific tour
type TourPurchaseToken struct {
	UserID    string             `bson:"userId" json:"userId"`
	TourID    primitive.ObjectID `bson:"tourId" json:"tourId"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

// NewTourPurchaseToken creates a new purchase token
func NewTourPurchaseToken(userID string, tourID primitive.ObjectID) TourPurchaseToken {
	return TourPurchaseToken{
		UserID:    userID,
		TourID:    tourID,
		CreatedAt: time.Now(),
	}
}

// TokenRequest represents the request to generate tokens for multiple tours
type TokenRequest struct {
	UserID  string   `json:"userId" binding:"required"`
	TourIDs []string `json:"tourIds" binding:"required,min=1"`
}

// TokenResponse represents the response after generating tokens
type TokenResponse struct {
	Message      string                  `json:"message"`
	GeneratedFor []primitive.ObjectID    `json:"generatedFor"`
	Tokens       []TourPurchaseToken     `json:"tokens"`
}