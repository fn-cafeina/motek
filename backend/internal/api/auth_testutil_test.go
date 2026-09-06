package api

import (
	"testing"

	"motek/internal/auth"
)

func hashForTest(password string) (string, error) {
	return auth.HashPassword(password)
}

func issueTokenForTest(t *testing.T, email string) string {
	t.Helper()
	user, _, err := testServer.Store.GetUserByEmail(t.Context(), email)
	if err != nil {
		t.Fatal(err)
	}
	token, err := testServer.Auth.Generate(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	testUserToken = token
	return token
}
