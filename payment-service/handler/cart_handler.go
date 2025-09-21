package handler

import (
	"net/http"
	"payment-service/middleware"
	"payment-service/service"

	"github.com/gin-gonic/gin"
)

// AddToCart adds a tour to user's shopping cart
func AddToCart(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	var request struct {
		TourID   string  `json:"tourId" binding:"required"`
		TourName string  `json:"tourName" binding:"required"`
		Price    float64 `json:"price" binding:"required,min=0"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan format zahteva"})
		return
	}

	cart, err := service.AddTourToCart(userID, request.TourID, request.TourName, request.Price)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tura je dodata u korpu",
		"cart":    cart,
	})
}

// GetCart retrieves user's shopping cart
func GetCart(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	cart, err := service.GetUserCart(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cart)
}

// RemoveFromCart removes a tour from user's shopping cart
func RemoveFromCart(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	tourID := c.Param("tourId")
	if tourID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tour ID je obavezan"})
		return
	}

	cart, err := service.RemoveTourFromCart(userID, tourID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tura je uklonjena iz korpe",
		"cart":    cart,
	})
}

// ClearCart removes all items from user's cart
func ClearCart(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	err := service.ClearUserCart(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Korpa je obrisana",
	})
}

// UpdateCartItem updates quantity or price of item in cart (if needed)
func UpdateCartItem(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	tourID := c.Param("tourId")
	if tourID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tour ID je obavezan"})
		return
	}

	var request struct {
		TourName string  `json:"tourName"`
		Price    float64 `json:"price" binding:"min=0"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan format zahteva"})
		return
	}

	// For now, we'll implement this as remove + add
	// First remove the existing item
	_, err := service.RemoveTourFromCart(userID, tourID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tura nije pronađena u korpi"})
		return
	}

	// Then add the updated item
	cart, err := service.AddTourToCart(userID, tourID, request.TourName, request.Price)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Stavka u korpi je ažurirana",
		"cart":    cart,
	})
}
