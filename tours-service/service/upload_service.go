package service

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

func UploadImage(file *multipart.FileHeader) (string, error) {
	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		return "", fmt.Errorf("slika je prevelika (max 5MB)")
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	isValidExt := false
	for _, allowedExt := range allowedExts {
		if ext == allowedExt {
			isValidExt = true
			break
		}
	}
	if !isValidExt {
		return "", fmt.Errorf("neispravna ekstenzija fajla (dozvoljene: jpg, jpeg, png, gif, webp)")
	}

	// Create unique filename
	uniqueID := uuid.New().String()
	filename := fmt.Sprintf("%s_%d%s", uniqueID, time.Now().Unix(), ext)
	
	// Create full path
	uploadDir := "uploads/keypoints"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("greška prilikom kreiranja direktorijuma")
	}
	
	imagePath := filepath.Join(uploadDir, filename)

	// Open the file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("greška prilikom otvaranja fajla")
	}
	defer src.Close()

	// Create the destination file
	dst, err := os.Create(imagePath)
	if err != nil {
		return "", fmt.Errorf("greška prilikom kreiranja fajla")
	}
	defer dst.Close()

	// Copy the file content
	_, err = dst.ReadFrom(src)
	if err != nil {
		return "", fmt.Errorf("greška prilikom čuvanja fajla")
	}

	return imagePath, nil
}