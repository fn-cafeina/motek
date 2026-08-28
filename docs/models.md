# Modelos (Structs Go)

Ver [schema.md](schema.md) para el schema de base de datos correspondiente.

---

## Fase 1: Core

```go
type Cliente struct {
    ID        int64  `json:"id"`
    Nombre    string `json:"nombre"`
    Telefono  string `json:"telefono"`
    Email     string `json:"email"`
    Direccion string `json:"direccion"`
    Notas     string `json:"notas"`
    CreadoEn  string `json:"creado_en"`
}

type Moto struct {
    ID          int64  `json:"id"`
    ClienteID   int64  `json:"cliente_id"`
    Marca       string `json:"marca"`
    Modelo      string `json:"modelo"`
    Anio        int    `json:"anio"`
    Placa       string `json:"placa"`
    Color       string `json:"color"`
    VIN         string `json:"vin"`
    Kilometraje int    `json:"kilometraje"`
    CreadoEn    string `json:"creado_en"`
}

type OrdenTrabajo struct {
    ID             int64  `json:"id"`
    ClienteID      int64  `json:"cliente_id"`
    MotoID         int64  `json:"moto_id"`
    Descripcion    string `json:"descripcion"`
    Diagnostico    string `json:"diagnostico"`
    Estado         string `json:"estado"`
    FechaRecibido  string `json:"fecha_recibido"`
    FechaEntrega   string `json:"fecha_entrega"`
    TotalManoObra  int64  `json:"total_mano_obra"`
    Notas          string `json:"notas"`
    CreadoEn       string `json:"creado_en"`
    ActualizadoEn  string `json:"actualizado_en"`
}
```

---

## Fase 2: Inventario

```go
type Repuesto struct {
    ID             int64  `json:"id"`
    Codigo         string `json:"codigo"`
    Nombre         string `json:"nombre"`
    Descripcion    string `json:"descripcion"`
    Categoria      string `json:"categoria"`
    PrecioCompra   int64  `json:"precio_compra"`
    PrecioVenta    int64  `json:"precio_venta"`
    Stock          int    `json:"stock"`
    StockMinimo    int    `json:"stock_minimo"`
    Ubicacion      string `json:"ubicacion"`
    CreadoEn       string `json:"creado_en"`
    ActualizadoEn  string `json:"actualizado_en"`
}

type OrdenRepuesto struct {
    ID             int64  `json:"id"`
    OrdenID        int64  `json:"orden_id"`
    RepuestoID     int64  `json:"repuesto_id"`
    Cantidad       int    `json:"cantidad"`
    PrecioUnitario int64  `json:"precio_unitario"`
    Subtotal       int64  `json:"subtotal"`
}
```

---

## Fase 3: Facturación

```go
type Factura struct {
    ID                  int64  `json:"id"`
    OrdenID             int64  `json:"orden_id"`
    Numero              string `json:"numero"`
    SubtotalManoObra    int64  `json:"subtotal_mano_obra"`
    SubtotalRepuestos   int64  `json:"subtotal_repuestos"`
    Total               int64  `json:"total"`
    Estado              string `json:"estado"`
    FechaEmision        string `json:"fecha_emision"`
    FechaVencimiento    string `json:"fecha_vencimiento"`
    Notas               string `json:"notas"`
    CreadoEn            string `json:"creado_en"`
    ActualizadoEn       string `json:"actualizado_en"`
}

type Pago struct {
    ID         int64  `json:"id"`
    FacturaID  int64  `json:"factura_id"`
    Monto      int64  `json:"monto"`
    Metodo     string `json:"metodo"`
    Fecha      string `json:"fecha"`
    Notas      string `json:"notas"`
    CreadoEn   string `json:"creado_en"`
}
```

---

## Fase 4: Agenda

```go
type Cita struct {
    ID            int64  `json:"id"`
    ClienteID     int64  `json:"cliente_id"`
    MotoID        int64  `json:"moto_id"`
    OrdenID       *int64 `json:"orden_id"` // opcional
    Titulo        string `json:"titulo"`
    FechaInicio   string `json:"fecha_inicio"`
    FechaFin      string `json:"fecha_fin"`
    Estado        string `json:"estado"`
    Notas         string `json:"notas"`
    CreadoEn      string `json:"creado_en"`
    ActualizadoEn string `json:"actualizado_en"`
}
```
