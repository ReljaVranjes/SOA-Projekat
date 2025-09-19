package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HeaderAuthMiddleware replaces JWT middleware - reads user data from headers
func HeaderAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-Id")
		userEmail := c.GetHeader("X-User-Email")
		userRole := c.GetHeader("X-User-Role")

		if userID == "" || userEmail == "" || userRole == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "User authentication headers missing. Request must come through gateway.",
			})
			return
		}

		// Set user data in context for handlers to use
		c.Set("user_id", userID)
		c.Set("email", userEmail)
		c.Set("role", userRole)

		c.Next()
	}
}

// CheckRole middleware for role-based access control
func CheckRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "User role not found",
			})
			return
		}

		role := userRole.(string)
		
		// Check if user role is in allowed roles
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "Access forbidden: insufficient rights",
		})
	}
}