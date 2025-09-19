package router

import (
	"payment-service/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-User-Id", "X-User-Email", "X-User-Role"},
		AllowCredentials: true,
	}))

	// Protected routes (authentication required)
	auth := r.Group("/")
	auth.Use(middleware.HeaderAuthMiddleware())
	{
		// Cart endpoints (will be implemented later)
		// auth.POST("/cart/items", handler.AddToCart)
		// auth.GET("/cart", handler.GetCart)
		// auth.DELETE("/cart/items/:tourId", handler.RemoveFromCart)
		// auth.DELETE("/cart", handler.ClearCart)

		// Checkout and orders (will be implemented later)
		// auth.POST("/checkout", handler.Checkout)
		// auth.GET("/orders", handler.GetUserOrders)
		// auth.GET("/orders/:orderId", handler.GetOrderByID)
	}

	return r
}
