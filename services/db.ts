
import { supabase } from './supabaseClient';
import { Order, Client, InventoryItem, ProductConfig, GlobalConfig, GalleryItem, DEFAULT_CONFIG, Tejedora, HomeConfig, Post, Challenge, Supply, Expense, ReturnRecord } from '../types';
import { mockOrders, mockClient, mockGallery, mockGlobalConfig, mockPosts, mockChallenges, mockSupplies, mockExpenses, mockReturns } from './mockData';

// --- MAPPING HELPERS (Snake_case DB to CamelCase TS) ---
const mapHomeConfig = (data: any): HomeConfig => ({
  heroImage1: data.hero_image1,
  heroImage2: data.hero_image2
});

const mapTejedora = (data: any): Tejedora => ({
  id: data.id,
  nombre: data.nombre,
  especialidad: data.especialidad,
  imageUrl: data.image_url
});

const mapGallery = (data: any): GalleryItem => ({
  id: data.id,
  title: data.title,
  description: data.description,
  imageUrl: data.image_url,
  price: data.price
});

const mapPost = (data: any): Post => ({
  id: data.id,
  userId: data.user_id,
  userName: data.user_name,
  userAvatar: data.user_avatar,
  topic: data.topic,
  imageUrl: data.image_url,
  description: data.description,
  likes: data.likes,
  likedBy: data.liked_by || [],
  timestamp: data.timestamp
});

const mapChallenge = (data: any): Challenge => ({
  id: data.id,
  title: data.title,
  description: data.description,
  imageUrl: data.image_url,
  startDate: data.start_date,
  endDate: data.end_date,
  difficulty: data.difficulty,
  reward: data.reward,
  participants: data.participants,
  status: data.status
});

const mapOrder = (o: any): Order => ({
  id: o.id,
  numero_seguimiento: o.numero_seguimiento,
  clientEmail: o.client_email,
  nombre_producto: o.nombre_producto,
  estado: o.estado,
  fecha_solicitud: o.fecha_solicitud,
  total_final: o.total_final,
  monto_pagado: o.monto_pagado,
  saldo_pendiente: o.saldo_pendiente,
  imagen_url: o.imagen_url,
  descripcion: o.descripcion,
  desglose: o.desglose || { precio_base: 0, empaque: 0, accesorios: 0, descuento: 0 },
  guia_transportadora: o.guia_transportadora
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
  // Campos calculados o no persistidos en BD para UI
  ahorro_historico: 0,
  compras_para_siguiente: 5 - (c.compras_totales || 0),
  progreso_porcentaje: ((c.compras_totales || 0) / 5) * 100,
  promedio_por_pedido: c.compras_totales > 0 ? (c.total_invertido / c.compras_totales) : 0,
  ahorro_descuentos: 0,
  porcentaje_ahorro: 0
});

