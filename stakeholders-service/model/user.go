package model

import (
	"encoding/json"
	"errors"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRole string

const (
	Admin   UserRole = "Admin"
	Tourist UserRole = "Tourist"
	Guide   UserRole = "Guide"
)

type UserStatus string

const (
	Active  UserStatus = "Active"
	Blocked UserStatus = "Blocked"
)

func (r *UserRole) UnmarshalJSON(data []byte) error {
	var role string
	if err := json.Unmarshal(data, &role); err != nil {
		return err
	}

	switch UserRole(role) {
	case Admin, Tourist, Guide:
		*r = UserRole(role)
		return nil
	default:
		return errors.New("neispravna uloga: dozvoljene su samo Admin, Tourist, Guide")
	}
}

func (s *UserStatus) UnmarshalJSON(data []byte) error {
	var status string
	if err := json.Unmarshal(data, &status); err != nil {
		return err
	}

	switch UserStatus(status) {
	case Active, Blocked:
		*s = UserStatus(status)
		return nil
	default:
		return errors.New("neispravan status: dozvoljeni su samo Active, Blocked")
	}
}

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Username     string             `bson:"username" json:"username"`
	Email        string             `bson:"email" json:"email"`
	Password     string             `bson:"password" json:"password"` // hashed
	Role         UserRole           `bson:"role" json:"role"`
	Status       UserStatus         `bson:"status" json:"status"`
	FirstName    string             `bson:"firstName" json:"firstName"`
	LastName     string             `bson:"lastName" json:"lastName"`
	ProfileImage string             `bson:"profileImage" json:"profileImage"`
	Biography    string             `bson:"biography" json:"biography"`
	Motto        string             `bson:"motto" json:"motto"`
}
