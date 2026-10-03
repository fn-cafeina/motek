package store

import "context"

type ConteoEstado struct {
	Estado   string `json:"estado"`
	Cantidad int64  `json:"cantidad"`
}

type SerieMensual struct {
	Mes   string `json:"mes"`
	Total int64  `json:"total"`
}

type TopRepuesto struct {
	ID       int64  `json:"id"`
	Codigo   string `json:"codigo"`
	Nombre   string `json:"nombre"`
	Unidades int64  `json:"unidades"`
	Monto    int64  `json:"monto"`
}

type RankingTecnico struct {
	ID        int64  `json:"id"`
	Nombre    string `json:"nombre"`
	Ordenes   int64  `json:"ordenes"`
	Facturado int64  `json:"facturado"`
}

type ResumenTablero struct {
	OrdenesPorEstado   []ConteoEstado   `json:"ordenes_por_estado"`
	FacturacionMensual []SerieMensual   `json:"facturacion_mensual"`
	IngresosMensuales  []SerieMensual   `json:"ingresos_mensuales"`
	TopRepuestos       []TopRepuesto    `json:"top_repuestos"`
	RankingTecnicos    []RankingTecnico `json:"ranking_tecnicos"`
	SaldoPorCobrar     int64            `json:"saldo_por_cobrar"`
	FacturasSinCobrar  int64            `json:"facturas_sin_cobrar"`
}

const ultimosSeisMeses = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m')"

func (s *Store) ResumenTablero(ctx context.Context) (ResumenTablero, error) {
	res := ResumenTablero{
		OrdenesPorEstado:   make([]ConteoEstado, 0),
		FacturacionMensual: make([]SerieMensual, 0),
		IngresosMensuales:  make([]SerieMensual, 0),
		TopRepuestos:       make([]TopRepuesto, 0),
		RankingTecnicos:    make([]RankingTecnico, 0),
	}

	rows, err := s.DB.QueryContext(ctx, "SELECT estado, cantidad FROM v_ordenes_estado")
	if err != nil {
		return ResumenTablero{}, err
	}
	for rows.Next() {
		var c ConteoEstado
		if err := rows.Scan(&c.Estado, &c.Cantidad); err != nil {
			rows.Close()
			return ResumenTablero{}, err
		}
		res.OrdenesPorEstado = append(res.OrdenesPorEstado, c)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return ResumenTablero{}, err
	}
	rows.Close()

	res.FacturacionMensual, err = s.serieMensual(ctx, "SELECT mes, total FROM v_facturacion_mensual WHERE mes >= "+ultimosSeisMeses+" ORDER BY mes")
	if err != nil {
		return ResumenTablero{}, err
	}
	res.IngresosMensuales, err = s.serieMensual(ctx, "SELECT mes, total FROM v_ingresos_mensuales WHERE mes >= "+ultimosSeisMeses+" ORDER BY mes")
	if err != nil {
		return ResumenTablero{}, err
	}

	rows, err = s.DB.QueryContext(ctx,
		"SELECT id, codigo, nombre, unidades, monto FROM v_top_repuestos ORDER BY unidades DESC LIMIT 5")
	if err != nil {
		return ResumenTablero{}, err
	}
	for rows.Next() {
		var t TopRepuesto
		if err := rows.Scan(&t.ID, &t.Codigo, &t.Nombre, &t.Unidades, &t.Monto); err != nil {
			rows.Close()
			return ResumenTablero{}, err
		}
		res.TopRepuestos = append(res.TopRepuestos, t)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return ResumenTablero{}, err
	}
	rows.Close()

	rows, err = s.DB.QueryContext(ctx,
		"SELECT id, nombre, ordenes, facturado FROM v_ranking_tecnicos ORDER BY facturado DESC, ordenes DESC")
	if err != nil {
		return ResumenTablero{}, err
	}
	for rows.Next() {
		var r RankingTecnico
		if err := rows.Scan(&r.ID, &r.Nombre, &r.Ordenes, &r.Facturado); err != nil {
			rows.Close()
			return ResumenTablero{}, err
		}
		res.RankingTecnicos = append(res.RankingTecnicos, r)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return ResumenTablero{}, err
	}
	rows.Close()

	row := s.DB.QueryRowContext(ctx, `SELECT
		COALESCE(SUM(f.total - COALESCE(p.pagado, 0)), 0),
		COALESCE(SUM(CASE WHEN f.total > COALESCE(p.pagado, 0) THEN 1 ELSE 0 END), 0)
		FROM facturas f
		LEFT JOIN (SELECT factura_id, SUM(monto) AS pagado FROM pagos GROUP BY factura_id) p ON p.factura_id = f.id
		WHERE f.estado <> 'cancelada'`)
	if err := row.Scan(&res.SaldoPorCobrar, &res.FacturasSinCobrar); err != nil {
		return ResumenTablero{}, err
	}

	return res, nil
}

func (s *Store) serieMensual(ctx context.Context, query string) ([]SerieMensual, error) {
	out := make([]SerieMensual, 0)
	rows, err := s.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var serie SerieMensual
		if err := rows.Scan(&serie.Mes, &serie.Total); err != nil {
			return nil, err
		}
		out = append(out, serie)
	}
	return out, rows.Err()
}
