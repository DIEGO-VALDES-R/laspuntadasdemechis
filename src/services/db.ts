import { supabase } from '../lib/supabase';
import { Order, Client, InventoryItem, ProductConfig, GlobalConfig, GalleryItem, DEFAULT_CONFIG, Tejedora, HomeConfig, Post, Challenge, Supply, Expense, ReturnRecord, QuoteData, Testimonial, AmigurumiRecord, InsumoAmigurumi } from '../types';
import { getPublicImageUrl, extractStoragePath } from './imageHelpers';

// =====================================================
// MAPPING HELPERS (Database to TypeScript)
// =====================================================

const mapOrder = (o: any): Order => ({
  id: o.id,
  numero_seguimiento: o.numero_seguimiento,
  clientEmail: o.client_email,
  clientName: o.client_name || '',      // ✅ Agregar
  clientPhone: o.client_phone || '',    // ✅ Agregar
  nombre_producto: o.nombre_producto,
  estado: o.estado,
  fecha_solicitud: o.fecha_solicitud,
  fecha_entrega: o.fecha_entrega,
  total_final: o.total_final,
  monto_pagado: o.monto_pagado,
  saldo_pendiente: o.saldo_pendiente,
  imagen_url: o.imagen_url,
  final_image_url: o.final_image_url,
  descripcion: o.descripcion,
  desglose: o.desglose || { precio_base: 0, empaque: 0, accesorios: 0, descuento: 0 },
  guia_transportadora: o.guia_transportadora,
  puede_reordenar: o.puede_reordenar,
  puede_calificar: o.puede_calificar
});

const mapClient = (c: any): Client => ({
  id: c.id,
  nombre_completo: c.nombre_completo,
  email: c.email,
  telefono: c.telefono,
  cedula: c.cedula,
  direccion: c.direccion,
  password: c.password,
  compras_totales: c.compras_totales || 0,
  descuento_activo: c.descuento_activo || 0,
  cantidad_referidos: c.cantidad_referidos || 0,
  codigo_referido: c.codigo_referido,
  nivel: c.nivel || 'Nuevo',
  total_invertido: c.total_invertido || 0,
  saldos_pendientes: c.saldos_pendientes || 0,
  ahorro_historico: c.ahorro_historico || 0,
  compras_para_siguiente: c.compras_para_siguiente || 5,
  progreso_porcentaje: c.progreso_porcentaje || 0,
  promedio_por_pedido: c.promedio_por_pedido || 0,
  ahorro_descuentos: c.ahorro_descuentos || 0,
  porcentaje_ahorro: c.porcentaje_ahorro || 0
});

const mapSupply = (s: any): Supply => ({
  id: s.id,
  name: s.name,
  reference: s.reference,
  unitValue: s.unit_value,
  quantity: s.quantity,
  color: s.color,
  number: s.number,
  lowStockThreshold: s.low_stock_threshold,
  imageUrl: s.image_url
});

const mapExpense = (e: any): Expense => ({
  id: e.id,
  date: e.date,
  category: e.category,
  description: e.description,
  amount: e.amount,
  provider: e.provider
});

const mapReturn = (r: any): ReturnRecord => ({
  id: r.id,
  date: r.date,
  clientName: r.client_name,
  productName: r.product_name,
  reason: r.reason,
  amount: r.amount,
  status: r.status
});

// ✅ MAPEO MEJORADO CON imagePath y category adicional
const mapGallery = (g: any): GalleryItem => {
  // 🆕 USAR EL PATH ORIGINAL, NO EXTRAER
  const imagePath = g.image_url || '';
  const publicUrl = getPublicImageUrl(imagePath, 'gallery');
  
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    imageUrl: publicUrl, // URL completa
    imagePath: imagePath, // 🔧 Path original sin modificar
    category: g.category || 'Sin categoría',
    price: g.price
  };
};

// ✅ CORRECCIÓN: Mapeamos image_url (BD) a imageUrl (TypeScript)
const mapTejedora = (t: any): Tejedora => ({
  id: t.id,
  nombre: t.nombre,
  especialidad: t.especialidad,
  imageUrl: getPublicImageUrl(t.image_url, 'gallery') // 🆕 Helper optimizado
});

const mapPost = (p: any): Post => ({
  id: p.id,
  userId: p.user_id,
  userName: p.user_name,
  userAvatar: p.user_avatar,
  topic: p.topic,
  imageUrl: getPublicImageUrl(p.image_url, 'gallery'), // 🆕 Helper optimizado
  description: p.description,
  likes: p.likes,
  likedBy: p.liked_by || [],
  timestamp: p.timestamp
});

const mapChallenge = (c: any): Challenge => ({
  id: c.id,
  title: c.title,
  description: c.description,
  imageUrl: getPublicImageUrl(c.image_url, 'gallery'), // 🆕 Helper optimizado
  startDate: c.start_date,
  endDate: c.end_date,
  difficulty: c.difficulty,
  reward: c.reward,
  participants: c.participants,
  status: c.status
});

