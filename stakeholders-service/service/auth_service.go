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

	// 3. Sačuvaj korisnika
	err = repo.CreateUser(user)
	if err != nil {
		return "", errors.New("greška prilikom čuvanja korisnika")
	}

	// 4. Kreiraj JWT token
	claims := jwt.MapClaims{
		"id":	 user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", errors.New("neuspešno generisanje tokena")
	}

	return signedToken, nil
}

func LoginUser(email, password string) (string, error) {
	user, err := repo.FindUserByEmail(email)
	if err != nil {
		return "", errors.New("korisnik ne postoji")
	}

	// Proveri lozinku
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("pogrešna lozinka")
	}

	// Generiši token
	claims := jwt.MapClaims{
		"id":	 user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", errors.New("greška pri generisanju tokena")
	}

	return signedToken, nil
}

