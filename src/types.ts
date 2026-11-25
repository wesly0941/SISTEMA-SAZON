export const RUBROS_FIJOS = [
  'Proteínas',
  'Condimentos y Especias',
  'Víveres',
  'Verduras y Vegetales',
  'Lácteos',
  'Bebidas',
] as const;

export type RubroFijo = (typeof RUBROS_FIJOS)[number];

export type UserRole = 'cocina' | 'supervisor' | 'cliente';

export interface CurrentUser {
  nombre: string;
  role: UserRole;
}

export interface SystemUser {
  id: number;
  usuario: string;
  password: string;
  rol: 'cocina' | 'supervisor';
}

export interface Client {
  id: number;
  nombre: string;
  clave_portal?: string | null;
}

export interface ClientAsset {
  id: number;
  cliente: string;
  nombre_bien: string;
  codigo_serial?: string | null;
  cantidad: number;
  estado: string;
  observacion?: string | null;
  fecha_asignacion?: string | null;
}

export interface InventoryItem {
  id: number;
  rubro: string;
  producto: string;
  unidad: string;
  stock: number;
  stockMin: number;
}

export interface ServedDish {
  id: number;
  fecha_full: string;
  fecha_limpia: string;
  hora?: string | null;
  tipo: string;
  nombre: string;
  cliente: string;
  cantidad: number;
  foto_url: string;
  pagado: boolean;
}

export interface DailyConsumption {
  id: number;
  fecha: string;
  fecha_limpia: string;
  producto: string;
  rubro: string;
  cantidad: number;
  unidad: string;
}

export interface Employee {
  id: number;
  cedula: string;
  nombre: string;
  cargo: string;
  sueldoMensual: number;
  banco: string;
  telefono: string;
}

export interface AttendanceRecord {
  id?: number;
  cedula: string;
  fecha: string;
  presente: boolean;
}

export interface PayrollPayment {
  id?: number;
  clave_pago: string;
  cedula: string;
  mes: string;
  quincena: 'Q1' | 'Q2' | string;
  pagado: boolean;
  montoUSD: number;
  montoBS: number;
  tasaCambio: number;
  diasPagados: number;
  fecha_pago?: string;
}

export type ActiveSection =
  | 'secComidas'
  | 'secInsumosCocina'
  | 'secDiarioCocina'
  | 'secNominaCocina'
  | 'secDashboardSup'
  | 'secUsuariosSup'
  | 'secClientesSup'
  | 'secBienesSup'
  | 'secInventarioSup'
  | 'secPreciosPlatos'
  | 'secReportesCocina'
  | 'secPdfReportes'
  | 'secNominaSup'
  | 'secPortalClienteDeuda'
  | 'secPortalClienteBienes';