const mapHomeConfig = (c: any): HomeConfig => ({
  heroImage1: getPublicImageUrl(c.hero_image1, 'gallery'),
  heroImage2: getPublicImageUrl(c.hero_image2, 'gallery'),
  cardImage3: getPublicImageUrl(c.card_image3, 'gallery'),
  cardImage4: getPublicImageUrl(c.card_image4, 'gallery'),
  cardImage5: getPublicImageUrl(c.card_image5, 'gallery'),
  cardImage6: getPublicImageUrl(c.card_image6, 'gallery'), // Nueva
  cardImage7: getPublicImageUrl(c.card_image7, 'gallery'), // Nueva
  cardImage8: getPublicImageUrl(c.card_image8, 'gallery'), // Nueva
  cardPrice1: c.card_price1,
  cardPrice2: c.card_price2,
  cardPrice3: c.card_price3,
  cardPrice4: c.card_price4,
  cardPrice5: c.card_price5,
  cardPrice6: c.card_price6,
  cardPrice7: c.card_price7
});

// =====================================================
// AGREGAR ESTA FUNCIÓN DE MAPEO AL INICIO (junto con las otras funciones map)
// =====================================================

const mapAmigurumiRecord = (a: any): AmigurumiRecord => ({
  id: a.id,
  nombre: a.nombre,
  insumos: a.insumos || [],
  fecha_actualizacion: a.fecha_actualizacion,
  created_at: a.created_at
});

// 🆕 FUNCIÓN AUXILIAR PARA CALCULAR EL TOTAL DE UNA COTIZACIÓN
function calculateQuoteTotal(quoteData: QuoteData, inventoryItems?: InventoryItem[]): number {
  let total = 0;
  
  if (quoteData.selectedSizeId && inventoryItems) {
    const size = inventoryItems.find(item => item.id === quoteData.selectedSizeId);
    if (size) {
      total = size.price;
    }
  } else if (quoteData.basePrice > 0) {
    total = quoteData.basePrice;
  }
  
  if (quoteData.selectedPackagingId && inventoryItems) {
    const packaging = inventoryItems.find(item => item.id === quoteData.selectedPackagingId);
    if (packaging) {
      total += packaging.price;
    }
  }
  
  if (quoteData.selectedAccessories && inventoryItems) {
    quoteData.selectedAccessories.forEach(accId => {
      const accessory = inventoryItems.find(item => item.id === accId);
      if (accessory) {
        total += accessory.price;
      }
    });
  }
  
  return total;
}

// =====================================================
// DATABASE SERVICE
// =====================================================

