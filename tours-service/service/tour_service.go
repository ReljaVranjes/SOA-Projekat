package service

import (
	"errors"
	"math"
	"time"
	"tours-service/model"
	"tours-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// haversineDistance calculates the distance between two points on Earth using the Haversine formula
// Returns distance in kilometers
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusKm = 6371 // Earth's radius in kilometers

	// Convert degrees to radians
	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	// Differences
	deltaLat := lat2Rad - lat1Rad
	deltaLon := lon2Rad - lon1Rad

	// Haversine formula
	a := math.Pow(math.Sin(deltaLat/2), 2) + math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Pow(math.Sin(deltaLon/2), 2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	// Distance in kilometers
	distance := earthRadiusKm * c
	return distance
}

// calculateTourDistance calculates the total distance of a tour by summing distances between consecutive key points
func calculateTourDistance(keyPoints []model.KeyPoint) float64 {
	if len(keyPoints) <= 1 {
		return 0.0 // No distance for 0 or 1 key points
	}

	totalDistance := 0.0
	for i := 1; i < len(keyPoints); i++ {
		distance := haversineDistance(
			keyPoints[i-1].Latitude, keyPoints[i-1].Longitude,
			keyPoints[i].Latitude, keyPoints[i].Longitude,
		)
		totalDistance += distance
	}

	return totalDistance
}

// calculateTravelTimes calculates travel times for different methods of transport
func calculateTravelTimes(distance float64) (onFoot, bike, car float64) {
	if distance <= 0 {
		return 0.0, 0.0, 0.0
	}

	onFoot = distance / model.SpeedOnFoot   // hours = km / (km/h)
	bike = distance / model.SpeedBicycle    // hours = km / (km/h)
	car = distance / model.SpeedCar         // hours = km / (km/h)

	return onFoot, bike, car
}

func CreateTour(tourData model.Tour, guideID string) (model.Tour, error) {
	guideObjectID, err := primitive.ObjectIDFromHex(guideID)
	if err != nil {
		return model.Tour{}, errors.New("neispravan guide ID")
	}

	tour := model.Tour{
		Name:        tourData.Name,
		Description: tourData.Description,
		Level:       tourData.Level,
		Tags:        tourData.Tags,
		Status:      model.Draft,
		Price:       tourData.Price,
		Duration:    tourData.Duration,
		MaxPeople:   tourData.MaxPeople,
		KeyPoints:   tourData.KeyPoints,
		GuideID:     guideObjectID,
		CreatedAt:   primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:   primitive.NewDateTimeFromTime(time.Now()),
	}

	err = repo.CreateTour(&tour)
	if err != nil {
		return model.Tour{}, errors.New("greška prilikom kreiranja ture")
	}

	return tour, nil
}

// CalculateTourDistance exports the calculateTourDistance function for use in handlers
func CalculateTourDistance(keyPoints []model.KeyPoint) float64 {
	return calculateTourDistance(keyPoints)
}

// UpdateTourDistance updates the distance field of a tour
func UpdateTourDistance(tourID string, distance float64) error {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return errors.New("neispravan tour ID")
	}

	return repo.UpdateTourDistance(tourObjectID, distance)
}

// UpdateTourDistanceAndTravelTimes updates distance and all travel times for a tour
func UpdateTourDistanceAndTravelTimes(tourID string, distance float64) error {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return errors.New("neispravan tour ID")
	}

	// Calculate travel times for all methods
	travelTimeOnFoot, travelTimeBike, travelTimeCar := calculateTravelTimes(distance)

	return repo.UpdateTourDistanceAndTravelTimes(tourObjectID, distance, travelTimeOnFoot, travelTimeBike, travelTimeCar)
}

func GetToursByGuide(guideID string) ([]model.Tour, error) {
	guideObjectID, err := primitive.ObjectIDFromHex(guideID)
	if err != nil {
		return nil, errors.New("neispravan guide ID")
	}

	tours, err := repo.GetToursByGuideID(guideObjectID)
	if err != nil {
		return nil, errors.New("greška prilikom dobavljanja tura")
	}

	return tours, nil
}

func GetTourByID(id string) (model.Tour, error) {
	if id == "" {
		return model.Tour{}, errors.New("neispravan tour ID")
	}

	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return model.Tour{}, errors.New("neispravan tour ID")
	}

	tour, err := repo.GetTourByID(oid)
	if err != nil {
		return model.Tour{}, errors.New("greška prilikom dobavljanja ture")
	}

	return tour, nil
}