const mapSupply = (s: any): Supply => ({
  id: s.id,
  name: s.name,
  reference: s.reference,
  unitValue: s.unit_value,
  quantity: s.quantity,
  color: s.color,
  number: s.number,
  lowStockThreshold: s.low_stock_threshold
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

// --- ASYNC DB SERVICE ---

export const db = {
  // --- HOME CONFIG ---
  getHomeConfig: async (): Promise<HomeConfig> => {
    const { data, error } = await supabase.from('home_config').select('*').limit(1).single();
    if (error || !data) {
      return {
        heroImage1: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&w=600&q=80',
        heroImage2: 'https://images.unsplash.com/photo-1615486511484-92e172cc416d?auto=format&fit=crop&w=600&q=80'
      };
    }
    return mapHomeConfig(data);
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
    const { data } = await supabase.from('tejedoras').select('*');
    return (data || []).map(mapTejedora);
  },

  addTejedora: async (tejedora: Tejedora) => {
    await supabase.from('tejedoras').insert({
      nombre: tejedora.nombre,
      especialidad: tejedora.especialidad,
      image_url: tejedora.imageUrl
    });
  },

  saveTejedoras: async (tejedoras: Tejedora[]) => {
      // Método simplificado para upsert en lote
      for (const t of tejedoras) {
          // Si el ID parece ser temporal (creado con Date.now()), dejamos que Supabase genere uno
          const idToUse = t.id.startsWith('tej-') ? undefined : t.id;
          const { error } = await supabase.from('tejedoras').upsert({
              id: idToUse, 
              nombre: t.nombre,
              especialidad: t.especialidad,
              image_url: t.imageUrl
          });
          if (error) console.error('Error saving tejedora', error);
      }
  },

  deleteTejedora: async (id: string) => {
    await supabase.from('tejedoras').delete().eq('id', id);
  },

  // --- GALLERY ---
  getGallery: async (): Promise<GalleryItem[]> => {
    const { data } = await supabase.from('gallery_items').select('*');
    return (data || []).map(mapGallery);
  },

  addGalleryItem: async (item: GalleryItem) => {
    await supabase.from('gallery_items').insert({
      title: item.title,
      description: item.description,
      image_url: item.imageUrl,
      price: item.price
    });
  },

  updateGalleryItem: async (item: GalleryItem) => {
    await supabase.from('gallery_items').update({
      title: item.title,
      description: item.description,
      image_url: item.imageUrl,
      price: item.price
    }).eq('id', item.id);
  },

  deleteGalleryItem: async (id: string) => {
    await supabase.from('gallery_items').delete().eq('id', id);
  },

  // --- CHALLENGES ---
  getChallenges: async (): Promise<Challenge[]> => {
    const { data } = await supabase.from('challenges').select('*');
    return (data || []).map(mapChallenge);
  },

  addChallenge: async (ch: Challenge) => {
    await supabase.from('challenges').insert({
      title: ch.title,
      description: ch.description,
      image_url: ch.imageUrl,
      start_date: ch.startDate,
      end_date: ch.endDate,
      difficulty: ch.difficulty,
      reward: ch.reward,
      participants: ch.participants,
      status: ch.status
    });
  },

  updateChallenge: async (ch: Challenge) => {
    await supabase.from('challenges').update({
      title: ch.title,
      description: ch.description,
      image_url: ch.imageUrl,
      start_date: ch.startDate,
      end_date: ch.endDate,
      difficulty: ch.difficulty,
      reward: ch.reward,
      participants: ch.participants,
      status: ch.status
    }).eq('id', ch.id);
  },

  deleteChallenge: async (id: string) => {
    await supabase.from('challenges').delete().eq('id', id);
  },

  // --- POSTS ---
  getPosts: async (): Promise<Post[]> => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    return (data || []).map(mapPost);
  },

  addPost: async (post: Post) => {
    await supabase.from('posts').insert({
      user_id: post.userId,
      user_name: post.userName,
      user_avatar: post.userAvatar,
      topic: post.topic,
      image_url: post.imageUrl,
      description: post.description,
      likes: post.likes,
      timestamp: post.timestamp
    });
  },

  updatePost: async (post: Post) => {
    await supabase.from('posts').update({
      topic: post.topic,
      image_url: post.imageUrl,
      description: post.description,
      user_name: post.userName
    }).eq('id', post.id);
  },

  deletePost: async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
  },

  toggleLikePost: async (postId: string, userEmail: string): Promise<Post[]> => {
    const { data: current } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (!current) return [];

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

  // --- ORDERS ---
  getOrders: async (): Promise<Order[]> => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) return mockOrders;
    return data.map(mapOrder);
  },

  addOrder: async (order: Order) => {
    await supabase.from('orders').insert({
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
      desglose: order.desglose
    });
  },

  updateOrder: async (id: string, updates: Partial<Order>) => {
      const dbUpdates: any = {};
      if (updates.estado) dbUpdates.estado = updates.estado;
      if (updates.guia_transportadora) dbUpdates.guia_transportadora = updates.guia_transportadora;
      if (updates.saldo_pendiente !== undefined) dbUpdates.saldo_pendiente = updates.saldo_pendiente;
      if (updates.monto_pagado !== undefined) dbUpdates.monto_pagado = updates.monto_pagado;
      
      await supabase.from('orders').update(dbUpdates).eq('id', id);
  },

  deleteOrder: async (id: string) => {
      await supabase.from('orders').delete().eq('id', id);
  },

  // --- CLIENTS ---
  getAllClients: async (): Promise<Client[]> => {
      const { data } = await supabase.from('clients').select('*');
      if (!data || data.length === 0) return [mockClient];
      return data.map(mapClient);
  },

  registerClient: async (clientData: any) => {
      const code = (clientData.nombre.substring(0,3) + Date.now().toString().substring(9)).toUpperCase();
      await supabase.from('clients').insert({
          nombre_completo: clientData.nombre,
          email: clientData.email,
          cedula: clientData.cedula,
          telefono: clientData.telefono,
          direccion: clientData.direccion,
          password: clientData.password,
          codigo_referido: code
      });
      // Simulamos login en localStorage para mantener la sesión
      localStorage.setItem('puntadas_user', clientData.email);
      localStorage.setItem('puntadas_role', 'client');
  },

  deleteClient: async (id: string) => {
      await supabase.from('clients').delete().eq('id', id);
  },

  // --- EXPENSES ---
  getExpenses: async (): Promise<Expense[]> => {
      const { data } = await supabase.from('expenses').select('*');
      if (!data || data.length === 0) return mockExpenses;
      return data.map(mapExpense);
  },

  addExpense: async (e: Expense) => {
      await supabase.from('expenses').insert({
          date: e.date,
          category: e.category,
          description: e.description,
          amount: e.amount,
          provider: e.provider
      });
  },

  // --- RETURNS ---
  getReturns: async (): Promise<ReturnRecord[]> => {
      const { data } = await supabase.from('returns').select('*');
      if (!data || data.length === 0) return mockReturns;
      return data.map(mapReturn);
  },

  // --- SUPPLIES ---
  getSupplies: async (): Promise<Supply[]> => {
      const { data } = await supabase.from('supplies').select('*');
      if (!data || data.length === 0) return mockSupplies;
      return data.map(mapSupply);
  },

  addSupply: async (s: Supply) => {
      await supabase.from('supplies').insert({
          name: s.name,
          reference: s.reference,
          unit_value: s.unitValue,
          quantity: s.quantity,
          color: s.color,
          number: s.number,
          low_stock_threshold: s.lowStockThreshold
      });
  },

  updateSupply: async (s: Supply) => {
      await supabase.from('supplies').update({
          name: s.name,
          reference: s.reference,
          unit_value: s.unitValue,
          quantity: s.quantity,
          color: s.color,
          number: s.number,
          low_stock_threshold: s.lowStockThreshold
      }).eq('id', s.id);
  },

  // --- INVENTORY (Product Config - Static/Mock for now as it wasn't in SQL) ---
  getAllInventoryItems: async (): Promise<InventoryItem[]> => {
      return [...DEFAULT_CONFIG.sizes, ...DEFAULT_CONFIG.packaging, ...DEFAULT_CONFIG.accessories];
  },
  
  addInventoryItem: async (item: InventoryItem) => { 
      console.log("Added to inventory (local only for now)", item);
  },
  
  updateInventoryItem: async (item: InventoryItem) => {
      console.log("Updated inventory (local only for now)", item);
  },

  // --- SYNC HELPERS FOR LEGACY COMPONENTS ---
  // These provide fallbacks or cached data for components not yet fully async
  getConfig: (): GlobalConfig => mockGlobalConfig,
  
  getClient: (): Client => mockClient,

  getInventory: (): ProductConfig => DEFAULT_CONFIG
};
