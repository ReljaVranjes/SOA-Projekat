package router

import (
	"tours-service/handler"
	"tours-service/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Serve static files (uploaded images)
	r.Static("/uploads", "./uploads")

	// Public routes (no authentication required)
	r.GET("/tours", handler.GetAllTours)                           // Get all published tours
	r.GET("/tours/:tourId/keypoints", handler.GetKeyPointsByTour)  // Get keypoints for tour

	// Protected routes (authentication required)
	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())

	// Guide-only routes (only guides can create/manage tours)
	guideOnly := auth.Group("/")
	guideOnly.Use(middleware.RequireRole("Guide"))
	{
		guideOnly.POST("/tours", handler.CreateTour)                        // Create tour
		guideOnly.GET("/tours/guide/:guideId", handler.GetToursByGuide)     // Get tours by guide
		guideOnly.PUT("/tours/:tourId/publish", handler.PublishTour)        // Publish tour
		guideOnly.PUT("/tours/:tourId/archive", handler.ArchiveTour)        // Archive tour
		guideOnly.POST("/tours/:tourId/keypoints", handler.CreateKeyPoint)  // Create keypoint
		guideOnly.PUT("/tours/:tourId/keypoints/:keyPointId", handler.UpdateKeyPoint) // Update keypoint
		guideOnly.DELETE("/tours/:tourId/keypoints/:keyPointId", handler.DeleteKeyPoint) // Delete keypoint
	}

	return r
}
