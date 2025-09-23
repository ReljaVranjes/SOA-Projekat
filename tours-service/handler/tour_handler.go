package handler

import (
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"
	"tours-service/middleware"
	"tours-service/model"
	pb "tours-service/proto/tours"
	"tours-service/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)


type ToursHandler struct {
	pb.UnimplementedToursServiceServer // gRPC interface
}

func CreateTour(c *gin.Context) {
	guideID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	// Check if this is multipart form data (tour with key points)
	contentType := c.Request.Header.Get("Content-Type")
	fmt.Printf("DEBUG: CreateTour Content-Type: %s\n", contentType)

	if contentType != "" && strings.Contains(contentType, "multipart/form-data") {
		fmt.Printf("DEBUG: Using multipart approach (tour with key points)\n")
		CreateTourWithKeyPoints(c, guideID)
		return
	}

	fmt.Printf("DEBUG: Using JSON approach (tour without key points)\n")

	// Original JSON-only tour creation
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

func CreateTourWithKeyPoints(c *gin.Context, guideID string) {
	fmt.Printf("DEBUG: CreateTourWithKeyPoints called for guideID: %s\n", guideID)

	// Parse tour data from form
	name := c.PostForm("name")
	description := c.PostForm("description")
	level := c.PostForm("level")
	tags := c.PostFormArray("tags[]")
	priceStr := c.PostForm("price")
	durationStr := c.PostForm("duration")
	maxPeopleStr := c.PostForm("maxPeople")

	fmt.Printf("DEBUG: Tour form data - name: %s, description: %s, level: %s, price: %s, duration: %s, maxPeople: %s, tags: %v\n",
		name, description, level, priceStr, durationStr, maxPeopleStr, tags)

	// Parse and create key points
	form, err := c.MultipartForm()
	if err != nil {
		fmt.Printf("DEBUG: Error parsing multipart form: %v\n", err)
		c.JSON(http.StatusCreated, gin.H{"error": "Error parsing form: " + err.Error()}) // Return tour even if no key points
		return
	}

	// Get key points data
	keyPointNames := form.Value["keyPointNames[]"]
	keyPointDescriptions := form.Value["keyPointDescriptions[]"]
	keyPointLatitudes := form.Value["keyPointLatitudes[]"]
	keyPointLongitudes := form.Value["keyPointLongitudes[]"]
	keyPointImages := form.File["keyPointImages[]"]

	fmt.Printf("DEBUG: Key points data - names: %v, descriptions: %v, latitudes: %v, longitudes: %v, images: %d\n",
		keyPointNames, keyPointDescriptions, keyPointLatitudes, keyPointLongitudes, len(keyPointImages))

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ime ture je obavezno"})
		return
	}

	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravna cena"})
		return
	}

	duration, err := strconv.Atoi(durationStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravno trajanje"})
		return
	}

	maxPeople, err := strconv.Atoi(maxPeopleStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan broj ljudi"})
		return
	}

	// Create tour data
	tourData := model.Tour{
		Name:        name,
		Description: description,
		Level:       level,
		Tags:        tags,
		Price:       price,
		Duration:    duration,
		MaxPeople:   maxPeople,
	}

	// Create the tour first and get the generated ID
	tour, err := service.CreateTour(tourData, guideID)
	if err != nil {
		fmt.Printf("DEBUG: Failed to create tour: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("DEBUG: Tour created successfully with ID: %s\n", tour.ID.Hex())

	// Validate that we have a valid tour ID before proceeding
	if tour.ID.IsZero() {
		fmt.Printf("DEBUG: Error - Tour ID is empty/zero after creation\n")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate valid tour ID"})
		return
	}

	// Now create key points using the saved tour's ID
	fmt.Printf("DEBUG: Creating %d key points for tour ID: %s\n", len(keyPointNames), tour.ID.Hex())

	for i := 0; i < len(keyPointNames); i++ {
		if keyPointNames[i] == "" || i >= len(keyPointLatitudes) || i >= len(keyPointLongitudes) {
			fmt.Printf("DEBUG: Skipping key point %d - missing required data\n", i)
			continue
		}

		latitude, err := strconv.ParseFloat(keyPointLatitudes[i], 64)
		if err != nil {
			fmt.Printf("DEBUG: Skipping key point %d - invalid latitude: %v\n", i, err)
			continue
		}

		longitude, err := strconv.ParseFloat(keyPointLongitudes[i], 64)
		if err != nil {
			fmt.Printf("DEBUG: Skipping key point %d - invalid longitude: %v\n", i, err)
			continue
		}

		description := ""
		if i < len(keyPointDescriptions) {
			description = keyPointDescriptions[i]
		}

		keyPointData := model.KeyPoint{
			TourID:      tour.ID, // Using the saved tour's valid ID
			Name:        keyPointNames[i],
			Description: description,
			Latitude:    latitude,
			Longitude:   longitude,
		}

		var image *multipart.FileHeader
		if i < len(keyPointImages) {
			image = keyPointImages[i]
		}

		fmt.Printf("DEBUG: Creating key point %d: name=%s, tourID=%s, lat=%f, lng=%f\n",
			i, keyPointNames[i], tour.ID.Hex(), latitude, longitude)

		keyPoint, err := service.CreateKeyPoint(keyPointData, image)
		if err != nil {
			fmt.Printf("DEBUG: Failed to create key point %s: %v\n", keyPointNames[i], err)
		} else {
			fmt.Printf("DEBUG: Successfully created key point %s with ID: %s\n", keyPointNames[i], keyPoint.ID.Hex())
		}
	}

	// Calculate and update tour distance after all key points are created
	if len(keyPointNames) > 1 {
		fmt.Printf("DEBUG: Calculating distance for tour with %d key points\n", len(keyPointNames))

		// Get all key points for this tour to calculate distance
		keyPoints, err := service.GetKeyPointsByTour(tour.ID.Hex())
		if err != nil {
			fmt.Printf("DEBUG: Warning - could not fetch key points for distance calculation: %v\n", err)
		} else {
			distance := service.CalculateTourDistance(keyPoints)
			fmt.Printf("DEBUG: Calculated tour distance: %.2f km\n", distance)

			// Update tour with calculated distance and travel times
			err = service.UpdateTourDistanceAndTravelTimes(tour.ID.Hex(), distance)
			if err != nil {
				fmt.Printf("DEBUG: Warning - could not update tour distance and travel times: %v\n", err)
			} else {
				// Update the tour object we're returning with calculated values
				tour.Distance = distance
				if distance > 0 {
					tour.TravelTimeOnFoot = distance / 5.0   // 5 km/h
					tour.TravelTimeBike = distance / 25.0    // 25 km/h
					tour.TravelTimeCar = distance / 80.0     // 80 km/h
				}
				fmt.Printf("DEBUG: Successfully updated tour distance and travel times\n")
			}
		}
	}

	c.JSON(http.StatusCreated, tour)
}

// recalculateTourDistance is a helper function to recalculate and update tour distance and travel times
func recalculateTourDistance(tourID string) {
	fmt.Printf("DEBUG: Recalculating distance and travel times for tour: %s\n", tourID)

	// Get all key points for this tour
	keyPoints, err := service.GetKeyPointsByTour(tourID)
	if err != nil {
		fmt.Printf("DEBUG: Warning - could not fetch key points for distance recalculation: %v\n", err)
		return
	}

	// Calculate new distance
	distance := service.CalculateTourDistance(keyPoints)
	fmt.Printf("DEBUG: Recalculated tour distance: %.2f km for %d key points\n", distance, len(keyPoints))

	// Update tour with new distance and calculated travel times
	err = service.UpdateTourDistanceAndTravelTimes(tourID, distance)
	if err != nil {
		fmt.Printf("DEBUG: Warning - could not update tour distance and travel times: %v\n", err)
	} else {
		// Calculate travel times for logging
		if distance > 0 {
			onFoot := distance / 5.0   // 5 km/h
			bike := distance / 25.0    // 25 km/h
			car := distance / 80.0     // 80 km/h
			fmt.Printf("DEBUG: Successfully updated tour distance to %.2f km\n", distance)
			fmt.Printf("DEBUG: Travel times - On foot: %.2f hours, Bike: %.2f hours, Car: %.2f hours\n", onFoot, bike, car)
		} else {
			fmt.Printf("DEBUG: Successfully updated tour distance to %.2f km (no travel times for zero distance)\n", distance)
		}
	}
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

func GetTourByID(c *gin.Context) {
	id := c.Param("tourId")
	tour, err := service.GetTourByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tour)
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

func CheckTourPublishRequirements(c *gin.Context) {
	tourID := c.Param("tourId")

	canPublish, missingRequirements, err := service.CanTourBePublished(tourID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"canPublish":           canPublish,
		"missingRequirements": missingRequirements,
	})
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

	// Filter only published tours for public endpoint
	var publishedTours []model.Tour
	for _, tour := range tours {
		if tour.Status == model.Published {
			publishedTours = append(publishedTours, tour)
		}
	}

	fmt.Printf("DEBUG: Returning %d published tours with distance/travel time data\n", len(publishedTours))
	if len(publishedTours) > 0 {
		fmt.Printf("DEBUG: First tour - Distance: %.2f, Travel times: %.2f/%.2f/%.2f\n",
			publishedTours[0].Distance,
			publishedTours[0].TravelTimeOnFoot,
			publishedTours[0].TravelTimeBike,
			publishedTours[0].TravelTimeCar)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Tours fetched successfully",
		"total_count": len(publishedTours),
		"tours": publishedTours,
	})
}

// GetTours - gRPC metoda (nova)
func (h *ToursHandler) GetTours(ctx context.Context, req *pb.GetToursRequest) (*pb.GetToursResponse, error) {
	log.Println("gRPC GetTours called")

	// Pozivanje ISTE business logike kao HTTP endpoint
	tours, err := service.GetAllTours()
	if err != nil {
		log.Printf("Error fetching tours: %v", err)
		return &pb.GetToursResponse{
			Tours:      nil,
			TotalCount: 0,
			Success:    false,
			Message:    "Error fetching tours: " + err.Error(),
		}, nil
	}

	// Konvertovanje u protobuf format
	pbTours := make([]*pb.Tour, len(tours))
	for i, tour := range tours {
		pbTours[i] = convertTourToProto(tour)
	}

	return &pb.GetToursResponse{
		Tours:      pbTours,
		TotalCount: int32(len(tours)),
		Success:    true,
		Message:    "Tours fetched successfully",
	}, nil
}

// convertTourToProto - helper funkcija
func convertTourToProto(tour model.Tour) *pb.Tour {
	return &pb.Tour{
		Id:          tour.ID.Hex(),
		Name:        tour.Name,
		Description: tour.Description,
		Level:       tour.Level,
		Tags:        tour.Tags,
		Status:      string(tour.Status),
		Price:       tour.Price,
		Duration:    int32(tour.Duration),
		MaxPeople:   int32(tour.MaxPeople),
		KeyPoints:   "",
		GuideId:     tour.GuideID.Hex(),
		CreatedAt:   tour.CreatedAt.Time().Format(time.RFC3339),
		UpdatedAt:   tour.UpdatedAt.Time().Format(time.RFC3339),
	}
}




func CreateKeyPoint(c *gin.Context) {
	tourID := c.Param("tourId")
	fmt.Printf("DEBUG: CreateKeyPoint called for tourID: %s\n", tourID)

	// Get image file (optional)
	image, err := c.FormFile("image")
	if err != nil && err.Error() != "http: no such file" {
		fmt.Printf("DEBUG: Error getting form file: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Greška pri čitanju slike"})
		return
	}
	
	if image != nil {
		fmt.Printf("DEBUG: Received image file: %s, size: %d\n", image.Filename, image.Size)
	} else {
		fmt.Printf("DEBUG: No image file received\n")
	}

	name := c.PostForm("name")
	description := c.PostForm("description")
	longitudeStr := c.PostForm("longitude")
	latitudeStr := c.PostForm("latitude")
	
	fmt.Printf("DEBUG: Form data - name: %s, description: %s, longitude: %s, latitude: %s\n", 
		name, description, longitudeStr, latitudeStr)

	if name == "" || longitudeStr == "" || latitudeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, longitude, and latitude are required"})
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
		Longitude:   longitude,
		Latitude:    latitude,
	}

	keyPoint, err := service.CreateKeyPoint(keyPointData, image)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Recalculate tour distance after adding key point
	recalculateTourDistance(tourID)

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
	tourID := c.Param("tourId") // Get tour ID from URL

	image, _ := c.FormFile("image")

	updateData := model.KeyPoint{
		Name:        c.PostForm("name"),
		Description: c.PostForm("description"),
	}

	if longitudeStr := c.PostForm("longitude"); longitudeStr != "" {
		longitude, _ := strconv.ParseFloat(longitudeStr, 64)
		updateData.Longitude = longitude
	}
	if latitudeStr := c.PostForm("latitude"); latitudeStr != "" {
		latitude, _ := strconv.ParseFloat(latitudeStr, 64)
		updateData.Latitude = latitude
	}

	keyPoint, err := service.UpdateKeyPoint(keyPointID, updateData, image)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Recalculate tour distance after updating key point
	recalculateTourDistance(tourID)

	c.JSON(http.StatusOK, keyPoint)
}

