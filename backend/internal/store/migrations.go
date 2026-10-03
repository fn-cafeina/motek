package store

import (
	"embed"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Las migraciones se separan con una linea que contiene exactamente "-- ;;"
// porque los cuerpos de los triggers contienen punto y coma internos.
const stmtSeparator = "-- ;;"

func (s *Store) Migrate() error {
	if _, err := s.DB.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version INT PRIMARY KEY,
		nombre VARCHAR(255) NOT NULL,
		aplicado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`); err != nil {
		return fmt.Errorf("creando schema_migrations: %w", err)
	}

	applied := map[int]bool{}
	rows, err := s.DB.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("leyendo schema_migrations: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var version int
		if err := rows.Scan(&version); err != nil {
			return err
		}
		applied[version] = true
	}
	if err := rows.Err(); err != nil {
		return err
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("leyendo migraciones: %w", err)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		version, nombre, err := parseMigrationName(entry.Name())
		if err != nil {
			return err
		}
		if applied[version] {
			continue
		}
		data, err := migrationsFS.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("leyendo %s: %w", entry.Name(), err)
		}
		if err := s.applyMigration(version, nombre, string(data)); err != nil {
			return fmt.Errorf("migracion %s: %w", entry.Name(), err)
		}
	}

	return nil
}

func (s *Store) applyMigration(version int, nombre, contenido string) error {
	stmts := splitStatements(contenido)
	for i, stmt := range stmts {
		if _, err := s.DB.Exec(stmt); err != nil {
			return fmt.Errorf("sentencia %d: %w", i+1, err)
		}
	}
	_, err := s.DB.Exec("INSERT INTO schema_migrations (version, nombre) VALUES (?, ?)", version, nombre)
	return err
}

func parseMigrationName(name string) (int, string, error) {
	base, ok := strings.CutSuffix(name, ".sql")
	if !ok {
		return 0, "", fmt.Errorf("migracion %q: se espera extension .sql", name)
	}
	versionStr, nombre, ok := strings.Cut(base, "_")
	if !ok {
		return 0, "", fmt.Errorf("migracion %q: se espera formato 0000_nombre.sql", name)
	}
	version, err := strconv.Atoi(versionStr)
	if err != nil {
		return 0, "", fmt.Errorf("migracion %q: version invalida: %w", name, err)
	}
	return version, nombre, nil
}

func splitStatements(contenido string) []string {
	var stmts []string
	for _, part := range strings.Split(contenido, stmtSeparator) {
		if !hasSQL(part) {
			continue
		}
		stmts = append(stmts, strings.TrimSpace(part))
	}
	return stmts
}

func hasSQL(part string) bool {
	for _, line := range strings.Split(part, "\n") {
		line = strings.TrimSpace(line)
		if line != "" && !strings.HasPrefix(line, "--") {
			return true
		}
	}
	return false
}
