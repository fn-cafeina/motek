// Comando de seed para desarrollo y demos.
//
//	go run ./cmd/seed             crea los usuarios demo si faltan
//	go run ./cmd/seed -datos      ademas genera datos de negocio de ejemplo
//	go run ./cmd/seed -reset -datos  borra los datos de negocio y los regenera
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log/slog"
	"math/rand/v2"
	"os"
	"time"

	"github.com/joho/godotenv"

	"motek/internal/auth"
	"motek/internal/config"
	"motek/internal/store"
)

func main() {
	datos := flag.Bool("datos", false, "genera datos de demo (clientes, motos, ordenes, facturas y pagos)")
	reset := flag.Bool("reset", false, "borra los datos de negocio antes de sembrar")
	flag.Parse()

	logger := slog.Default()

	if err := godotenv.Load(); err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			logger.Warn(".env no encontrado, se usan las variables del entorno")
		} else {
			logger.Error("no se pudo cargar .env", "error", err)
			os.Exit(1)
		}
	}

	cfg := config.FromEnv()
	st, err := store.Open(cfg)
	if err != nil {
		logger.Error("no se pudo abrir la base de datos", "error", err)
		os.Exit(1)
	}
	defer st.Close()

	ctx := context.Background()

	if err := seedUsuarios(ctx, st); err != nil {
		logger.Error("sembrando usuarios", "error", err)
		os.Exit(1)
	}

	if *reset {
		if err := borrarDatosDeNegocio(ctx, st); err != nil {
			logger.Error("borrando datos de negocio", "error", err)
			os.Exit(1)
		}
		fmt.Println("datos de negocio eliminados")
	}

	if *datos {
		if err := seedDatos(ctx, st); err != nil {
			logger.Error("sembrando datos de demo", "error", err)
			os.Exit(1)
		}
	}

	fmt.Println("listo")
}

func seedUsuarios(ctx context.Context, st *store.Store) error {
	demo := []struct {
		email, nombre, rol, password string
	}{
		{"admin@motek.local", "Admin Motek", "admin", "admin123"},
		{"recepcion@motek.local", "Sofia Ramirez", "recepcionista", "recepcion123"},
		{"tecnico@motek.local", "Lucas Fernandez", "tecnico", "tecnico123"},
		{"tecnico2@motek.local", "Maria Gomez", "tecnico", "tecnico123"},
	}
	for _, u := range demo {
		if _, _, err := st.GetUserByEmail(ctx, u.email); err == nil {
			fmt.Printf("%-24s ya existe\n", u.email)
			continue
		} else {
			var nf *store.NotFoundError
			if !errors.As(err, &nf) {
				return err
			}
		}
		hash, err := auth.HashPassword(u.password)
		if err != nil {
			return err
		}
		if _, err := st.CreateUser(ctx, u.email, u.nombre, hash, u.rol); err != nil {
			return err
		}
		fmt.Printf("%-24s rol=%-13s password=%s\n", u.email, u.rol, u.password)
	}
	return nil
}

func borrarDatosDeNegocio(ctx context.Context, st *store.Store) error {
	tablas := []string{"pagos", "facturas", "orden_repuestos", "repuestos", "ordenes_trabajo", "motos", "clientes"}
	for _, tabla := range tablas {
		if _, err := st.DB.ExecContext(ctx, "DELETE FROM "+tabla); err != nil {
			return fmt.Errorf("borrando %s: %w", tabla, err)
		}
	}
	return nil
}

