import { supabase } from './supabaseClient';
import { Order, Client, InventoryItem, ProductConfig, GlobalConfig, GalleryItem, DEFAULT_CONFIG, Tejedora, HomeConfig, Post, Challenge, Supply, Expense, ReturnRecord } from '../types';

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
  imageUrl: s.image_URL
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
  likedBy: p.liked_by || [],
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

  addOrder: async (order: Omit<Order, 'id'>) => {
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

  getClient: async (email: string): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return null;
    return mapClient(data);
  },

  registerClient: async (clientData: any) => {
    const code = (clientData.nombre.substring(0,3) + Date.now().toString().substring(9)).toUpperCase();
    
    const { error } = await supabase.from('clients').insert({
      nombre_completo: clientData.nombre,
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
    return (data || []).map(mapSupply);
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
      image_URL: supply.imageUrl
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
        image_URL: supply.imageUrl
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
    // Esta función devuelve los items del catálogo (sizes, packaging, accessories)
    // Por ahora usamos DEFAULT_CONFIG, pero puedes crear una tabla en Supabase si quieres
    return [...DEFAULT_CONFIG.sizes, ...DEFAULT_CONFIG.packaging, ...DEFAULT_CONFIG.accessories];
  },

  getInventory: (): ProductConfig => {
    return DEFAULT_CONFIG;
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
  getHomeConfig: async (): Promise<HomeConfig> => {
    const { data, error } = await supabase
      .from('home_config')
      .select('*')
      .limit(1)
      .single();
    
    if (error || !data) {
      return {
        heroImage1: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=600&q=80',
        heroImage2: 'https://images.unsplash.com/photo-1615486511484-92e172cc416d?auto=format&fit=crop&w=600&q=80'
      };
    }
    
    return {
      heroImage1: data.hero_image1,
      heroImage2: data.hero_image2
    };
  },

  saveHomeConfig: async (config: HomeConfig) => {
    const { data } = await supabase.from('home_config').select('id').limit(1);
    
    if (data && data.length > 0) {
      await supabase.from('home_config').update({
        hero_image1: config.heroImage1,
        hero_image2: config.heroImage2
      }).eq('id', data[0].id);
    } else {
      await supabase.from('home_config').insert({
        hero_image1: config.heroImage1,
        hero_image2: config.heroImage2
      });
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
  }
};