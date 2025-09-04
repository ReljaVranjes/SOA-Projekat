package service

import (
	"errors"
	"os"
	"time"

	"stakeholders-service/model"
	"stakeholders-service/repo"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// PublicUser is a safe DTO for sending user data to clients (no password).
type PublicUser struct {
	ID           string            `json:"id"`
	Username     string            `json:"username"`
	Email        string            `json:"email"`
	Role         model.UserRole    `json:"role"`
	Status       model.UserStatus  `json:"status"`
	FirstName    string            `json:"firstName"`
	LastName     string            `json:"lastName"`
	ProfileImage string            `json:"profileImage"`
	Biography    string            `json:"biography"`
	Motto        string            `json:"motto"`
}

// LoginResponse is what /login returns now.
type LoginResponse struct {
	Token string     `json:"token"`
	User  PublicUser `json:"user"`
}

func toPublicUser(u model.User) PublicUser {
	return PublicUser{
		ID:           u.ID.Hex(),
		Username:     u.Username,
		Email:        u.Email,
		Role:         u.Role,
		Status:       u.Status,
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		ProfileImage: u.ProfileImage,
		Biography:    u.Biography,
		Motto:        u.Motto,
	}
}

func RegisterUser(user model.User) (string, error) {
	// 1. Proveri da li već postoji korisnik sa istim emailom
	exists, err := repo.UserExistsByEmail(user.Email)
	if err != nil {
		return "", err
	}
	if exists {
		return "", errors.New("korisnik sa tim emailom već postoji")
	}

	// 2. Hešuj lozinku
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), 12)
	if err != nil {
		return "", errors.New("greška prilikom hešovanja lozinke")
	}
	user.Password = string(hashedPassword)

	// 2.1. Postavi status na Active
	user.Status = model.Active

	// 3. Sačuvaj korisnika
	if err := repo.CreateUser(user); err != nil {
		return "", errors.New("greška prilikom čuvanja korisnika")
	}

	// 4. Kreiraj JWT token
	claims := jwt.MapClaims{
		"id":    user.ID.Hex(),          // hex string je sigurniji za token
		"email": user.Email,
		"role":  string(user.Role),
		"exp":   time.Now().Add(72 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", errors.New("JWT_SECRET nije postavljen u okruženju")
	}
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", errors.New("neuspešno generisanje tokena")
	}

	return signedToken, nil
}

func LoginUser(email, password string) (LoginResponse, error) {
	user, err := repo.FindUserByEmail(email)
	if err != nil {
		return LoginResponse{}, errors.New("korisnik ne postoji")
	}

	// Proveri lozinku
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return LoginResponse{}, errors.New("pogrešna lozinka")
	}

	// Generiši token
	claims := jwt.MapClaims{
		"id":    user.ID.Hex(),
		"email": user.Email,
		"role":  string(user.Role),
		"exp":   time.Now().Add(72 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return LoginResponse{}, errors.New("JWT_SECRET nije postavljen u okruženju")
	}
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return LoginResponse{}, errors.New("greška pri generisanju tokena")
	}

	return LoginResponse{
		Token: signedToken,
		User:  toPublicUser(user),
	}, nil
}
