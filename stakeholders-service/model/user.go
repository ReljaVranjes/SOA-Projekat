package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Username     string             `bson:"username" json:"username"`
	Email        string             `bson:"email" json:"email"`
	Password     string             `bson:"password" json:"password"` // hashed
	Role         string             `bson:"role" json:"role"`         // npr. "vodic" ili "turista"
	FirstName    string             `bson:"firstName" json:"firstName"`
	LastName     string             `bson:"lastName" json:"lastName"`
	ProfileImage string             `bson:"profileImage" json:"profileImage"`
	Biography    string             `bson:"biography" json:"biography"`
	Motto        string             `bson:"motto" json:"motto"`
}