// validateTourForPublishing checks if a tour meets all requirements for publishing
func validateTourForPublishing(tour model.Tour) error {
	// Check if tour has name (naziv)
	if tour.Name == "" {
		return errors.New("tura mora imati naziv")
	}

	// Check if tour has description (opis)
	if tour.Description == "" {
		return errors.New("tura mora imati opis")
	}

	// Check if tour has level (težina)
	if tour.Level == "" {
		return errors.New("tura mora imati nivo težine")
	}

	// Check if tour has at least one tag (tagovi)
	if len(tour.Tags) == 0 {
		return errors.New("tura mora imati bar jedan tag")
	}

	// Check if tour has at least 2 key points
	keyPoints, err := GetKeyPointsByTour(tour.ID.Hex())
	if err != nil {
		return errors.New("greška prilikom proveravanja ključnih tačaka")
	}

	if len(keyPoints) < 2 {
		return errors.New("tura mora imati bar 2 ključne tačke")
	}

	return nil
}

// CanTourBePublished checks if a tour can be published and returns validation status
func CanTourBePublished(tourID string) (bool, []string, error) {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return false, nil, errors.New("neispravan tour ID")
	}

	tour, err := repo.GetTourByID(tourObjectID)
	if err != nil {
		return false, nil, errors.New("tura nije pronađena")
	}

	var missingRequirements []string

	// Check all requirements and collect missing ones
	if tour.Name == "" {
		missingRequirements = append(missingRequirements, "naziv")
	}

	if tour.Description == "" {
		missingRequirements = append(missingRequirements, "opis")
	}

	if tour.Level == "" {
		missingRequirements = append(missingRequirements, "nivo težine")
	}

	if len(tour.Tags) == 0 {
		missingRequirements = append(missingRequirements, "tagovi")
	}

	// Check key points
	keyPoints, err := GetKeyPointsByTour(tour.ID.Hex())
	if err != nil {
		return false, nil, errors.New("greška prilikom proveravanja ključnih tačaka")
	}

	if len(keyPoints) < 2 {
		missingRequirements = append(missingRequirements, "bar 2 ključne tačke")
	}

	canPublish := len(missingRequirements) == 0
	return canPublish, missingRequirements, nil
}

func PublishTour(tourID string, guideID string) error {
	tour, err := getTourByIDAndVerifyOwnership(tourID, guideID)
	if err != nil {
		return err
	}

	if tour.Status != model.Draft && tour.Status != model.Archived {
		return errors.New("može se objaviti samo tura sa statusom Draft ili Archived")
	}

	// Validate tour meets all publishing requirements
	if err := validateTourForPublishing(tour); err != nil {
		return err
	}

	tourObjectID, _ := primitive.ObjectIDFromHex(tourID)
	return repo.PublishTour(tourObjectID)
}

func ArchiveTour(tourID string, guideID string) error {
	tour, err := getTourByIDAndVerifyOwnership(tourID, guideID)
	if err != nil {
		return err
	}

	if tour.Status != model.Published {
		return errors.New("može se arhivirati samo objavljena tura")
	}

	tourObjectID, _ := primitive.ObjectIDFromHex(tourID)
	return repo.ArchiveTour(tourObjectID)
}

func GetAllTours() ([]model.Tour, error) {
	tours, err := repo.GetAllTours()
	if err != nil {
		return nil, errors.New("greška prilikom dohvatanja svih tura")
	}
	return tours, nil
}

func getTourByIDAndVerifyOwnership(tourID string, guideID string) (model.Tour, error) {
	tourObjectID, err := primitive.ObjectIDFromHex(tourID)
	if err != nil {
		return model.Tour{}, errors.New("neispravan tour ID")
	}

	guideObjectID, err := primitive.ObjectIDFromHex(guideID)
	if err != nil {
		return model.Tour{}, errors.New("neispravan guide ID")
	}

	tour, err := repo.GetTourByID(tourObjectID)
	if err != nil {
		return model.Tour{}, errors.New("tura nije pronađena")
	}

	if tour.GuideID != guideObjectID {
		return model.Tour{}, errors.New("nemate dozvolu za ovu turu")
	}

	return tour, nil
}
