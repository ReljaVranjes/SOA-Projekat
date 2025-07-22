package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"stakeholders-service/model"
	"stakeholders-service/service"
)

func Register(c *gin.Context) {
	var input model.User

	// Pokušaj da parsiraš JSON body u User struct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pozovi servisni sloj da obradi registraciju
	token, err := service.RegisterUser(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token})
}

func Login(c *gin.Context) {
	var input model.User

	// Parsiranje emaila i lozinke iz zahteva
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan JSON"})
		return
	}

	// Servis obrada
	token, err := service.LoginUser(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}


func Me(c *gin.Context) {
	email, _ := c.Get("email")
	role, _ := c.Get("role")

	c.JSON(http.StatusOK, gin.H{
		"email": email,
		"role":  role,
	})
}

func GetAllUsers(c *gin.Context) {
	roleStr, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Neautorizovan pristup"})
		return
	}

	role := model.UserRole(roleStr.(string))
	users, err := service.GetAllUsersForAdmin(role)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func BlockUser(c *gin.Context) {
	roleStr, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Neautorizovan pristup"})
		return
	}

	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID korisnika je obavezan"})
		return
	}

	role := model.UserRole(roleStr.(string))
	err := service.BlockUser(role, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Korisnik je uspešno blokiran"})
}