export const db = {
  // --- ORDERS ---
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    return (data || []).map(mapOrder);
  },

  addOrder: async (order: Omit<Order, 'id' | 'created_at'>) => {
  const { error } = await supabase.from('orders').insert({
    numero_seguimiento: order.numero_seguimiento,
    client_email: order.clientEmail,
    client_name: order.clientName,          // ✅ Agregar
    client_phone: order.clientPhone,        // ✅ Agregar
    nombre_producto: order.nombre_producto,
    estado: order.estado,
    fecha_solicitud: order.fecha_solicitud,
    total_final: order.total_final,
    monto_pagado: order.monto_pagado,
    saldo_pendiente: order.saldo_pendiente,
    imagen_url: order.imagen_url,
    final_image_url: order.final_image_url || null,
    descripcion: order.descripcion,
    desglose: order.desglose || { precio_base: 0, empaque: 0, accesorios: 0, descuento: 0 },
    guia_transportadora: order.guia_transportadora
  });
  
  if (error) console.error('Error adding order:', error);
},

  updateOrder: async (orderId: string, updates: Partial<Order>) => {
  const dbUpdates: any = {};
  if (updates.estado) dbUpdates.estado = updates.estado;
  if (updates.guia_transportadora) dbUpdates.guia_transportadora = updates.guia_transportadora;
  if (updates.saldo_pendiente !== undefined) dbUpdates.saldo_pendiente = updates.saldo_pendiente;
  if (updates.monto_pagado !== undefined) dbUpdates.monto_pagado = updates.monto_pagado;
  if (updates.final_image_url !== undefined) dbUpdates.final_image_url = updates.final_image_url;
  if (updates.fecha_entrega !== undefined) dbUpdates.fecha_entrega = updates.fecha_entrega;
  
  // ✅ Agregar estos dos campos
  if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
  if (updates.clientPhone !== undefined) dbUpdates.client_phone = updates.clientPhone;

  const { error } = await supabase
    .from('orders')
    .update(dbUpdates)
    .eq('id', orderId);

  if (error) console.error('Error updating order:', error);
},

  deleteOrder: async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    if (error) console.error('Error deleting order:', error);
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('numero_seguimiento', orderNumber)
      .single();
    
    if (error || !data) return null;
    return mapOrder(data);
  },

  getOrdersByEmail: async (email: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_email', email)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders by email:', error);
      return [];
    }
    return (data || []).map(mapOrder);
  },

  getOrdersByClientEmail: async (email: string): Promise<Order[]> => {
    console.log('🔍 Buscando pedidos para:', email);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al cargar pedidos:', error);
      return [];
    }

    if (!data) {
      console.log('ℹ️ No se encontraron pedidos para este cliente');
      return [];
    }

    console.log(`✅ ${data.length} pedidos encontrados`);
    return data.map(mapOrder);
  },

  getOrderByNumberAndEmail: async (orderNumber: string, email: string): Promise<Order | null> => {
    console.log('🔍 Buscando pedido:', orderNumber, 'para email:', email);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('numero_seguimiento', orderNumber)
      .eq('client_email', email)
      .single();
      
    if (error) {
      console.error('❌ Error:', error);
      return null;
    }
    
    if (!data) {
      console.log('ℹ️ Pedido no encontrado o email no coincide');
      return null;
    }
    
    console.log('✅ Pedido encontrado');
    return mapOrder(data);
  },

  // --- CLIENTS ---
  getAllClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return (data || []).map(mapClient);
  },

  getClientByEmail: async (email: string): Promise<Client | null> => {
    console.log('🔍 Buscando cliente:', email);
  
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('❌ Error al buscar cliente:', error);
        return null;
      }

      if (!data) {
        console.log('ℹ️ Cliente NO encontrado');
        return null;
      }

      console.log('✅ Cliente encontrado:', data.nombre_completo);
      return mapClient(data);
    } catch (error) {
      console.error('❌ Excepción al buscar cliente:', error);
      return null;
    }
  },

  registerClient: async (clientData: any) => {
    const code = (clientData.nombre_completo.substring(0,3) + Date.now().toString().substring(9)).toUpperCase();
  
    const { error } = await supabase.from('clients').insert({
      nombre_completo: clientData.nombre_completo,
      email: clientData.email,
      cedula: clientData.cedula,
      telefono: clientData.telefono,
      direccion: clientData.direccion,
      password: clientData.password,
      codigo_referido: code
    });
  
    if (error) {
      console.error('Error registering client:', error);
      throw error;
    }
  
    localStorage.setItem('puntadas_user', clientData.email);
    localStorage.setItem('puntadas_role', 'client');
  },

  deleteClient: async (clientId: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
  
    if (error) console.error('Error deleting client:', error);
  },

  updateClient: async (clientId: string, updates: Partial<Client>) => {
    const dbUpdates: any = {};
    if (updates.nombre_completo !== undefined) dbUpdates.nombre_completo = updates.nombre_completo;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono;
    if (updates.cedula !== undefined) dbUpdates.cedula = updates.cedula;
    if (updates.direccion !== undefined) dbUpdates.direccion = updates.direccion;
    if (updates.descuento_activo !== undefined) dbUpdates.descuento_activo = updates.descuento_activo;

    const { error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', clientId);

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // --- SUPPLIES ---
  getSupplies: async (): Promise<Supply[]> => {
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('name', { ascending: true });
  
    if (error) {
      console.error('Error fetching supplies:', error);
      return [];
    }
  
    return (data || []).map(s => ({
      id: s.id,
      name: s.name || '',
      reference: s.reference || '',
      unitValue: s.unit_value || 0,
      quantity: s.quantity || 0,
      color: s.color || '',
      number: s.number || '',
      lowStockThreshold: s.low_stock_threshold || 5,
      imageUrl: s.image_url || ''
    }));
  },

  addSupply: async (supply: Omit<Supply, 'id'>) => {
    const { error } = await supabase.from('supplies').insert({
      name: supply.name,
      reference: supply.reference,
      unit_value: supply.unitValue,
      quantity: supply.quantity,
      color: supply.color,
      number: supply.number,
      low_stock_threshold: supply.lowStockThreshold,
      image_url: supply.imageUrl 
    });
  
    if (error) console.error('Error adding supply:', error);
  },

  updateSupply: async (supply: Supply) => {
    const { error } = await supabase
      .from('supplies')
      .update({
        name: supply.name,
        reference: supply.reference,
        unit_value: supply.unitValue,
        quantity: supply.quantity,
        color: supply.color,
        number: supply.number,
        low_stock_threshold: supply.lowStockThreshold,
        image_url: supply.imageUrl 
      })
      .eq('id', supply.id);
  
    if (error) console.error('Error updating supply:', error);
  },

  deleteSupply: async (id: string) => {
    const { error } = await supabase
      .from('supplies')
      .delete()
      .eq('id', id);
  
    if (error) console.error('Error deleting supply:', error);
  },

  // --- EXPENSES ---
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
    return (data || []).map(mapExpense);
  },

  addExpense: async (expense: Omit<Expense, 'id'>) => {
    const { error } = await supabase.from('expenses').insert({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      provider: expense.provider
    });
    
    if (error) console.error('Error adding expense:', error);
  },

  // --- RETURNS ---
  getReturns: async (): Promise<ReturnRecord[]> => {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching returns:', error);
      return [];
    }
    return (data || []).map(mapReturn);
  },

  // --- INVENTORY (Product Config) ---
  getAllInventoryItems: async (): Promise<InventoryItem[]> => {
    return [...DEFAULT_CONFIG.sizes, ...DEFAULT_CONFIG.packaging, ...DEFAULT_CONFIG.accessories];
  },

  getInventory: async (): Promise<ProductConfig> => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('price', { ascending: true });
    
      if (error || !data || data.length === 0) {
        console.log('ℹ️ No hay inventario en BD, usando valores por defecto');
        return DEFAULT_CONFIG;
      }
    
      const sizes = data.filter(i => i.category === 'sizes').map(i => ({
        id: i.id,
        category: i.category as 'sizes',
        label: i.label,
        price: i.price
      }));
    
      const packaging = data.filter(i => i.category === 'packaging').map(i => ({
        id: i.id,
        category: i.category as 'packaging',
        label: i.label,
        price: i.price
      }));
    
      const accessories = data.filter(i => i.category === 'accessories').map(i => ({
        id: i.id,
        category: i.category as 'accessories',
        label: i.label,
        price: i.price
      }));
    
      console.log('✅ Inventario cargado:', { 
        sizes: sizes.length, 
        packaging: packaging.length, 
        accessories: accessories.length 
      });
    
      return { sizes, packaging, accessories };
    } catch (error) {
      console.error('❌ Error loading inventory:', error);
      return DEFAULT_CONFIG;
    }
  },

  getInventoryItems: async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('category', { ascending: true })
      .order('price', { ascending: true });
  
    if (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  
    return (data || []).map(item => ({
      id: item.id,
      category: item.category,
      label: item.label,
      price: item.price
    }));
  },

  addInventoryItem: async (item: Omit<InventoryItem, 'id'>) => {
    const { error } = await supabase.from('inventory_items').insert({
      category: item.category,
      label: item.label,
      price: item.price
    });
    
    if (error) console.error('Error adding inventory item:', error);
  },

  updateInventoryItem: async (item: InventoryItem) => {
    const { error } = await supabase
      .from('inventory_items')
      .update({
        category: item.category,
        label: item.label,
        price: item.price
      })
      .eq('id', item.id);
  
    if (error) console.error('Error updating inventory item:', error);
  },

  deleteInventoryItem: async (id: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
  
    if (error) console.error('Error deleting inventory item:', error);
  },

  // --- GALLERY ---
  // ⚡ FASE 1: MODIFICADO PARA PAGINACIÓN
  getGallery: async (page: number = 1, pageSize: number = 12) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase
      .from('gallery_items')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching gallery:', error);
      throw error;
    }
    
    // Mapeamos los datos para mantener consistencia de tipos (ahora incluye imagePath)
    return { 
      data: (data || []).map(mapGallery), 
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      totalItems: count || 0
    };
  },

  addGalleryItem: async (item: Omit<GalleryItem, 'id'>) => {
    const { error } = await supabase.from('gallery_items').insert({
      title: item.title,
      description: item.description,
      image_url: item.imageUrl,
      category: item.category,
      price: item.price
    });
    
    if (error) console.error('Error adding gallery item:', error);
  },

  updateGalleryItem: async (item: GalleryItem) => {
    const { error } = await supabase
      .from('gallery_items')
      .update({
        title: item.title,
        description: item.description,
        image_url: item.imageUrl,
        category: item.category,
        price: item.price
      })
      .eq('id', item.id);
    
    if (error) console.error('Error updating gallery item:', error);
  },

  deleteGalleryItem: async (id: string) => {
    const { error } = await supabase
      .from('gallery_items')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting gallery item:', error);
  },

  // --- CONFIG ---
  getConfig: async (): Promise<GlobalConfig> => {
    const { data, error } = await supabase
      .from('global_config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error || !data) {
      return {
        limite_pago_completo: 70000,
        abono_minimo_fijo: 50000,
        descuento_referido: 10
      };
    }
    
    return {
      limite_pago_completo: data.limite_pago_completo,
      abono_minimo_fijo: data.abono_minimo_fijo,
      descuento_referido: data.descuento_referido
    };
  },

  saveConfig: async (config: GlobalConfig) => {
    const { error } = await supabase
      .from('global_config')
      .update({
        limite_pago_completo: config.limite_pago_completo,
        abono_minimo_fijo: config.abono_minimo_fijo,
        descuento_referido: config.descuento_referido
      })
      .eq('id', 1);
    
    if (error) console.error('Error saving config:', error);
  },

  // --- HOME CONFIG ---
  saveHomeConfig: async (config: HomeConfig) => {
  try {
    const { data, error } = await supabase
      .from('home_config')
      .upsert({
        id: 1, 
        section_key: 'hero_section',
        hero_image1: config.heroImage1 || '',
        hero_image2: config.heroImage2 || '',
        card_image3: config.cardImage3 || '',
        card_image4: config.cardImage4 || '',
        card_image5: config.cardImage5 || '',
        card_image6: config.cardImage6 || '',
        card_image7: config.cardImage7 || '',
        card_image8: config.cardImage8 || '',
        card_price1: config.cardPrice1 || '$30.00',
        card_price2: config.cardPrice2 || '$27.00',
        card_price3: config.cardPrice3 || '$26.00',
        card_price4: config.cardPrice4 || '$25.00',
        card_price5: config.cardPrice5 || '$24.00', // Añadir esta
        card_price6: config.cardPrice6 || '$23.00', // Añadir esta
        card_price7: config.cardPrice7 || '$22.00', // Añadir esta
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    // ... resto del código


      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      console.log('✅ Guardado exitoso:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error saving home config:', error);
      return { data: null, error };
    }
  },

  getHomeConfig: async (): Promise<HomeConfig> => {
    try {
      console.log('📖 Cargando home config desde Supabase...');
      
      const { data, error } = await supabase
        .from('home_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { 
        console.error('❌ Error al cargar:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ No existe registro, creando uno por defecto...');
        const defaultConfig: HomeConfig = {
          heroImage1: '',
          heroImage2: '',
          cardImage3: '',
          cardImage4: '',
          cardImage5: '',
          cardImage6: '',
          cardImage7: '',
          cardImage8: '',
          cardPrice1: '$30.00',
          cardPrice2: '$27.00',
          cardPrice3: '$26.00',
          cardPrice4: '$25.00',
          cardPrice5: '$24.00',
          cardPrice6: '$23.00',
          cardPrice7: '$22.00',
        };
        await db.saveHomeConfig(defaultConfig);
        return defaultConfig;
      }

      const config: HomeConfig = {
        heroImage1: data.hero_image1 || '',
        heroImage2: data.hero_image2 || '',
        cardImage3: data.card_image3 || '',
        cardImage4: data.card_image4 || '',
        cardImage5: data.card_image5 || '',
        cardImage6: data.card_image6 || '',
        cardImage7: data.card_image7 || '',
        cardImage8: data.card_image8 || '',
        cardPrice1: data.card_price1 || '$30.00',
        cardPrice2: data.card_price2 || '$27.00',
        cardPrice3: data.card_price3 || '$26.00',
        cardPrice4: data.card_price4 || '$25.00',
        cardPrice5: data.card_price5 || '$24.00',
        cardPrice6: data.card_price6 || '$23.00',
        cardPrice7: data.card_price7 || '$22.00',
      };

      console.log('✅ Config cargada:', config);
      return config;
      
    } catch (error) {
      console.error('❌ Error loading home config:', error);
      return {
        heroImage1: '',
        heroImage2: '',
        cardImage3: '',
        cardImage4: '',
        cardImage5: '',
        cardImage6: '',
        cardImage7: '',
        cardImage8: '',
        cardPrice1: '$30.00',
        cardPrice2: '$27.00',
        cardPrice3: '$26.00',
        cardPrice4: '$25.00',
        cardPrice5: '$24.00',
        cardPrice6: '$23.00',
        cardPrice7: '$22.00',
      };
    }
  },

  // --- TEJEDORAS ---
  getTejedoras: async (): Promise<Tejedora[]> => {
    const { data, error } = await supabase
      .from('tejedoras')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error fetching tejedoras:', error);
      return [];
    }
    return (data || []).map(mapTejedora);
  },

  // ✅ CORRECCIÓN CRÍTICA AQUÍ: Mapeamos t.imageUrl (TypeScript) a image_url (Supabase)
  saveTejedoras: async (tejedoras: Tejedora[]) => {
    try {
      console.log('💾 Guardando tejedoras en Supabase...');
      
      for (const t of tejedoras) {
        const { error } = await supabase.from('tejedoras').upsert({
          id: t.id,
          nombre: t.nombre,
          especialidad: t.especialidad,
          image_url: t.imageUrl // ✅ CORREGIDO: Se usa t.imageUrl
        });
        
        if (error) {
          console.error('❌ Error guardando tejedora individual:', t.nombre, error);
          throw error; // ✅ Propagar error
        }
      }
      console.log('✅ Tejedoras guardadas correctamente');
    } catch (error) {
      console.error('❌ Error en saveTejedoras:', error);
      throw error; // ✅ Propagar error
    }
  },

  deleteTejedora: async (id: string) => {
    try {
      console.log('🗑️ Eliminando tejedora de Supabase:', id);
      const { error } = await supabase
        .from('tejedoras')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error('❌ Error deleting tejedora:', error);
        throw error; // ✅ Propagar error
      }
    } catch (error) {
      console.error('❌ Error en deleteTejedora:', error);
      throw error;
    }
  },

  // --- POSTS ---
  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
    return (data || []).map(mapPost);
  },

  addPost: async (post: Omit<Post, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('posts').insert({
      user_id: post.userId,
      user_name: post.userName,
      user_avatar: post.userAvatar,
      topic: post.topic,
      image_url: post.imageUrl,
      description: post.description,
      likes: post.likes,
      liked_by: post.likedBy || [],
      timestamp: post.timestamp
    });
    
    if (error) {
      console.error('Error adding post:', error);
    }
  },

  updatePost: async (post: Post) => {
    const { error } = await supabase
      .from('posts')
      .update({
        topic: post.topic,
        image_url: post.imageUrl,
        description: post.description,
        user_name: post.userName
      })
      .eq('id', post.id);
    
    if (error) {
      console.error('Error updating post:', error);
    }
  },

  deletePost: async (id: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting post:', error);
    }
  },

  toggleLikePost: async (postId: string, userEmail: string): Promise<Post[]> => {
    const { data: current } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (!current) return db.getPosts();

    let likedBy = current.liked_by || [];
    let likes = current.likes || 0;

    if (likedBy.includes(userEmail)) {
      likedBy = likedBy.filter((e: string) => e !== userEmail);
      likes--;
    } else {
      likedBy.push(userEmail);
      likes++;
    }

    await supabase.from('posts').update({ likes, liked_by: likedBy }).eq('id', postId);
    return db.getPosts();
  },

  // --- CHALLENGES ---
  getChallenges: async (): Promise<Challenge[]> => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
    return (data || []).map(mapChallenge);
  },

  addChallenge: async (challenge: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase
      .from('challenges')
      .insert([{
        ...challenge,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error adding challenge:', error);
    }
  },

  updateChallenge: async (challenge: Challenge) => {
    const { error } = await supabase
      .from('challenges')
      .update({
        title: challenge.title,
        description: challenge.description,
        image_url: challenge.imageUrl,
        start_date: challenge.startDate,
        end_date: challenge.endDate,
        difficulty: challenge.difficulty,
        reward: challenge.reward,
        participants: challenge.participants,
        status: challenge.status
      })
      .eq('id', challenge.id);
    
    if (error) {
      console.error('Error updating challenge:', error);
    }
  },

  deleteChallenge: async (id: string) => {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting challenge:', error);
    }
  },

  // --- REFERRALS ---
  getAllReferrals: async (): Promise<any[]> => {
    try {
      console.log('🔄 Obteniendo referidos...');
      
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching referrals:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const referrerIds = [...new Set(data.map(r => r.referrer_id).filter(Boolean))];
      
      if (referrerIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, nombre_completo')
          .in('id', referrerIds)
          .order('nombre_completo', { ascending: true });
        
        const clientsMap = new Map(
          (clientsData || []).map(c => [c.id, c.nombre_completo])
        );
        
        return data.map(referral => ({
          ...referral,
          referredByName: clientsMap.get(referral.referrer_id) || 'N/A'
        }));
      }
      
      return data.map(r => ({ ...r, referredByName: 'N/A' }));
    } catch (error) {
      console.error('Error en getAllReferrals:', error);
      return [];
    }
  },

  getReferralsByReferrerId: async (referrerId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching referrals by referrer:', error);
      return [];
    }
    return data || [];
  },

  deleteReferral: async (id: string) => {
    const { error } = await supabase
      .from('referrals')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting referral:', error);
    }
  },

  updateReferral: async (referralId: string, updates: any) => {
    const { error } = await supabase
      .from('referrals')
      .update(updates)
      .eq('referrer_id', referralId);
    
    if (error) {
      console.error('Error updating referral:', error);
    }
  },

  addReferral: async (referral: any) => {
    const { error } = await supabase.from('referrals').insert(referral);
    
    if (error) {
      console.error('Error adding referral:', error);
    }
  },

  // ========== VALUE PROPS ==========
  getValueProps: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('value_props')
      .select('*')
      .order('order', { ascending: true });
    
    if (error) {
      console.error('Error fetching value props:', error);
      return [];
    }
    
    return data || [];
  },

  saveValueProp: async (prop: any): Promise<void> => {
    const { error } = await supabase
      .from('value_props')
      .insert([prop]);
    
    if (error) {
      console.error('Error saving value prop:', error);
    }
  },

  updateValueProp: async (id: string, updates: any): Promise<void> => {
    const { error } = await supabase
      .from('value_props')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating value prop:', error);
    }
  },

  deleteValueProp: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('value_props')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting value prop:', error);
    }
  },

  // ========== SITE STATS ==========
  getSiteStats: async (): Promise<any> => {
    const { data, error } = await supabase
      .from('site_stats')
      .select('*')
      .single();
    
    if (error) {
      return {
        amigurumiCount: 17,
        clientCount: 17,
        rating: 4.9,
        yearsExperience: 5
      };
    }
    
    return data;
  },

  updateSiteStats: async (stats: any): Promise<void> => {
    const { error } = await supabase
      .from('site_stats')
      .upsert([{ id: 1, ...stats }]);
    
    if (error) {
      console.error('Error updating site stats:', error);
    }
  },

  // ========== TESTIMONIALS ==========
  getActiveTestimonials: async (): Promise<Testimonial[]> => {
    try {
      console.log('🔄 Obteniendo testimonios activos...');
      
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching active testimonials:', error);
        throw error;
      }
      
      console.log('✅ Testimonios activos cargados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getActiveTestimonials:', error);
      return [];
    }
  },

  getAllTestimonials: async (): Promise<Testimonial[]> => {
    try {
      console.log('🔄 Obteniendo todos los testimonios...');
      
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching all testimonials:', error);
        throw error;
      }
      
      console.log('✅ Todos los testimonios cargados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllTestimonials:', error);
      return [];
    }
  },

  createTestimonial: async (testimonial: Omit<Testimonial, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('➕ Creando nuevo testimonio:', testimonial);
      
      const { data, error } = await supabase
        .from('testimonials')
        .insert([{
          ...testimonial,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw new Error(`Error al crear testimonio: ${error.message}`);
      }
      
      console.log('✅ Testimonio creado correctamente:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en createTestimonial:', error);
      throw error;
    }
  },

  updateTestimonial: async (id: string, updates: Partial<Testimonial>) => {
    try {
      console.log('🔄 Actualizando testimonio:', { id, updates });
      
      const { data: existingTestimonial, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('❌ Error al buscar testimonio:', fetchError);
        throw new Error(`No se encontró el testimonio con ID ${id}: ${fetchError.message}`);
      }
      
      if (!existingTestimonial) {
        console.error('❌ Testimonio no encontrado');
        throw new Error(`No se encontró el testimonio con ID ${id}`);
      }
      
      console.log('✅ Testimonio encontrado:', existingTestimonial);
      
      const { data, error } = await supabase
        .from('testimonials')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw new Error(`Error al actualizar testimonio: ${error.message}`);
      }
      
      console.log('✅ Testimonio actualizado correctamente:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en updateTestimonial:', error);
      throw error;
    }
  },

  deleteTestimonial: async (id: string) => {
    try {
      console.log('🗑️ Eliminando testimonio:', id);
      
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw new Error(`Error al eliminar el testimonio: ${error.message}`);
      }
      
      console.log('✅ Testimonio eliminado correctamente');
      return { error: null };
    } catch (error) {
      console.error('❌ Error en deleteTestimonial:', error);
      return { error: null };
    }
  },

  // ========== EDITABLE SECTIONS ==========
  getEditableSections: async (): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('editable_sections')
        .select('*')
        .single();
      
      if (error) {
        return {
          valuePropsTitle: '¿Por Qué Elegirnos?',
          statsTitle: 'Nuestro Impacto',
          statsSubtitle: 'Números que hablan por nosotros',
          testimonialsTitle: 'Lo Que Dicen Nuestros Clientes',
          testimonialsSubtitle: 'Más de 450 clientes satisfechos'
        };
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error loading editable sections:', error);
      return {
        valuePropsTitle: '¿Por Qué Elegirnos?',
        statsTitle: 'Nuestro Impacto',
        statsSubtitle: 'Números que hablan por nosotros',
        testimonialsTitle: 'Lo Que Dicen Nuestros Clientes',
        testimonialsSubtitle: 'Más de 450 clientes satisfechos'
      };
    }
  },

  updateEditableSections: async (sections: any): Promise<void> => {
    const { error } = await supabase
      .from('editable_sections')
      .upsert([{ id: 1, ...sections }]);
    
    if (error) {
      console.error('❌ Error updating editable sections:', error);
    }
  },

  // =====================================================
  // REEMPLAZAR ESTAS FUNCIONES EN LA SECCIÓN DE AMIGURUMI RECORDS
  // =====================================================

  // --- AMIGURUMI RECORDS ---
  getAmigurumiRecords: async () => {
    try {
      console.log('🔄 Obteniendo registros de amigurumis...');
      
      const { data, error } = await supabase
        .from('amigurumi_records')
        .select('*')
        .order('fecha_actualizacion', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching amigurumi records:', error);
        console.error('❌ Detalles:', {
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return { data: null, error };
      }
      
      // ✅ Mapear los datos correctamente
      const mappedData = (data || []).map(mapAmigurumiRecord);
      console.log('✅ Registros obtenidos:', mappedData.length);
      return { data: mappedData, error: null };
    } catch (error) {
      console.error('❌ Error en getAmigurumiRecords:', error);
      return { data: null, error };
    }
  },

  createAmigurumiRecord: async (record: AmigurumiRecord) => {
    try {
      console.log('➕ Creando registro de amigurumi:', record);
      
      // ✅ VALIDAR QUE TODOS LOS CAMPOS REQUERIDOS EXISTEN
      if (!record.nombre || !record.insumos) {
        throw new Error('Faltan campos obligatorios: nombre e insumos');
      }
      
      const { data, error } = await supabase
        .from('amigurumi_records')
        .insert([{
          id: record.id,
          nombre: record.nombre,
          insumos: record.insumos,
          fecha_actualizacion: new Date().toISOString(),
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('❌ Error creando registro:', error);
        console.error('❌ Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { data: null, error };
      }
      
      console.log('✅ Registro creado exitosamente:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error en createAmigurumiRecord:', error);
      return { data: null, error };
    }
  },

  updateAmigurumiRecord: async (id: string, record: Partial<AmigurumiRecord>) => {
    try {
      console.log('🔄 Actualizando registro:', { id, record });
      
      // ✅ CONSTRUIR OBJETO DE ACTUALIZACIÓN
      const updateData: any = {
        fecha_actualizacion: new Date().toISOString()
      };
      
      if (record.nombre !== undefined) updateData.nombre = record.nombre;
      if (record.insumos !== undefined) updateData.insumos = record.insumos;
      
      const { data, error } = await supabase
        .from('amigurumi_records')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Error actualizando:', error);
        console.error('❌ Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { data: null, error };
      }
      
      console.log('✅ Registro actualizado:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error en updateAmigurumiRecord:', error);
      return { data: null, error };
    }
  },

  deleteAmigurumiRecord: async (id: string) => {
    try {
      console.log('🗑️ Eliminando registro de amigurumi:', id);
      
      const { error } = await supabase
        .from('amigurumi_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error al eliminar registro de amigurumi:', error);
        return { error };
      }
      
      console.log('✅ Registro de amigurumi eliminado correctamente');
      return { error: null };
    } catch (error) {
      console.error('❌ Error en deleteAmigurumiRecord:', error);
      return { error };
    }
  },

  // --- QUOTES ---
  saveQuote: async (quoteData: QuoteData) => {
    const inventoryItems = await db.getInventoryItems();
    
    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        client_name: quoteData.clientName,
        client_email: quoteData.clientEmail,
        client_phone: quoteData.clientPhone,
        product_name: quoteData.productName,
        description: quoteData.description,
        base_price: quoteData.basePrice,
        selected_size_id: quoteData.selectedSizeId,
        selected_packaging_id: quoteData.selectedPackagingId,
        selected_accessories: quoteData.selectedAccessories,
        image_url: quoteData.imageUrl,
        notes: quoteData.notes,
        total_amount: calculateQuoteTotal(quoteData, inventoryItems),
        status: quoteData.status || 'pending'
      }])
      .select();
    
    if (error) {
      console.error('❌ Error saving quote:', error);
      throw new Error(`Error al guardar la cotización: ${error.message}`);
    }
    
    return data;
  },

  getQuotes: async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching quotes:', error);
      return [];
    }
    
    return data || [];
  },

  getQuoteById: async (id: string) => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('❌ Error al obtener cotización:', error);
      return null;
    }
    
    return data;
  },

  updateQuote: async (id: string, updates: Partial<QuoteData>) => {
    const dbUpdates: any = {};
    
    if (updates.client_name !== undefined) dbUpdates.client_name = updates.client_name;
    if (updates.client_email !== undefined) dbUpdates.client_email = updates.client_email;
    if (updates.client_phone !== undefined) dbUpdates.client_phone = updates.client_phone;
    if (updates.product_name !== undefined) dbUpdates.product_name = updates.product_name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.base_price !== undefined) dbUpdates.base_price = updates.base_price;
    if (updates.selected_size_id !== undefined) dbUpdates.selected_size_id = updates.selected_size_id;
    if (updates.selected_packaging_id !== undefined) dbUpdates.selected_packaging_id = updates.selected_packaging_id;
    if (updates.selected_accessories !== undefined) dbUpdates.selected_accessories = updates.selected_accessories;
    if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.total_amount !== undefined) dbUpdates.total_amount = updates.total_amount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    
    const { data, error } = await supabase
      .from('quotes')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('❌ Error al actualizar cotización:', error);
      throw new Error(`Error al actualizar la cotización: ${error.message}`);
    }
    
    return data;
  },

  deleteQuote: async (id: string) => {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error al eliminar cotización:', error);
    }
  }
};

export default db;