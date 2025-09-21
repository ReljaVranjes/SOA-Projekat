package handler

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"stakeholders-service/model"
	"stakeholders-service/service"
	pb "stakeholders-service/proto/block"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type LoginReq struct {
    Email    string `json:"email"    form:"email"    binding:"required,email"`
    Password string `json:"password" form:"password" binding:"required"`
}

//  implements the gRPC service
type BlockHandler struct {
	pb.UnimplementedBlockServiceServer
}

func ValidateToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authorization token missing or malformed",
		})
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse and verify JWT token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		if err == jwt.ErrTokenExpired {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	if !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	// Get email from token (following your existing pattern)
	email, ok := claims["email"].(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email in token"})
		return
	}

	// Get user using the service layer (like other handlers)
	user, err := service.GetUserProfile(email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Check user status (following your existing pattern)
	if user.Status == model.Blocked {
		c.JSON(http.StatusForbidden, gin.H{"error": "User account is blocked"})
		return
	}

	// Return user data (without sensitive info)
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":    user.ID.Hex(),
			"email": user.Email,
			"role":  string(user.Role),		
		},
	})
}

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
	var input LoginReq

    // Prihvata JSON ili form na osnovu Content-Type (ako želiš striktno JSON, koristi ShouldBindJSON)
    if err := c.ShouldBind(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error":   "Neispravan unos",
            "details": err.Error(),
        })
        return
    }
    
    log.Printf("Parsed login data - Email: %s, Password: [hidden]", input.Email)

	// Servis obrada
	res, err := service.LoginUser(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func Me(c *gin.Context) {
	user_id, _ := c.Get("user_id")
	email, _ := c.Get("email")
	role, _ := c.Get("role")

	c.JSON(http.StatusOK, gin.H{
		"user_id": user_id,
		"email":   email,
		"role":    role,
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
	log.Printf("🟢 [HTTP] BlockUser called with user_id: %s", c.Param("id"))
	log.Printf("🟢 [HTTP] Request headers: %v", c.Request.Header)
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

// BlockUser handles gRPC BlockUser calls
func (s *BlockHandler) BlockUser(ctx context.Context, req *pb.BlockUserRequest) (*pb.BlockUserResponse, error) {
	log.Printf("🔵 [gRPC] BlockUser called with role: %v, user_id: %s", req.Role, req.UserId)
	// Convert proto role to model role
	var role model.UserRole
	switch req.Role {
	case pb.UserRole_USER_ROLE_USER:
		role = model.Tourist
	case pb.UserRole_USER_ROLE_ADMIN:
		role = model.Admin
	case pb.UserRole_USER_ROLE_GUIDE:
		role = model.Guide
	default:
		return &pb.BlockUserResponse{
			Message: "Invalid role",
		}, nil
	}

	// Call your existing service
	err := service.BlockUser(role, req.UserId)
	if err != nil {
		return &pb.BlockUserResponse{
			Message: "Failed to block user: " + err.Error(),
		}, nil
	}

	return &pb.BlockUserResponse{
		Message: "User blocked successfully",
	}, nil
}

func UnblockUser(c *gin.Context) {
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
	err := service.UnblockUser(role, userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Korisnik je uspešno odblokiran"})
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

	// Proveri da li je korisnik blokiran
	if user.Status == model.Blocked {
		c.JSON(http.StatusForbidden, gin.H{"error": "vaš nalog je blokiran. kontaktirajte administratora"})
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

// GetBalance - user gets their current balance
func GetBalance(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Korisnik nije autentifikovan"})
		return
	}

	user, err := service.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Greška prilikom dobavljanja korisnika"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": user.Balance,
	})
}

// AddBalance - admin adds balance to any user
func AddBalance(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("role")
	if !exists || userRole.(string) != "Admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Pristup dozvoljen samo administratorima"})
		return
	}

	targetUserID := c.Param("id")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID je obavezan"})
		return
	}

	var request struct {
		Amount float64 `json:"amount" binding:"required,min=0"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan format zahteva"})
		return
	}

	err := service.AddUserBalance(targetUserID, request.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Balans je uspešno dodat",
		"amount":  request.Amount,
	})
}

// SetBalance - admin sets exact balance for any user
func SetBalance(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("role")
	if !exists || userRole.(string) != "Admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Pristup dozvoljen samo administratorima"})
		return
	}

	targetUserID := c.Param("id")
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID je obavezan"})
		return
	}

	var request struct {
		Balance float64 `json:"balance" binding:"required,min=0"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Neispravan format zahteva"})
		return
	}

	err := service.SetUserBalance(targetUserID, request.Balance)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Balans je uspešno postavljen",
		"balance": request.Balance,
  })

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

	// Return user data without sensitive information
	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID.Hex(),
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"role":      string(user.Role),
		"status":    string(user.Status),
		"name":      user.FirstName + " " + user.LastName, // Combined name for blog component
	})
}
