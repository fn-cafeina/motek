export type Rol = "admin" | "recepcionista" | "tecnico";

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
  creado_en: string;
}

export interface Moto {
  id: number;
  cliente_id: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string;
  vin: string;
  kilometraje: number;
  creado_en: string;
}

export type OrdenEstado =
  | "recibido"
  | "en_progreso"
  | "esperando_repuestos"
  | "terminado"
  | "entregado";

export interface OrdenTrabajo {
  id: number;
  cliente_id: number;
  moto_id: number;
  tecnico_id: number | null;
  descripcion: string;
  diagnostico: string;
  estado: OrdenEstado;
  fecha_recibido: string;
  fecha_entrega: string | null;
  total_mano_obra: number;
  notas: string;
  creado_en: string;
  actualizado_en: string;
}

export interface OrdenRepuesto {
  id: number;
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
  descripcion: string;
  categoria: string;
  ubicacion: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  creado_en: string;
  actualizado_en: string;
}

export type FacturaEstado = "pendiente" | "parcial" | "pagada" | "cancelada";

export interface Factura {
  id: number;
  orden_id: number;
  subtotal_mano_obra: number;
  subtotal_repuestos: number;
  total: number;
  estado: FacturaEstado;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  notas: string;
  creado_en: string;
  actualizado_en: string;
}

export interface Pago {
  id: number;
  factura_id: number;
  monto: number;
  metodo: string;
  fecha: string;
  notas: string;
  creado_en: string;
}

export interface AlertaStock {
  id?: number;
  repuesto_id?: number;
  codigo: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
}

export interface ConteoEstado {
  estado: OrdenEstado;
  cantidad: number;
}

export interface SerieMensual {
  mes: string;
  total: number;
}

export interface TopRepuesto {
  id: number;
  codigo: string;
  nombre: string;
  unidades: number;
  monto: number;
}

export interface RankingTecnico {
  id: number;
  nombre: string;
  ordenes: number;
  facturado: number;
}

export interface ResumenTablero {
  ordenes_por_estado: ConteoEstado[];
  facturacion_mensual: SerieMensual[];
  ingresos_mensuales: SerieMensual[];
  top_repuestos: TopRepuesto[];
  ranking_tecnicos: RankingTecnico[];
  saldo_por_cobrar: number;
  facturas_sin_cobrar: number;
}

export type AuditoriaAccion = "crear" | "editar" | "borrar";

export interface AuditoriaItem {
  id: number;
  usuario_id: number | null;
  usuario_nombre: string;
  usuario_email: string;
  tabla: string;
  registro_id: number;
  accion: AuditoriaAccion;
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  fecha: string;
}

export const ORDEN_ESTADOS: OrdenEstado[] = [
  "recibido",
  "en_progreso",
  "esperando_repuestos",
  "terminado",
  "entregado",
];

export const FACTURA_ESTADOS: FacturaEstado[] = [
  "pendiente",
  "parcial",
  "pagada",
  "cancelada",
];

export const ORDEN_ESTADO_LABELS: Record<OrdenEstado, string> = {
  recibido: "Recibido",
  en_progreso: "En progreso",
  esperando_repuestos: "Esperando repuestos",
  terminado: "Terminado",
  entregado: "Entregado",
};

export const FACTURA_ESTADO_LABELS: Record<FacturaEstado, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagada: "Pagada",
  cancelada: "Cancelada",
};
