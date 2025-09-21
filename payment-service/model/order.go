package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderStatus string

const (
	OrderPending   OrderStatus = "PENDING"
	OrderCompleted OrderStatus = "COMPLETED"
	OrderFailed    OrderStatus = "FAILED"
)

type Order struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string             `bson:"userId" json:"userId"`
	Items     []OrderItem        `bson:"items" json:"items"`
	Total     float64            `bson:"total" json:"total"`
	Status    OrderStatus        `bson:"status" json:"status"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// NewOrder creates a new order from shopping cart
func NewOrder(userID string, cart ShoppingCart) Order {
	now := time.Now()
	return Order{
		UserID:    userID,
		Items:     cart.Items,
		Total:     cart.Total,
		Status:    OrderPending,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// MarkCompleted marks order as completed
func (o *Order) MarkCompleted() {
	o.Status = OrderCompleted
	o.UpdatedAt = time.Now()
}

// MarkFailed marks order as failed
func (o *Order) MarkFailed() {
	o.Status = OrderFailed
	o.UpdatedAt = time.Now()
}