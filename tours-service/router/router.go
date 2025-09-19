package router

import (
	"tours-service/handler"
	"tours-service/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Serve static files (uploaded images)
	r.Static("/uploads", "./uploads")

	// Public routes (no authentication required)
	r.GET("/tours", handler.GetAllTours)                          // Get all published tours
	r.GET("/tours/:tourId/keypoints", handler.GetKeyPointsByTour) // Get keypoints for tour
	r.GET("/tours/:tourId/reviews", handler.GetReviewsByTour)     // Get reviews for tour

	// Protected routes (authentication required)
	auth := r.Group("/")
	auth.Use(middleware.HeaderAuthMiddleware())
	auth.GET("/tour/:tourId", handler.GetTourByID)
	
	// Token endpoints
	auth.POST("/tokens/generate", handler.GenerateTokens)         // SAGA: Generate purchase tokens
	auth.DELETE("/tokens/delete", handler.DeleteTokens)          // SAGA: Rollback tokens
	auth.GET("/tours/purchased", handler.GetPurchasedTours)      // Get user's purchased tours

	// Tourist routes (authenticated users can review)
	touristRoutes := auth.Group("/")
	touristRoutes.Use(middleware.CheckRole("Tourist"))
	{
		touristRoutes.POST("/tours/:tourId/reviews", handler.CreateReview) // Create review
		touristRoutes.GET("/reviews/my", handler.GetReviewsByTourist)      // Get my reviews
		touristRoutes.PUT("/reviews/:reviewId", handler.UpdateReview)      // Update my review
		touristRoutes.DELETE("/reviews/:reviewId", handler.DeleteReview)   // Delete my review
	}

	// Guide-only routes (only guides can create/manage tours)
	guideOnly := auth.Group("/")
	guideOnly.Use(middleware.CheckRole("Guide"))
	{
		guideOnly.POST("/tours", handler.CreateTour)
		guideOnly.GET("/tours/guide/:guideId", handler.GetToursByGuide)                  // Get tours by guide
		guideOnly.PUT("/tours/:tourId/publish", handler.PublishTour)                     // Publish tour
		guideOnly.PUT("/tours/:tourId/archive", handler.ArchiveTour)                     // Archive tour
		guideOnly.POST("/tours/:tourId/keypoints", handler.CreateKeyPoint)               // Create keypoint
		guideOnly.PUT("/tours/:tourId/keypoints/:keyPointId", handler.UpdateKeyPoint)    // Update keypoint
		guideOnly.DELETE("/tours/:tourId/keypoints/:keyPointId", handler.DeleteKeyPoint) // Delete keypoint
	}

	return r
}
