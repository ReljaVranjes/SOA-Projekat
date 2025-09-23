package handler

import (
	"net/http"
	"payment-service/middleware"
	"payment-service/service"

	"github.com/gin-gonic/gin"
)

func Checkout(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	order, err := service.CheckoutOrchestrator(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Checkout neuspešan",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Checkout uspešno završen",
		"order":   order,
	})
}
