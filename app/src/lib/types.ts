export interface User {
  id: number;
  email: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
  created_at: string;
  updated_at: string;
}

export interface Moto {
  id: number;
  cliente_id: number;
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  color: string;
  notas: string;
  created_at: string;
  updated_at: string;
}

export type OrdenEstado = "recibida" | "en_progreso" | "finalizada" | "cancelada";

export interface OrdenTrabajo {
  id: number;
  cliente_id: number;
  moto_id: number;
  descripcion: string;
  diagnostico: string;
  costo_mano_obra: number;
  estado: OrdenEstado;
  notas: string;
  created_at: string;
  updated_at: string;
}

export interface OrdenRepuesto {
  orden_id: number;
  repuesto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Repuesto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  descripcion: string;
  created_at: string;
  updated_at: string;
}

export type FacturaEstado = "pendiente" | "parcial" | "pagada" | "cancelada";

export interface Factura {
  id: number;
  orden_id: number;
  total: number;
  pagado: number;
  saldo: number;
  estado: FacturaEstado;
  vencimiento: string;
  notas: string;
  created_at: string;
  updated_at: string;
}

export interface Pago {
  id: number;
  factura_id: number;
  monto: number;
  metodo: string;
  notas: string;
  created_at: string;
}

export interface AlertaStock {
  repuesto_id: number;
  codigo: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
}

export const ORDEN_ESTADOS: OrdenEstado[] = [
  "recibida",
  "en_progreso",
  "finalizada",
  "cancelada",
];

export const FACTURA_ESTADOS: FacturaEstado[] = [
  "pendiente",
  "parcial",
  "pagada",
  "cancelada",
];

export const ORDEN_ESTADO_LABELS: Record<OrdenEstado, string> = {
  recibida: "Recibida",
  en_progreso: "En progreso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export const FACTURA_ESTADO_LABELS: Record<FacturaEstado, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagada: "Pagada",
  cancelada: "Cancelada",
};
