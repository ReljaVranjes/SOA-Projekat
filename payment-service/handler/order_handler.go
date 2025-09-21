package handler

import (
	"net/http"
	"payment-service/middleware"
	"payment-service/repo"

	"github.com/gin-gonic/gin"
)

// GetUserOrders returns all orders for the authenticated user
func GetUserOrders(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	orders, err := repo.GetOrdersByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Greška pri dobavljanju narudžbi"})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetOrderByID returns a specific order if it belongs to the user
func GetOrderByID(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	orderID := c.Param("orderId")
	if orderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order ID je obavezan"})
		return
	}

	order, err := repo.GetOrderByID(orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Narudžba nije pronađena"})
		return
	}

	// Check if order belongs to the user
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Nemate pristup ovoj narudžbi"})
		return
	}

	c.JSON(http.StatusOK, order)
}