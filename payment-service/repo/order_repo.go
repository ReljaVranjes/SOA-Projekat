package repo

import (
	"context"
	"payment-service/config"
	"payment-service/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const OrderCollection = "orders"

// CreateOrder creates a new order
func CreateOrder(order model.Order) (model.Order, error) {
	collection := config.DB.Collection(OrderCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.InsertOne(ctx, order)
	if err != nil {
		return model.Order{}, err
	}

	order.ID = result.InsertedID.(primitive.ObjectID)
	return order, nil
}

// GetOrderByID retrieves order by ID
func GetOrderByID(orderID string) (model.Order, error) {
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return model.Order{}, err
	}

	collection := config.DB.Collection(OrderCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var order model.Order
	filter := bson.M{"_id": objectID}
	err = collection.FindOne(ctx, filter).Decode(&order)
	return order, err
}

// GetOrdersByUserID retrieves all orders for a user
func GetOrdersByUserID(userID string) ([]model.Order, error) {
	collection := config.DB.Collection(OrderCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []model.Order
	err = cursor.All(ctx, &orders)
	return orders, err
}

// UpdateOrderStatus updates order status
func UpdateOrderStatus(orderID string, status model.OrderStatus) error {
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return err
	}

	collection := config.DB.Collection(OrderCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": time.Now(),
		},
	}

	_, err = collection.UpdateOne(ctx, filter, update)
	return err
}

// DeleteOrder removes an order (for rollback purposes)
func DeleteOrder(orderID string) error {
	objectID, err := primitive.ObjectIDFromHex(orderID)
	if err != nil {
		return err
	}

	collection := config.DB.Collection(OrderCollection)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"_id": objectID}
	_, err = collection.DeleteOne(ctx, filter)
	return err
}
