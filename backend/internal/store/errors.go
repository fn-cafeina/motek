package store

import (
	"database/sql"
	"strings"

	"github.com/go-sql-driver/mysql"
)

func isDuplicate(err error) bool {
	if mysqlErr, ok := err.(*mysql.MySQLError); ok {
		return mysqlErr.Number == 1062
	}
	return false
}

func isFKViolation(err error) bool {
	if mysqlErr, ok := err.(*mysql.MySQLError); ok {
		return mysqlErr.Number == 1451 || mysqlErr.Number == 1452
	}
	return false
}

type NotFoundError struct {
	Message string
}

func (e *NotFoundError) Error() string { return e.Message }

func NotFound(msg string) *NotFoundError { return &NotFoundError{Message: msg} }

type ConflictError struct {
	Message string
}

func (e *ConflictError) Error() string { return e.Message }

func Conflict(msg string) *ConflictError { return &ConflictError{Message: msg} }

func mapNotFound(err error, msg string) error {
	if err == sql.ErrNoRows {
		return NotFound(msg)
	}
	return err
}

func buildWhere(conds []string) string {
	if len(conds) == 0 {
		return ""
	}
	return " WHERE " + strings.Join(conds, " AND ")
}