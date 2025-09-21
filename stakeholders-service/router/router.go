package router

import (
	"stakeholders-service/handler"
	"stakeholders-service/middleware"

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

	r.POST("/register", handler.Register)
	r.POST("/login", handler.Login)
	r.POST("/validate-token", handler.ValidateToken)

	auth := r.Group("/")
	auth.Use(middleware.HeaderAuthMiddleware())
	auth.GET("/me", handler.Me)
	auth.GET("/users", handler.GetAllUsers)
	auth.GET("/users/:id", handler.GetUserById)
	auth.PUT("/users/:id/block", handler.BlockUser)
	auth.PUT("/users/:id/unblock", handler.UnblockUser)
	auth.GET("/profile", handler.GetProfile)
	auth.PUT("/profile", handler.UpdateProfile)
	auth.PUT("/location", handler.UpdateLocation)

	// Balance endpoints
	auth.GET("/balance", handler.GetBalance)
	auth.POST("/users/:id/balance/add", handler.AddBalance)
	auth.PUT("/users/:id/balance", handler.SetBalance)

	return r
}
