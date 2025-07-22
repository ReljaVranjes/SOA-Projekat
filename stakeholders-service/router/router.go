package router

import (
	"stakeholders-service/handler"
	"stakeholders-service/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.POST("/register", handler.Register)
	r.POST("/login", handler.Login)

	auth := r.Group("/")
	auth.Use(middleware.AuthMiddleware())
	auth.GET("/me", handler.Me)
	auth.GET("/profile", handler.GetProfile)
	auth.PUT("/profile", handler.UpdateProfile)

	return r
}
