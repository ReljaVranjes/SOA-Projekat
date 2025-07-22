package service

import (
	"errors"
	"stakeholders-service/model"
	"stakeholders-service/repo"
)

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