package service

import (
	"errors"
	"payment-service/model"
	"payment-service/repo"
)

func GetUserCart(userID string) (model.ShoppingCart, error) {
	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}
	return cart, nil
}

func AddTourToCart(userID, tourID, tourName string, price float64) (model.ShoppingCart, error) {
	if tourID == "" || tourName == "" || price <= 0 {
		return model.ShoppingCart{}, errors.New("neispravni podaci o turi")
	}

	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}

	item := model.OrderItem{
		TourID:   tourID,
		TourName: tourName,
		Price:    price,
	}

	cart.AddItem(item)

	err = repo.SaveCart(cart)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom čuvanja korpe")
	}

	return cart, nil
}

func RemoveTourFromCart(userID, tourID string) (model.ShoppingCart, error) {
	if tourID == "" {
		return model.ShoppingCart{}, errors.New("tour ID je obavezan")
	}

	cart, err := repo.GetCartByUserID(userID)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom dobavljanja korpe")
	}

	removed := cart.RemoveItem(tourID)
	if !removed {
		return model.ShoppingCart{}, errors.New("tura nije pronađena u korpi")
	}

	err = repo.SaveCart(cart)
	if err != nil {
		return model.ShoppingCart{}, errors.New("greška prilikom čuvanja korpe")
	}

	return cart, nil
}

func ClearUserCart(userID string) error {
	err := repo.ClearCart(userID)
	if err != nil {
		return errors.New("greška prilikom brisanja korpe")
	}
	return nil
}

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

	return cart, nil
}
