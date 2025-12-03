import { Client, Order, PaymentMethod, Referral, GalleryItem, GlobalConfig, Post, Challenge, Supply, Expense, ReturnRecord } from '../types';

export const mockClient: Client = {
  id: 'uuid-1',
  nombre_completo: 'Juan Pérez',
  email: 'juan@email.com',
  telefono: '3001234567',
  compras_totales: 5,
  descuento_activo: 15,
  cantidad_referidos: 3,
  codigo_referido: 'JUAN2024',
  nivel: 'VIP',
  ahorro_historico: 52125,
  compras_para_siguiente: 4,
  progreso_porcentaje: 80,
  // Financial Summary Data
  total_invertido: 523000,
  promedio_por_pedido: 104600,
  saldos_pendientes: 54550,
  ahorro_descuentos: 52125,
  porcentaje_ahorro: 15
};

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    numero_seguimiento: '123456',
    nombre_producto: 'Pikachu 25cm',
    estado: 'En proceso',
    fecha_solicitud: '2025-11-20',
    total_final: 104550,
    monto_pagado: 50000,
    saldo_pendiente: 54550,
    imagen_url: 'https://picsum.photos/200/200?random=1',
    descripcion: 'Pikachu con gorra de detective',
    desglose: {
      precio_base: 85000,
      empaque: 10000,
      accesorios: 28000,
      descuento: 18450
    }
  },
  {
    id: 'ord-2',
    numero_seguimiento: '123455',
    nombre_producto: 'Bulbasaur 30cm',
    estado: 'Entregado',
    fecha_solicitud: '2025-11-15',
    fecha_entrega: '2025-11-18',
    total_final: 92000,
    monto_pagado: 92000,
    saldo_pendiente: 0,
    imagen_url: 'https://picsum.photos/200/200?random=2',
    descripcion: 'Bulbasaur clásico',
    desglose: {
      precio_base: 92000,
      empaque: 0,
      accesorios: 0,
      descuento: 0
    },
    puede_reordenar: true,
    puede_calificar: true
  },
  // Extra orders for charts
  {
    id: 'ord-3',
    numero_seguimiento: '123457',
    nombre_producto: 'Virgen María',
    estado: 'Entregado',
    fecha_solicitud: '2025-10-10',
    total_final: 150000,
    monto_pagado: 150000,
    saldo_pendiente: 0,
    imagen_url: 'https://picsum.photos/200/200?random=3',
    descripcion: 'Regalo Primera Comunión',
    desglose: { precio_base: 150000, empaque: 0, accesorios: 0, descuento: 0 }
  },
  {
    id: 'ord-4',
    numero_seguimiento: '123458',
    nombre_producto: 'Harry Potter Kit',
    estado: 'Entregado',
    fecha_solicitud: '2025-10-25',
    total_final: 200000,
    monto_pagado: 200000,
    saldo_pendiente: 0,
    imagen_url: 'https://picsum.photos/200/200?random=4',
    descripcion: 'Colección Completa',
    desglose: { precio_base: 200000, empaque: 0, accesorios: 0, descuento: 0 }
  }
];

export const mockPaymentMethods: PaymentMethod[] = [
  { 
    id: 'nequi_1', 
    tipo: 'Nequi', 
    numero: '3124915127', 
    titular: 'Puntadas de Mechis', 
    activo: true,
    icono: '📱'
  },
  { 
    id: 'breb', 
    tipo: 'Llave Bre-B', 
    numero: '@BPDVR648', 
    titular: 'Transferencia o QR', 
    activo: true,
    icono: '🔑'
  },
  { 
    id: 'bold', 
    tipo: 'Bold Link de Pago', 
    numero: 'LNK_EXBI7L6EK8', 
    titular: 'Pago Online Seguro',
    url_pago: 'https://checkout.bold.co/payment/LNK_EXBI7L6EK8', 
    activo: true,
    icono: '🌐',
    instrucciones: 'Pago automático con tarjeta débito/crédito'
  },
];

export const mockReferrals: Referral[] = [
  { nombre: 'María López', compras: 1, estado: 'Activo', fecha_registro: '2025-10-15', descuento_otorgado: true },
  { nombre: 'Carlos Ruiz', compras: 2, estado: 'Activo', fecha_registro: '2025-09-20', descuento_otorgado: true },
  { nombre: 'Ana García', compras: 0, estado: 'Pendiente', fecha_registro: '2025-11-10', descuento_otorgado: false },
];

export const mockGallery: GalleryItem[] = [
  { id: 'gal-1', title: 'Pikachu Detective', description: '25cm, lana hipoalergénica', imageUrl: 'https://picsum.photos/600/600?random=20', price: 85000 },
  { id: 'gal-2', title: 'Muñeca Personalizada', description: '30cm, vestido removible', imageUrl: 'https://picsum.photos/600/600?random=21', price: 92000 },
  { id: 'gal-3', title: 'Kit Harry Potter', description: 'Colección mini 15cm', imageUrl: 'https://picsum.photos/600/600?random=22', price: 120000 },
];

