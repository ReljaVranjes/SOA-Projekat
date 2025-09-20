package service

import (
	"errors"
	"stakeholders-service/model"
	"stakeholders-service/repo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetUserProfile(email string) (model.User, error) {
	user, err := repo.FindUserByEmail(email)
	if err != nil {
		return model.User{}, errors.New("korisnik nije pronađen")
	}

	user.Password = ""
	return user, nil
}

func UpdateUserProfile(email string, profileData model.User) (model.User, error) {
	updates := make(map[string]interface{})

	if profileData.FirstName != "" {
		updates["firstName"] = profileData.FirstName
	}
	if profileData.LastName != "" {
		updates["lastName"] = profileData.LastName
	}
	if profileData.ProfileImage != "" {
		updates["profileImage"] = profileData.ProfileImage
	}
	if profileData.Biography != "" {
		updates["biography"] = profileData.Biography
	}
	if profileData.Motto != "" {
		updates["motto"] = profileData.Motto
	}

	err := repo.UpdateUserProfile(email, updates)
	if err != nil {
		return model.User{}, errors.New("greška prilikom ažuriranja profila")
	}

	return GetUserProfile(email)
}

func UpdateUserLocation(email string, location model.Location) (model.User, error) {
	updates := make(map[string]interface{})
	updates["currentLocation"] = location

	err := repo.UpdateUserProfile(email, updates)
	if err != nil {
		return model.User{}, errors.New("greška prilikom ažuriranja lokacije")
	}

	return GetUserProfile(email)
}

func GetAllUsersForAdmin(userRole model.UserRole) ([]model.User, error) {
	if userRole != model.Admin {
		return nil, errors.New("pristup dozvoljen samo administratorima")
	}

	users, err := repo.GetAllUsers()
	if err != nil {
		return nil, errors.New("greaka prilikom dohvatanja korisnika")
	}

	for i := range users {
		users[i].Password = ""
	}

	return users, nil
}

func BlockUser(adminRole model.UserRole, userID string) error {
	if adminRole != model.Admin {
		return errors.New("pristup dozvoljen samo administratorima")
	}

	err := repo.UpdateUserStatus(userID, model.Blocked)
	if err != nil {
		return errors.New("greška prilikom blokiranje korisnika")
	}

	return nil
}

func UnblockUser(adminRole model.UserRole, userID string) error {
	if adminRole != model.Admin {
		return errors.New("pristup dozvoljen samo administratorima")
	}

	err := repo.UpdateUserStatus(userID, model.Active)
	if err != nil {
		return errors.New("greška prilikom odblokiranje korisnika")
	}

	return nil
}



func GetUserById(userID string) (model.User, error) {
	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return model.User{}, errors.New("neispravan ID format")
	}

	// Find user by ID
	user, err := repo.FindUserById(objectID)
	if err != nil {
		return model.User{}, errors.New("korisnik nije pronađen")
	}

	// Remove password for security
	user.Password = ""
	return user, nil
}