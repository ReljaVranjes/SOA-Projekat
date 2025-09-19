package service

import (
	"errors"
	"payment-service/model"
	"payment-service/repo"
)

// GetUserCart retrieves user's shopping cart
func GetUserCart(userID string) (model.ShoppingCart, error) {
	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}
	return cart, nil
}

// AddTourToCart adds a tour to user's shopping cart
func AddTourToCart(userID, tourID, tourName string, price float64) (model.ShoppingCart, error) {
	if tourID == "" || tourName == "" || price <= 0 {
		return model.ShoppingCart{}, errors.New("neispravni podaci o turi")
	}

	// Get current cart
	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}

	// Create order item
	item := model.OrderItem{
		TourID:   tourID,
		TourName: tourName,
		Price:    price,
	}

	// Add item to cart (this will update if already exists)
	cart.AddItem(item)

	// Save cart
	err = repo.SaveCart(cart)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom čuvanja korpe")
	}

	return cart, nil
}

// RemoveTourFromCart removes a tour from user's shopping cart
func RemoveTourFromCart(userID, tourID string) (model.ShoppingCart, error) {
	if tourID == "" {
		return model.ShoppingCart{}, errors.New("tour ID je obavezan")
	}

	// Get current cart
	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}

	// Remove item from cart
	removed := cart.RemoveItem(tourID)
	if !removed {
		return model.ShoppingCart{}, errors.New("tura nije pronađena u korpi")
	}

	// Save cart
	err = repo.SaveCart(cart)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom čuvanja korpe")
	}

	return cart, nil
}

// ClearUserCart removes all items from user's cart
func ClearUserCart(userID string) error {
	err := repo.ClearCart(userID)
	if err != nil {
		return errors.New("greška prilikom brisanja korpe")
	}
	return nil
}

// ValidateCartForCheckout validates cart before checkout
func ValidateCartForCheckout(userID string) (model.ShoppingCart, error) {
	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}

	if cart.IsEmpty() {
		return model.ShoppingCart{}, errors.New("korpa je prazna")
	}

	if cart.Total <= 0 {
		return model.ShoppingCart{}, errors.New("ukupna cena mora biti veća od nule")
	}

	// TODO: Validate each tour exists and is not archived
	// This will be implemented when we add tour service communication

	return cart, nil
}