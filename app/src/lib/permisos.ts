import type { OrdenTrabajo, Rol, User } from "./types";

export type Permiso =
  | "clientes.escribir"
  | "ordenes.escribir"
  | "ordenes.eliminar"
  | "ordenes.asignar"
  | "repuestos.escribir"
  | "repuestos.stock"
  | "facturas.ver"
  | "facturas.escribir"
  | "facturas.cancelar"
  | "pagos.eliminar"
  | "auditoria.ver"
  | "usuarios.gestionar"
  | "reportes.ver";

const matriz: Record<Permiso, Rol[]> = {
  "clientes.escribir": ["admin", "recepcionista"],
  "ordenes.escribir": ["admin", "recepcionista"],
  "ordenes.eliminar": ["admin", "recepcionista"],
  "ordenes.asignar": ["admin", "recepcionista"],
  "repuestos.escribir": ["admin"],
  "repuestos.stock": ["admin"],
  "facturas.ver": ["admin", "recepcionista"],
  "facturas.escribir": ["admin", "recepcionista"],
  "facturas.cancelar": ["admin"],
  "pagos.eliminar": ["admin"],
  "auditoria.ver": ["admin"],
  "usuarios.gestionar": ["admin"],
  "reportes.ver": ["admin", "recepcionista"],
};

export function puede(rol: Rol | undefined, permiso: Permiso): boolean {
  if (!rol) return false;
  return matriz[permiso].includes(rol);
}

export function esAdministrador(rol: Rol | undefined): boolean {
  return rol === "admin";
}

export function esTecnico(rol: Rol | undefined): boolean {
  return rol === "tecnico";
}

export function puedeOperarOrden(user: User | null, orden: OrdenTrabajo): boolean {
  if (!user) return false;
  if (user.rol === "tecnico") {
    return orden.tecnico_id != null && orden.tecnico_id === user.id;
  }
  return puede(user.rol, "ordenes.escribir");
}
