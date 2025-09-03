package service

import (
	"errors"
	"stakeholders-service/model"
	"stakeholders-service/repo"
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
