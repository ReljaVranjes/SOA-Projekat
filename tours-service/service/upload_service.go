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
	return UploadImageToDir(file, "keypoints")
}

func UploadImageToDir(file *multipart.FileHeader, subDir string) (string, error) {
	fmt.Printf("DEBUG: UploadImageToDir called with file: %s, subDir: %s\n", file.Filename, subDir)
	
	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		fmt.Printf("DEBUG: File too large: %d bytes\n", file.Size)
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
	
	// Create full path with subdirectory
	uploadDir := filepath.Join("uploads", subDir)
	fmt.Printf("DEBUG: Creating directory: %s\n", uploadDir)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		fmt.Printf("DEBUG: Failed to create directory: %v\n", err)
		return "", fmt.Errorf("greška prilikom kreiranja direktorijuma")
	}
	
	imagePath := filepath.Join(uploadDir, filename)
	fmt.Printf("DEBUG: Full image path: %s\n", imagePath)

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
	bytesWritten, err := dst.ReadFrom(src)
	if err != nil {
		fmt.Printf("DEBUG: Failed to copy file content: %v\n", err)
		return "", fmt.Errorf("greška prilikom čuvanja fajla")
	}
	
	fmt.Printf("DEBUG: Successfully saved file: %s (%d bytes written)\n", imagePath, bytesWritten)
	return imagePath, nil
}