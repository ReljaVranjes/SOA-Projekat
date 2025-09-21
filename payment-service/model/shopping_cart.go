package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type OrderItem struct {
	TourID   string  `bson:"tourId" json:"tourId"`
	TourName string  `bson:"tourName" json:"tourName"`
	Price    float64 `bson:"price" json:"price"`
}

type ShoppingCart struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string             `bson:"userId" json:"userId"`
	Items     []OrderItem        `bson:"items" json:"items"`
	Total     float64            `bson:"total" json:"total"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// CalculateTotal recalculates the total price of all items in cart
func (c *ShoppingCart) CalculateTotal() {
	total := 0.0
	for _, item := range c.Items {
		total += item.Price
	}
	c.Total = total
	c.UpdatedAt = time.Now()
}

// AddItem adds a tour to the cart or updates existing item
func (c *ShoppingCart) AddItem(item OrderItem) {
	// Check if item already exists
	for i, existingItem := range c.Items {
		if existingItem.TourID == item.TourID {
			// Update existing item (in case price changed)
			c.Items[i] = item
			c.CalculateTotal()
			return
		}
	}
	
	// Add new item
	c.Items = append(c.Items, item)
	c.CalculateTotal()
}

// RemoveItem removes a tour from the cart
func (c *ShoppingCart) RemoveItem(tourID string) bool {
	for i, item := range c.Items {
		if item.TourID == tourID {
			// Remove item from slice
			c.Items = append(c.Items[:i], c.Items[i+1:]...)
			c.CalculateTotal()
			return true
		}
	}
	return false
}

// Clear removes all items from cart
func (c *ShoppingCart) Clear() {
	c.Items = []OrderItem{}
	c.Total = 0.0
	c.UpdatedAt = time.Now()
}

// IsEmpty checks if cart has no items
func (c *ShoppingCart) IsEmpty() bool {
	return len(c.Items) == 0
}