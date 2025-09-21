package repo

import (
	"context"
	"payment-service/config"
	"payment-service/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const CartCollection = "shopping_carts"

// GetCartByUserID retrieves user's shopping cart
func GetCartByUserID(userID string) (model.ShoppingCart, error) {
	collection := config.DB.Collection(CartCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var cart model.ShoppingCart
	filter := bson.M{"userId": userID}
	err := collection.FindOne(ctx, filter).Decode(&cart)

	if err == mongo.ErrNoDocuments {
		// Create new cart if none exists
		cart = model.ShoppingCart{
			UserID:    userID,
			Items:     []model.OrderItem{},
			Total:     0.0,
			UpdatedAt: time.Now(),
		}
		return cart, nil
	}

	return cart, err
}

// SaveCart saves or updates shopping cart
func SaveCart(cart model.ShoppingCart) error {
	collection := config.DB.Collection(CartCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cart.UpdatedAt = time.Now()

	filter := bson.M{"userId": cart.UserID}
	update := bson.M{"$set": cart}
	opts := options.Update().SetUpsert(true)

	_, err := collection.UpdateOne(ctx, filter, update, opts)
	return err
}

// DeleteCart removes user's shopping cart
func DeleteCart(userID string) error {
	collection := config.DB.Collection(CartCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID}
	_, err := collection.DeleteOne(ctx, filter)
	return err
}

// ClearCart removes all items from user's cart but keeps the cart document
func ClearCart(userID string) error {
	collection := config.DB.Collection(CartCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID}
	update := bson.M{
		"$set": bson.M{
			"items":     []model.OrderItem{},
			"total":     0.0,
			"updatedAt": time.Now(),
		},
	}

	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}
