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
	res, err := service.LoginUser(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
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

func GetUserById(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID korisnika je obavezan"})
		return
	}

	user, err := service.GetUserById(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
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

func GetProfile(c *gin.Context) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email nije pronađen u tokenu"})
		return
	}

	emailStr, ok := email.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Neispravan format emaila"})
		return
	}

	user, err := service.GetUserProfile(emailStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func UpdateProfile(c *gin.Context) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email nije pronađen u tokenu"})
		return
	}

	emailStr, ok := email.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Neispravan format emaila"})
		return
	}

	var profileData model.User
	if err := c.ShouldBindJSON(&profileData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan JSON format"})
		return
	}

	updatedUser, err := service.UpdateUserProfile(emailStr, profileData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedUser)
}

func UpdateLocation(c *gin.Context) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email nije pronađen u tokenu"})
		return
	}

	emailStr, ok := email.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Neispravan format emaila"})
		return
	}

	var location model.Location
	if err := c.ShouldBindJSON(&location); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan JSON format za lokaciju"})
		return
	}

	// Validate location coordinates
	if location.Lat < -90 || location.Lat > 90 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravna širina (lat) - mora biti između -90 i 90"})
		return
	}
	if location.Lng < -180 || location.Lng > 180 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravna dužina (lng) - mora biti između -180 i 180"})
		return
	}

	updatedUser, err := service.UpdateUserLocation(emailStr, location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lokacija je uspešno ažurirana",
		"user":    updatedUser,
	})
}

