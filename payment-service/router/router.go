package router

import (
	"payment-service/handler"
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
		// Cart endpoints
		auth.POST("/cart/items", handler.AddToCart)                      // Add tour to cart
		auth.GET("/cart", handler.GetCart)                               // Get user's cart
		auth.DELETE("/cart/items/:tourId", handler.RemoveFromCart)       // Remove tour from cart
		auth.PUT("/cart/items/:tourId", handler.UpdateCartItem)          // Update cart item
		auth.DELETE("/cart", handler.ClearCart)                          // Clear entire cart
		
		// Checkout and orders
		auth.POST("/checkout", handler.Checkout)                         // Process checkout (SAGA)
		auth.GET("/orders", handler.GetUserOrders)                       // Get user's orders
		auth.GET("/orders/:orderId", handler.GetOrderByID)               // Get specific order
	}

	return r
}