func DeleteKeyPoint(c *gin.Context) {
	keyPointID := c.Param("keyPointId")
	tourID := c.Param("tourId") // Get tour ID from URL

	err := service.DeleteKeyPoint(keyPointID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Recalculate tour distance after deleting key point
	recalculateTourDistance(tourID)

	c.JSON(http.StatusOK, gin.H{"message": "Ključna tačka je uspešno obrisana"})
}

func CreateReview(c *gin.Context) {
	tourID := c.Param("tourId")

	touristID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	rate := c.PostForm("rate")
	comment := c.PostForm("comment")
	tourDateStr := c.PostForm("tourDate")

	reviewData, err := service.ParseReviewFormData(rate, comment, tourDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan tour ID"})
		return
	}
	reviewData.TourID = tourObjectID

	form, err := c.MultipartForm()
	var images []*multipart.FileHeader
	if err == nil && form.File["images"] != nil {
		images = form.File["images"]
	}

	review, err := service.CreateReview(reviewData, touristID, images)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

func GetReviewsByTour(c *gin.Context) {
	tourID := c.Param("tourId")
	reviews, err := service.GetReviewsByTour(tourID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func GetReviewsByTourist(c *gin.Context) {
	touristID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	reviews, err := service.GetReviewsByTourist(touristID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reviews)
}

func UpdateReview(c *gin.Context) {
	reviewID := c.Param("reviewId")

	touristID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	rate := c.PostForm("rate")
	comment := c.PostForm("comment")
	tourDateStr := c.PostForm("tourDate")

	var updateData model.Review
	var err error

	if rate != "" || comment != "" || tourDateStr != "" {
		updateData, err = service.ParseReviewFormData(rate, comment, tourDateStr)
		if err != nil && rate != "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if comment != "" {
			updateData.Comment = comment
		}
	}

	form, err := c.MultipartForm()
	var images []*multipart.FileHeader
	if err == nil && form.File["images"] != nil {
		images = form.File["images"]
	}

	review, err := service.UpdateReview(reviewID, touristID, updateData, images)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, review)
}

func DeleteReview(c *gin.Context) {
	reviewID := c.Param("reviewId")

	touristID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	err := service.DeleteReview(reviewID, touristID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recenzija je uspešno obrisana"})
}

// GenerateTokens generates purchase tokens for multiple tours (SAGA endpoint)
func GenerateTokens(c *gin.Context) {
	var request model.TokenRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan format zahteva"})
		return
	}

	response, err := service.GenerateTokensForTours(request.UserID, request.TourIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// GetPurchasedTours returns all tours user has purchased
func GetPurchasedTours(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	tours, err := service.GetUserPurchasedTours(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tours)
}

// DeleteTokens removes purchase tokens (SAGA rollback endpoint)
func DeleteTokens(c *gin.Context) {
	var request model.TokenRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan format zahteva"})
		return
	}

	err := service.DeleteTokensForRollback(request.UserID, request.TourIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tokeni su uspešno obrisani"})
}