func seedDatos(ctx context.Context, st *store.Store) error {
	var existentes int
	if err := st.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM clientes").Scan(&existentes); err != nil {
		return err
	}
	if existentes > 0 {
		fmt.Println("ya hay clientes cargados; usa -reset -datos para regenerar")
		return nil
	}

	rng := rand.New(rand.NewPCG(42, 7))
	ahora := time.Now()

	tecnicos, err := st.ListUsuarios(ctx, "tecnico")
	if err != nil {
		return err
	}

	repuestos := []struct {
		codigo, nombre, categoria    string
		compra, venta, stock, minimo int
	}{
		{"FR-101", "Pastillas de freno delanteras", "Frenos", 8500, 14500, 24, 6},
		{"FR-102", "Pastillas de freno traseras", "Frenos", 7200, 12500, 18, 6},
		{"FR-110", "Kit de reparacion de caliper", "Frenos", 15000, 24000, 8, 4},
		{"MO-201", "Filtro de aceite", "Motor", 3200, 6500, 40, 10},
		{"MO-202", "Kit de juntas de motor", "Motor", 22000, 36000, 6, 3},
		{"MO-210", "Bujia iridium", "Motor", 4800, 8900, 32, 8},
		{"TR-301", "Kit de transmision", "Transmision", 38000, 58000, 12, 4},
		{"TR-302", "Cadena 428H x 120", "Transmision", 12000, 19500, 15, 5},
		{"EL-401", "Bateria 12V 8Ah", "Electrico", 42000, 63000, 9, 4},
		{"EL-402", "Regulador de voltaje", "Electrico", 18000, 29000, 7, 3},
		{"CU-501", "Cubierta 110/90-17", "Cubiertas", 55000, 82000, 10, 4},
		{"CU-502", "Camara 275/300-17", "Cubiertas", 6800, 11500, 22, 8},
	}
	repuestoIDs := make([]int64, 0, len(repuestos))
	repuestoPrecios := make([]int, 0, len(repuestos))
	for _, r := range repuestos {
		id, err := insertar(ctx, st,
			"INSERT INTO repuestos (codigo, nombre, categoria, precio_compra, precio_venta, stock, stock_minimo, ubicacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			r.codigo, r.nombre, r.categoria, r.compra, r.venta, r.stock, r.minimo, "Estante "+r.codigo[:2])
		if err != nil {
			return err
		}
		repuestoIDs = append(repuestoIDs, id)
		repuestoPrecios = append(repuestoPrecios, r.venta)
	}
	// dos repuestos por debajo del minimo para que la pantalla de alertas tenga contenido
	if _, err := st.DB.ExecContext(ctx, "UPDATE repuestos SET stock = 2 WHERE id = ?", repuestoIDs[3]); err != nil {
		return err
	}
	if _, err := st.DB.ExecContext(ctx, "UPDATE repuestos SET stock = 1 WHERE id = ?", repuestoIDs[8]); err != nil {
		return err
	}

	nombres := []string{
		"Juan Perez", "Maria Gonzalez", "Carlos Rodriguez", "Lucia Fernandez", "Diego Lopez",
		"Ana Martinez", "Pablo Garcia", "Sofia Diaz", "Martin Sanchez", "Valentina Romero",
		"Lucas Sosa", "Camila Torres", "Nicolas Ruiz", "Florencia Benitez", "Federico Acosta",
		"Julieta Medina", "Gonzalo Herrera", "Agustina Silva", "Matias Rojas", "Milagros Castro",
		"Sebastian Vargas", "Brenda Ortiz", "Emiliano Nunez", "Rocio Molina", "Tomas Peralta",
		"Micaela Aguirre", "Ivan Cabrera", "Antonella Reyes", "Facundo Godoy", "Josefina Luna",
	}
	motosCatalogo := [][2]string{
		{"Honda", "CB 190R"}, {"Yamaha", "FZ25"}, {"Zanella", "RX 150"}, {"Motomel", "Skua 150"},
		{"Bajaj", "Rouser NS 200"}, {"Honda", "Titan 150"}, {"Yamaha", "XTZ 150"}, {"KTM", "Duke 200"},
		{"Honda", "XRE 300"}, {"Corven", "Triax 250"},
	}
	colores := []string{"Negro", "Rojo", "Azul", "Blanco", "Gris", "Verde"}

	type motoRef struct {
		clienteID, motoID int64
	}
	motos := make([]motoRef, 0, len(nombres)*2)

	for i, nombre := range nombres {
		clienteID, err := insertar(ctx, st,
			"INSERT INTO clientes (nombre, telefono, email, direccion, notas) VALUES (?, ?, ?, ?, '')",
			nombre,
			fmt.Sprintf("351%07d", 2000000+rng.IntN(7999999)),
			fmt.Sprintf("cliente%d@correo.com", i+1),
			fmt.Sprintf("%s %d", []string{"Av. Colon", "Belgrano", "San Jeronimo", "Av. Velez Sarsfield", "Caseros", "Independencia", "Av. Rafael Nunez", "Duarte Quiros"}[i%8], 100+rng.IntN(1900)))
		if err != nil {
			return err
		}
		for j := 0; j < 1+rng.IntN(2); j++ {
			cat := motosCatalogo[rng.IntN(len(motosCatalogo))]
			motoID, err := insertar(ctx, st,
				"INSERT INTO motos (cliente_id, marca, modelo, anio, placa, color, vin, kilometraje) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				clienteID, cat[0], cat[1], 2015+rng.IntN(11),
				fmt.Sprintf("%c%c%03d%c%c", 'A'+rng.IntN(26), 'A'+rng.IntN(26), rng.IntN(1000), 'A'+rng.IntN(26), 'A'+rng.IntN(26)),
				colores[rng.IntN(len(colores))],
				fmt.Sprintf("VIN%09d", rng.IntN(1000000000)),
				800+rng.IntN(60000))
			if err != nil {
				return err
			}
			motos = append(motos, motoRef{clienteID: clienteID, motoID: motoID})
		}
	}

	descripciones := []string{
		"Service completo de 10.000 km",
		"Cambio de aceite y filtro",
		"Revision general de frenos",
		"Ajuste y lubricacion de cadena",
		"Diagnostico de falla electrica",
		"Cambio de cubierta y camara trasera",
		"Carburacion y puesta a punto",
		"Reparacion de motor: junta de tapa",
		"Cambio de kit de transmision",
		"Cambio de bateria y revision de carga",
	}
	diagnosticos := []string{
		"Se detecto desgaste prematuro; se recomienda repuesto original.",
		"Revision completada, sin observaciones adicionales.",
		"Falla intermitente; se reviso el circuito de carga.",
		"Pendiente de repuestos encargados al proveedor.",
	}
	estados := make([]string, 0, 60)
	estados = append(estados, "recibido", "recibido", "recibido", "recibido")
	estados = append(estados, "en_progreso", "en_progreso", "en_progreso", "en_progreso", "en_progreso", "en_progreso")
	estados = append(estados, "esperando_repuestos", "esperando_repuestos", "esperando_repuestos", "esperando_repuestos")
	for i := 0; i < 8; i++ {
		estados = append(estados, "terminado")
	}
	for i := 0; i < 38; i++ {
		estados = append(estados, "entregado")
	}

	var ordenesCreadas, facturasCreadas, pagosCreados int

	for i := 0; i < len(estados); i++ {
		m := motos[rng.IntN(len(motos))]
		estado := estados[i]

		var diasAtras int
		switch estado {
		case "entregado":
			diasAtras = 90 + rng.IntN(91)
		case "terminado":
			diasAtras = 30 + rng.IntN(70)
		case "esperando_repuestos", "en_progreso":
			diasAtras = 3 + rng.IntN(38)
		default:
			diasAtras = rng.IntN(10)
		}
		fecha := ahora.AddDate(0, 0, -diasAtras).Add(time.Duration(rng.IntN(9)) * time.Hour)

		var tecnicoID *int64
		if len(tecnicos) > 0 && estado != "recibido" && rng.IntN(10) < 7 {
			id := tecnicos[rng.IntN(len(tecnicos))].ID
			tecnicoID = &id
		}

		descripcion := descripciones[rng.IntN(len(descripciones))]
		diagnostico := ""
		if estado != "recibido" && rng.IntN(10) < 6 {
			diagnostico = diagnosticos[rng.IntN(len(diagnosticos))]
		}
		manoObra := (3 + rng.IntN(10)) * 5000

		var fechaEntrega *time.Time
		if estado == "entregado" {
			t := fecha.AddDate(0, 0, 2+rng.IntN(11))
			if t.After(ahora) {
				t = ahora
			}
			fechaEntrega = &t
		}

		ordenID, err := insertar(ctx, st,
			"INSERT INTO ordenes_trabajo (cliente_id, moto_id, tecnico_id, descripcion, diagnostico, estado, fecha_recibido, fecha_entrega, total_mano_obra, notas, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)",
			m.clienteID, m.motoID, tecnicoID, descripcion, diagnostico, estado, fecha, fechaEntrega, manoObra, fecha, fecha)
		if err != nil {
			return err
		}
		ordenesCreadas++

		totalRepuestos := 0
		nLineas := 0
		if rng.IntN(10) < 6 {
			nLineas = 1 + rng.IntN(3)
		}
		perm := rng.Perm(len(repuestoIDs))
		for k := 0; k < nLineas; k++ {
			idx := perm[k]
			cantidad := 1 + rng.IntN(3)
			subtotal := repuestoPrecios[idx] * cantidad
			totalRepuestos += subtotal
			if _, err := insertar(ctx, st,
				"INSERT INTO orden_repuestos (orden_id, repuesto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)",
				ordenID, repuestoIDs[idx], cantidad, repuestoPrecios[idx], subtotal); err != nil {
				return err
			}
		}

		if estado != "terminado" && estado != "entregado" {
			continue
		}
		if rng.IntN(10) >= 8 {
			continue
		}

		fechaEmision := fecha.AddDate(0, 0, 1+rng.IntN(6))
		if fechaEmision.After(ahora) {
			fechaEmision = ahora
		}
		total := int64(manoObra + totalRepuestos)

		roll := rng.IntN(100)
		estadoFactura := "pendiente"
		var montoPago int64
		switch {
		case roll < 10:
			estadoFactura = "pendiente"
		case roll < 35:
			estadoFactura = "parcial"
			montoPago = total / 2
		case roll < 95:
			estadoFactura = "pagada"
			montoPago = total
		default:
			estadoFactura = "cancelada"
		}

		facturaID, err := insertar(ctx, st,
			"INSERT INTO facturas (orden_id, subtotal_mano_obra, subtotal_repuestos, total, estado, fecha_emision, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			ordenID, manoObra, totalRepuestos, total, estadoFactura, fechaEmision, fechaEmision, fechaEmision)
		if err != nil {
			return err
		}
		facturasCreadas++

		if montoPago > 0 {
			fechaPago := fechaEmision.AddDate(0, 0, rng.IntN(15))
			if fechaPago.After(ahora) {
				fechaPago = ahora
			}
			metodo := []string{"efectivo", "transferencia", "tarjeta"}[rng.IntN(3)]
			if _, err := insertar(ctx, st,
				"INSERT INTO pagos (factura_id, monto, metodo, fecha, notas, creado_en) VALUES (?, ?, ?, ?, '', ?)",
				facturaID, montoPago, metodo, fechaPago, fechaPago); err != nil {
				return err
			}
			pagosCreados++
		}
	}

	fmt.Printf("generados: %d clientes, %d motos, %d repuestos, %d ordenes, %d facturas, %d pagos\n",
		len(nombres), len(motos), len(repuestos), ordenesCreadas, facturasCreadas, pagosCreados)
	return nil
}

func insertar(ctx context.Context, st *store.Store, query string, args ...any) (int64, error) {
	res, err := st.DB.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}
