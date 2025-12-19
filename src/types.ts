export interface Client {
  id: string;
  nombre_completo: string;
  cedula?: string; // New
  direccion?: string; // New
  email: string;
  password?: string; // New (for mock auth)
  telefono?: string;
  compras_totales: number;
  descuento_activo: number;
  cantidad_referidos: number;
  codigo_referido: string;
  nivel: 'Nuevo' | 'Frecuente' | 'VIP';
  ahorro_historico: number;
  compras_para_siguiente: number;
  progreso_porcentaje: number;
  total_invertido: number;
  promedio_por_pedido: number;
  saldos_pendientes: number;
  ahorro_descuentos: number;
  porcentaje_ahorro: number;
}

export interface Order {
  id: string;
  numero_seguimiento: string;
  clientEmail: string;
  nombre_producto: string;
  descripcion: string;
  estado: 'En espera de agendar' | 'Agendado' | 'En proceso' | 'Listo para entregar' | 'Entregado' | 'Cancelado';
  fecha_solicitud: string;
  total_final: number;
  monto_pagado: number;
  saldo_pendiente: number;
  imagen_url: string;
  final_image_url?: string;
  guia_transportadora?: string;
  desglose: any;
}

export interface PaymentMethod {
  id: string;
  tipo: string;
  numero: string;
  titular?: string;
  url_pago?: string;
  activo: boolean;
  icono?: string;
  instrucciones?: string;
}

export interface Referral {
  nombre: string;
  compras: number;
  estado: 'Activo' | 'Pendiente';
  fecha_registro: string;
  descuento_otorgado: boolean;
}

// New Types for Dynamic Management
export interface InventoryItem {
  id: string;
  category: 'sizes' | 'packaging' | 'accessories';
  label: string;
  price: number;
}

export interface ProductConfig {
  sizes: InventoryItem[];
  packaging: InventoryItem[];
  accessories: InventoryItem[];
}

export interface GlobalConfig {
  limite_pago_completo: number;
  abono_minimo_fijo: number;
  descuento_referido: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price?: number;
  category?: string;  // ⬅️ NUEVO
}

// New Content Management Types
export interface Tejedora {
  id: string;
  nombre: string;
  especialidad: string;
  imageUrl: string;
}

// 🆕 ACTUALIZADO
export interface HomeConfig {
  heroImage1: string;
  heroImage2: string;
  // 🆕 Imágenes adicionales para las tarjetas
  cardImage3?: string;
  cardImage4?: string;
  cardImage5?: string;
  // 🆕 Precios de las tarjetas
  cardPrice1?: string;
  cardPrice2?: string;
  cardPrice3?: string;
  cardPrice4?: string;
}

// Community & Challenges Types
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  topic?: string; // New: Post Topic/Category
  imageUrl: string;
  description: string;
  likes: number;
  likedBy: string[]; // List of user emails who liked
  timestamp: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  reward: string;
  participants: number;
  status: 'upcoming' | 'active' | 'completed';
}

// Raw Materials / Supplies Type
export interface Supply {
  id: string;
  name: string;
  reference: string;
  unitValue: number; // Costo unitario
  quantity: number;
  color: string;
  number: string; // Calibre o número de lote
  lowStockThreshold: number; // Cantidad mínima para alerta
  imageUrl?: string;
}

// Accounting Types
export interface Expense {
  id: string;
  date: string;
  category: 'materiales' | 'empaques' | 'servicios' | 'otros';
  description: string;
  amount: number;
  provider: string;
}

export interface ReturnRecord {
  id: string;
  date: string;
  clientName: string;
  productName: string;
  reason: string;
  amount: number;
  status: 'Reembolsado' | 'Cambio de Producto';
}

// Default fallback config (if DB is empty)
export const DEFAULT_CONFIG: ProductConfig = {
  sizes: [
    { id: 'sz1', category: 'sizes', label: '15cm - Mini', price: 65000 },
    { id: 'sz2', category: 'sizes', label: '20cm - Pequeño', price: 72000 },
    { id: 'sz3', category: 'sizes', label: '25cm - Mediano', price: 85000 },
    { id: 'sz4', category: 'sizes', label: '30cm - Grande', price: 92000 },
    { id: 'sz5', category: 'sizes', label: '35cm - Extra', price: 102000 },
  ],
  packaging: [
    { id: 'pk1', category: 'packaging', label: 'Bolsa Papel (Básico)', price: 3000 },
    { id: 'pk2', category: 'packaging', label: 'Caja Cartón F (Básico Plus)', price: 4500 },
    { id: 'pk3', category: 'packaging', label: 'Caja Cartón G (Estándar)', price: 10000 },
    { id: 'pk4', category: 'packaging', label: 'Madera Pequeña (Premium)', price: 15000 },
  ],
  accessories: [
    { id: 'ac1', category: 'accessories', label: 'Corona', price: 8000 },
    { id: 'ac2', category: 'accessories', label: 'Denario', price: 16000 },
    { id: 'ac3', category: 'accessories', label: 'Base', price: 12000 },
    { id: 'ac4', category: 'accessories', label: 'Luz LED', price: 5000 },
  ]
};