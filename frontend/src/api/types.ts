export type User = {
  id: number
  email: string
  creado_en: string
}

export type Cliente = {
  id: number
  nombre: string
  telefono: string
  email: string
  direccion: string
  notas: string
  creado_en: string
}

export type Moto = {
  id: number
  cliente_id: number
  marca: string
  modelo: string
  anio: number
  placa: string
  color: string
  vin: string
  kilometraje: number
  creado_en: string
}

export type OrdenTrabajo = {
  id: number
  cliente_id: number
  moto_id: number
  descripcion: string
  diagnostico: string
  estado: string
  fecha_recibido: string
  fecha_entrega: string | null
  total_mano_obra: number
  notas: string
  creado_en: string
  actualizado_en: string
}

export type Repuesto = {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  categoria: string
  precio_compra: number
  precio_venta: number
  stock: number
  stock_minimo: number
  ubicacion: string
  creado_en: string
  actualizado_en: string
}

export type OrdenRepuesto = {
  id: number
  orden_id: number
  repuesto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type Factura = {
  id: number
  orden_id: number
  subtotal_mano_obra: number
  subtotal_repuestos: number
  total: number
  estado: string
  fecha_emision: string
  fecha_vencimiento: string | null
  notas: string
  creado_en: string
  actualizado_en: string
}

export type Pago = {
  id: number
  factura_id: number
  monto: number
  metodo: string
  fecha: string
  notas: string
  creado_en: string
}
