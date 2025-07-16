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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Loš JSON format"})
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

