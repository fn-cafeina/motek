package main

import "time"

type User struct {
	ID       int64     `json:"id"`
	Email    string    `json:"email"`
	Password string    `json:"-"`
	CreadoEn time.Time `json:"creado_en"`
}

type Cliente struct {
	ID        int64     `json:"id"`
	Nombre    string    `json:"nombre"`
	Telefono  string    `json:"telefono"`
	Email     string    `json:"email"`
	Direccion string    `json:"direccion"`
	Notas     string    `json:"notas"`
	CreadoEn  time.Time `json:"creado_en"`
}

type Moto struct {
	ID          int64     `json:"id"`
	ClienteID   int64     `json:"cliente_id"`
	Marca       string    `json:"marca"`
	Modelo      string    `json:"modelo"`
	Anio        int       `json:"anio"`
	Placa       string    `json:"placa"`
	Color       string    `json:"color"`
	VIN         string    `json:"vin"`
	Kilometraje int       `json:"kilometraje"`
	CreadoEn    time.Time `json:"creado_en"`
}

type OrdenTrabajo struct {
	ID            int64      `json:"id"`
	ClienteID     int64      `json:"cliente_id"`
	MotoID        int64      `json:"moto_id"`
	Descripcion   string     `json:"descripcion"`
	Diagnostico   string     `json:"diagnostico"`
	Estado        string     `json:"estado"`
	FechaRecibido time.Time  `json:"fecha_recibido"`
	FechaEntrega  *time.Time `json:"fecha_entrega"`
	TotalManoObra int64      `json:"total_mano_obra"`
	Notas         string     `json:"notas"`
	CreadoEn      time.Time  `json:"creado_en"`
	ActualizadoEn time.Time  `json:"actualizado_en"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
