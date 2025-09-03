package handler

import (
	"net/http"
	"strconv"
	"tours-service/middleware"
	"tours-service/model"
	"tours-service/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func handleImageUpload(c *gin.Context, fieldName string) (string, error) {
	file, err := c.FormFile(fieldName)
	if err != nil {
		return "", err
	}

	return service.UploadImage(file)
}

func CreateTour(c *gin.Context) {
	// Get user ID from JWT context
	guideID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	var tourData model.Tour
	if err := c.ShouldBindJSON(&tourData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan JSON format"})
		return
	}

	tour, err := service.CreateTour(tourData, guideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tour)
}

func GetToursByGuide(c *gin.Context) {
	guideID := c.Param("guideId")
	tours, err := service.GetToursByGuide(guideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tours)
}

func PublishTour(c *gin.Context) {
	tourID := c.Param("tourId")
	guideID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	err := service.PublishTour(tourID, guideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tura je uspešno objavljena"})
}

func ArchiveTour(c *gin.Context) {
	tourID := c.Param("tourId")
	guideID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	err := service.ArchiveTour(tourID, guideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tura je uspešno arhivirana"})
}

func GetAllTours(c *gin.Context) {
	tours, err := service.GetAllTours()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tours)
}

func CreateKeyPoint(c *gin.Context) {
	tourID := c.Param("tourId")

	imagePath, err := handleImageUpload(c, "image")
	if err != nil && err.Error() != "http: no such file" {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	name := c.PostForm("name")
	description := c.PostForm("description")
	longitudeStr := c.PostForm("longitude")
	latitudeStr := c.PostForm("latitude")

	if name == "" || description == "" || longitudeStr == "" || latitudeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sva polja su obavezna (name, description, longitude, latitude)"})
		return
	}

	longitude, err := strconv.ParseFloat(longitudeStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravna longitude vrednost"})
		return
	}

	latitude, err := strconv.ParseFloat(latitudeStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravna latitude vrednost"})
		return
	}

	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan tour ID"})
		return
	}

	keyPointData := model.KeyPoint{
		TourID:      tourObjectID,
		Name:        name,
		Description: description,
		Image:       imagePath,
		Longitude:   longitude,
		Latitude:    latitude,
	}

	keyPoint, err := service.CreateKeyPoint(keyPointData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, keyPoint)
}

func GetKeyPointsByTour(c *gin.Context) {
	tourID := c.Param("tourId")
	keyPoints, err := service.GetKeyPointsByTour(tourID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keyPoints)
}

func UpdateKeyPoint(c *gin.Context) {
	keyPointID := c.Param("keyPointId")

	imagePath, _ := handleImageUpload(c, "image")

	updateData := model.KeyPoint{
		Name:        c.PostForm("name"),
		Description: c.PostForm("description"),
		Image:       imagePath,
	}

	if longitudeStr := c.PostForm("longitude"); longitudeStr != "" {
		longitude, _ := strconv.ParseFloat(longitudeStr, 64)
		updateData.Longitude = longitude
	}
	if latitudeStr := c.PostForm("latitude"); latitudeStr != "" {
		latitude, _ := strconv.ParseFloat(latitudeStr, 64)
		updateData.Latitude = latitude
	}

	keyPoint, err := service.UpdateKeyPoint(keyPointID, updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keyPoint)
}

func DeleteKeyPoint(c *gin.Context) {
	keyPointID := c.Param("keyPointId")
	err := service.DeleteKeyPoint(keyPointID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ključna tačka je uspešno obrisana"})
}
