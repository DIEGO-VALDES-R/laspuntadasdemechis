import { supabase } from './supabaseClient';
import { Order, Client, InventoryItem, ProductConfig, GlobalConfig, GalleryItem, DEFAULT_CONFIG, Tejedora, HomeConfig, Post, Challenge, Supply, Expense, ReturnRecord } from '../types';

// 🆕 INTERFACES PARA AMIGURUMI
export interface InsumoAmigurumi {
  id: string;
  tipo: string;
  marca: string;
  referencia: string;
  color: string;
  cantidad: string;
  unidad: string;
}

export interface AmigurumiRecord {
  id: string;
  nombre: string;
  insumos: InsumoAmigurumi[];
  fechaActualizacion: string; // camelCase en TypeScript
}

// 🆕 INTERFAZ PARA COTIZACIONES
export interface QuoteData {
  id?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  productName: string;
  description: string;
  basePrice: number;
  selectedSizeId?: string;
  selectedPackagingId?: string;
  selectedAccessories: string[];
  imageUrl?: string;
  notes?: string;
  status?: 'pending' | 'sent' | 'approved' | 'rejected';
  createdAt?: string;
  totalAmount?: number;
}

// =====================================================
// MAPPING HELPERS (Database to TypeScript)
// =====================================================

const mapOrder = (o: any): Order => ({
  id: o.id,
  numero_seguimiento: o.numero_seguimiento,
  clientEmail: o.client_email,
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

const mapGallery = (g: any): GalleryItem => ({
  id: g.id,
  title: g.title,
  description: g.description,
  imageUrl: g.image_url,
  price: g.price
});

const mapTejedora = (t: any): Tejedora => ({
  id: t.id,
  nombre: t.nombre,
  especialidad: t.especialidad,
  imageUrl: t.image_url
});

const mapPost = (p: any): Post => ({
  id: p.id,
  userId: p.user_id,
  userName: p.user_name,
  userAvatar: p.user_avatar,
  topic: p.topic,
  imageUrl: p.image_url,
  description: p.description,
  likes: p.likes,
  likedBy: p.liked_by || [],  // Corregido: era p.likedBy
  timestamp: p.timestamp
});

const mapChallenge = (c: any): Challenge => ({
  id: c.id,
  title: c.title,
  description: c.description,
  imageUrl: c.image_url,
  startDate: c.start_date,
  endDate: c.end_date,
  difficulty: c.difficulty,
  reward: c.reward,
  participants: c.participants,
  status: c.status
});

const mapHomeConfig = (c: any): HomeConfig => ({
  heroImage1: c.hero_image1,
  heroImage2: c.hero_image2,
  cardImage3: c.card_image3,
  cardImage4: c.card_image4,
  cardImage5: c.card_image5,
  cardPrice1: c.card_price1,
  cardPrice2: c.card_price2,
  cardPrice3: c.card_price3,
  cardPrice4: c.card_price4
});

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
      nombre_producto: order.nombre_producto,
      estado: order.estado,
      fecha_solicitud: order.fecha_solicitud,
      total_final: order.total_final,
      monto_pagado: order.monto_pagado,
      saldo_pendiente: order.saldo_pendiente,
      imagen_url: order.imagen_url,
      final_image_url: order.final_image_url || null,
      descripcion: order.descripcion,
      desglose: order.desglose,
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
  getGallery: async (): Promise<GalleryItem[]> => {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching gallery:', error);
      return [];
    }
    return (data || []).map(mapGallery);
  },

  addGalleryItem: async (item: Omit<GalleryItem, 'id'>) => {
    const { error } = await supabase.from('gallery_items').insert({
      title: item.title,
      description: item.description,
      image_url: item.imageUrl,
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
  // Guardar configuración del home (usando columnas directas)
  saveHomeConfig: async (config: HomeConfig) => {
    try {
      console.log('📝 Guardando en Supabase con columnas directas...', config);

      const { data, error } = await supabase
        .from('home_config')
        .upsert({
          id: 1, // Siempre usamos id=1 para home config
          section_key: 'hero_section',
          hero_image1: config.heroImage1 || '',
          hero_image2: config.heroImage2 || '',
          card_image3: config.cardImage3 || '',
          card_image4: config.cardImage4 || '',
          card_image5: config.cardImage5 || '',
          card_price1: config.cardPrice1 || '$30.00',
          card_price2: config.cardPrice2 || '$27.00',
          card_price3: config.cardPrice3 || '$26.00',
          card_price4: config.cardPrice4 || '$25.00',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

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

  // Obtener configuración del home (usando columnas directas)
  getHomeConfig: async (): Promise<HomeConfig> => {
    try {
      console.log('📖 Cargando home config desde Supabase...');
      
      const { data, error } = await supabase
        .from('home_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error al cargar:', error);
        throw error;
      }

      // Si no existe, crear uno por defecto
      if (!data) {
        console.log('⚠️ No existe registro, creando uno por defecto...');
        const defaultConfig = {
          heroImage1: '',
          heroImage2: '',
          cardImage3: '',
          cardImage4: '',
          cardImage5: '',
          cardPrice1: '$30.00',
          cardPrice2: '$27.00',
          cardPrice3: '$26.00',
          cardPrice4: '$25.00',
        };
        await db.saveHomeConfig(defaultConfig);
        return defaultConfig;
      }

      const config = {
        heroImage1: data.hero_image1 || '',
        heroImage2: data.hero_image2 || '',
        cardImage3: data.card_image3 || '',
        cardImage4: data.card_image4 || '',
        cardImage5: data.card_image5 || '',
        cardPrice1: data.card_price1 || '$30.00',
        cardPrice2: data.card_price2 || '$27.00',
        cardPrice3: data.card_price3 || '$26.00',
        cardPrice4: data.card_price4 || '$25.00',
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
        cardPrice1: '$30.00',
        cardPrice2: '$27.00',
        cardPrice3: '$26.00',
        cardPrice4: '$25.00',
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

  saveTejedoras: async (tejedoras: Tejedora[]) => {
    for (const t of tejedoras) {
      const { error } = await supabase.from('tejedoras').upsert({
        id: t.id,
        nombre: t.nombre,
        especialidad: t.especialidad,
        image_url: t.imageUrl
      });
      if (error) console.error('Error saving tejedora:', error);
    }
  },

  deleteTejedora: async (id: string) => {
    const { error } = await supabase
      .from('tejedoras')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting tejedora:', error);
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

  addPost: async (post: Omit<Post, 'id'>) => {
    const { error } = await supabase.from('posts').insert({
      user_id: post.userId,
      user_name: post.userName,
      user_avatar: post.userAvatar,
      topic: post.topic,
      image_url: post.imageUrl,
      description: post.description,
      likes: post.likes,
      liked_by: post.likedBy,
      timestamp: post.timestamp
    });
    
    if (error) console.error('Error adding post:', error);
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
    
    if (error) console.error('Error updating post:', error);
  },

  deletePost: async (id: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting post:', error);
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

  addChallenge: async (challenge: Omit<Challenge, 'id'>) => {
    const { error } = await supabase.from('challenges').insert({
      title: challenge.title,
      description: challenge.description,
      image_url: challenge.imageUrl,
      start_date: challenge.startDate,
      end_date: challenge.endDate,
      difficulty: challenge.difficulty,
      reward: challenge.reward,
      participants: challenge.participants,
      status: challenge.status
    });
    
    if (error) console.error('Error adding challenge:', error);
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
    
    if (error) console.error('Error updating challenge:', error);
  },

  deleteChallenge: async (id: string) => {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting challenge:', error);
  },

  // --- REFERRALS ---
  getAllReferrals: async (): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching referrals:', error);
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
          .in('id', referrerIds);
        
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
      console.error('Error in getAllReferrals:', error);
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
    
    if (error) console.error('Error deleting referral:', error);
  },

  updateReferral: async (referralId: string, updates: any) => {
    const { error } = await supabase
      .from('referrals')
      .update(updates)
      .eq('id', referralId);
    
    if (error) console.error('Error updating referral:', error);
  },

  addReferral: async (referral: any) => {
    const { error } = await supabase.from('referrals').insert(referral);
    
    if (error) console.error('Error adding referral:', error);
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
    
    if (error) throw error;
  },

  updateValueProp: async (id: string, updates: any): Promise<void> => {
    const { error } = await supabase
      .from('value_props')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  },

  deleteValueProp: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('value_props')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
    
    if (error) throw error;
  },

  // ========== TESTIMONIALS ==========
  getTestimonials: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }
    
    return data || [];
  },

  saveTestimonial: async (testimonial: any): Promise<void> => {
    const { error } = await supabase
      .from('testimonials')
      .insert([testimonial]);
    
    if (error) throw error;
  },

  updateTestimonial: async (id: string, updates: any): Promise<void> => {
    const { error } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ========== EDITABLE SECTIONS ==========
  getEditableSections: async (): Promise<any> => {
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
  },

  updateEditableSections: async (sections: any): Promise<void> => {
    const { error } = await supabase
      .from('editable_sections')
      .upsert([{ id: 1, ...sections }]);
    
    if (error) throw error;
  },

    // 🆕 FUNCIONES PARA COTIZACIONES
  saveQuote: async (quoteData: QuoteData) => {
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
    
    if (error) throw error;
    return data;
  },

  getQuotes: async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getQuoteById: async (id: string) => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  updateQuote: async (id: string, updates: Partial<QuoteData>) => {
    const dbUpdates: any = {};
    
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.clientEmail !== undefined) dbUpdates.client_email = updates.clientEmail;
    if (updates.clientPhone !== undefined) dbUpdates.client_phone = updates.clientPhone;
    if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.basePrice !== undefined) dbUpdates.base_price = updates.basePrice;
    if (updates.selectedSizeId !== undefined) dbUpdates.selected_size_id = updates.selectedSizeId;
    if (updates.selectedPackagingId !== undefined) dbUpdates.selected_packaging_id = updates.selectedPackagingId;
    if (updates.selectedAccessories !== undefined) dbUpdates.selected_accessories = updates.selectedAccessories;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    
    const { data, error } = await supabase
      .from('quotes')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  },

  deleteQuote: async (id: string) => {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// 🆕 FUNCIÓN AUXILIAR PARA CALCULAR EL TOTAL DE UNA COTIZACIÓN
function calculateQuoteTotal(quoteData: QuoteData, inventoryItems?: InventoryItem[]): number {
  let total = 0;
  
  // Si hay un tamaño seleccionado, usar su precio como base (NO como adicional)
  if (quoteData.selectedSizeId && inventoryItems) {
    const size = inventoryItems.find(item => item.id === quoteData.selectedSizeId);
    if (size) {
      total = size.price; // Usar el precio del tamaño como total base
    }
  }
  // Si NO hay tamaño seleccionado, usar el precio base
  else if (quoteData.basePrice > 0) {
    total = quoteData.basePrice;
  }
  
  // Añadir precio del empaque
  if (quoteData.selectedPackagingId && inventoryItems) {
    const packaging = inventoryItems.find(item => item.id === quoteData.selectedPackagingId);
    if (packaging) {
      total += packaging.price;
    }
  }
  
  // Añadir precio de los accesorios
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

export default db;