export const mockGlobalConfig: GlobalConfig = {
  limite_pago_completo: 70000,
  abono_minimo_fijo: 50000,
  descuento_referido: 10
};

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    userId: 'u1',
    userName: 'Laura Teje',
    userAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    topic: 'Exhibición',
    imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80',
    description: '¡Miren lo hermoso que quedó mi pedido de Puntadas de Mechis! 💖 Es perfecto para mi sobrina.',
    likes: 24,
    likedBy: [],
    timestamp: 'Hace 2 horas'
  },
  {
    id: 'post-2',
    userId: 'u2',
    userName: 'Carlos Maker',
    topic: 'Reseña',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    description: 'La calidad es increíble. Recomiendo totalmente el empaque premium.',
    likes: 15,
    likedBy: [],
    timestamp: 'Hace 5 horas'
  }
];

export const mockChallenges: Challenge[] = [
  {
    id: 'ch-1',
    title: 'El Reto del Grinch',
    description: 'Teje o adquiere un amigurumi navideño antes del 20 de Diciembre. Sube tu foto y gana un cupón.',
    imageUrl: 'https://images.unsplash.com/photo-1607513543116-2244265492d5?auto=format&fit=crop&w=600&q=80',
    startDate: '2025-11-15',
    endDate: '2025-12-20',
    difficulty: 'Intermedio',
    reward: '15% Descuento',
    participants: 120,
    status: 'active'
  },
  {
    id: 'ch-2',
    title: 'Colección Harry Potter',
    description: 'Completa los 3 personajes principales de la saga.',
    imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=600&q=80',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    difficulty: 'Fácil',
    reward: 'Llavero Gratis',
    participants: 340,
    status: 'completed'
  },
  {
    id: 'ch-3',
    title: 'San Valentín Creativo',
    description: 'Prepárate para febrero. Diseña tu propio corazón amigurumi.',
    imageUrl: 'https://images.unsplash.com/photo-1516149893016-813d9a01d521?auto=format&fit=crop&w=600&q=80',
    startDate: '2026-01-15',
    endDate: '2026-02-14',
    difficulty: 'Fácil',
    reward: 'Envío Gratis',
    participants: 0,
    status: 'upcoming'
  }
];

export const mockSupplies: Supply[] = [
  {
    id: 'sup-1',
    name: 'Lana Algodón Hipoalergénica',
    reference: 'REF-LANA-001',
    unitValue: 12500,
    quantity: 15,
    color: 'Amarillo Pollito',
    number: '3.5mm',
    lowStockThreshold: 5
  },
  {
    id: 'sup-2',
    name: 'Ojos de Seguridad',
    reference: 'REF-OJOS-10MM',
    unitValue: 500,
    quantity: 4, 
    color: 'Negro',
    number: '10mm',
    lowStockThreshold: 10
  },
  {
    id: 'sup-3',
    name: 'Relleno Siliconado',
    reference: 'REF-RELL-1KG',
    unitValue: 25000,
    quantity: 8,
    color: 'Blanco',
    number: 'N/A',
    lowStockThreshold: 3
  }
];

// NEW MOCK DATA FOR ACCOUNTING
export const mockExpenses: Expense[] = [
  { id: 'ex-1', date: '2025-11-01', category: 'materiales', description: 'Compra Lanas Panamericana', amount: 150000, provider: 'Panamericana' },
  { id: 'ex-2', date: '2025-11-05', category: 'empaques', description: 'Cajas de cartón x50', amount: 80000, provider: 'Empaques Bogotá' },
  { id: 'ex-3', date: '2025-11-10', category: 'servicios', description: 'Pago Luz Taller', amount: 120000, provider: 'Enel' },
  { id: 'ex-4', date: '2025-10-15', category: 'materiales', description: 'Relleno siliconado 10kg', amount: 95000, provider: 'Textiles Uno' },
  { id: 'ex-5', date: '2025-10-20', category: 'otros', description: 'Publicidad Instagram', amount: 50000, provider: 'Meta' },
];

export const mockReturns: ReturnRecord[] = [
  { id: 'ret-1', date: '2025-09-15', clientName: 'Marta Díaz', productName: 'Oso Perezoso', reason: 'Tamaño incorrecto', amount: 65000, status: 'Cambio de Producto' },
  { id: 'ret-2', date: '2025-10-02', clientName: 'Pedro Gil', productName: 'Llavero Goku', reason: 'Defecto en costura', amount: 15000, status: 'Reembolsado' }
];
