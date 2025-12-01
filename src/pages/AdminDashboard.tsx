import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import {
  LayoutDashboard, ShoppingCart, Users, Package, DollarSign, Settings,
  Search, Eye, X, Save, ShoppingBag, Plus, Trash2, Edit2, 
  Image as ImageIcon, Upload, PenTool, Truck, Heart, Trophy, Box, PieChart
} from 'lucide-react';
import { Order, Client, Supply, GalleryItem, Tejedora, HomeConfig, Post, Challenge, GlobalConfig } from '../types';

type Tab = 'dashboard' | 'orders' | 'supplies' | 'clients' | 'gallery' | 'content' | 'community' | 'challenges' | 'settings';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [config, setConfig] = useState<GlobalConfig>({ limite_pago_completo: 70000, abono_minimo_fijo: 50000, descuento_referido: 10 });
  const [homeConfig, setHomeConfig] = useState<HomeConfig>({ heroImage1: '', heroImage2: '' });
  const [tejedoras, setTejedoras] = useState<Tejedora[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [isTejedoraModalOpen, setIsTejedoraModalOpen] = useState(false);
  const [editingTejedora, setEditingTejedora] = useState<Tejedora | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    clientEmail: '',
    nombre_producto: '',
    descripcion: '',
    total_final: 0,
    monto_pagado: 0
  });

  // Status update
  const [statusUpdate, setStatusUpdate] = useState('');
  const [trackingGuide, setTrackingGuide] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, clientsData, suppliesData, galleryData, configData, homeData, tejedorasData, postsData, challengesData] = await Promise.all([
        db.getOrders(),
        db.getAllClients(),
        db.getSupplies(),
        db.getGallery(),
        db.getConfig(),
        db.getHomeConfig(),
        db.getTejedoras(),
        db.getPosts(),
        db.getChallenges()
      ]);

      setOrders(ordersData);
      setClients(clientsData);
      setSupplies(suppliesData);
      setGallery(galleryData);
      setConfig(configData);
      setHomeConfig(homeData);
      setTejedoras(tejedorasData);
      setPosts(postsData);
      setChallenges(challengesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('puntadas_user');
    const role = localStorage.getItem('puntadas_role');
    if (!user || role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  // ORDER HANDLERS
  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
    setStatusUpdate(order.estado);
    setTrackingGuide(order.guia_transportadora || '');
    setIsOrderModalOpen(true);
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    const pending = selectedOrder.saldo_pendiente;
    const input = prompt(`Ingresa el monto a verificar (Pendiente: $${pending.toLocaleString()}):`, pending.toString());
    
    if (input !== null) {
      const amount = parseFloat(input);
      if (isNaN(amount) || amount < 0) {
        alert("Monto inválido");
        return;
      }
      
      const newPaid = selectedOrder.monto_pagado + amount;
      const newPending = selectedOrder.total_final - newPaid;
      let newStatus = selectedOrder.estado;
      
      if (selectedOrder.estado === 'En espera de agendar' && amount > 0) {
        newStatus = 'Agendado';
      }
      
      await db.updateOrder(selectedOrder.id, {
        monto_pagado: newPaid,
        saldo_pendiente: Math.max(0, newPending),
        estado: newStatus
      });
      
      setIsOrderModalOpen(false);
      loadData();
      alert(`Pago de $${amount.toLocaleString()} registrado.`);
    }
  };

  const handleUpdateStatusAndGuide = async () => {
    if (!selectedOrder) return;
    await db.updateOrder(selectedOrder.id, {
      estado: statusUpdate as any,
      guia_transportadora: trackingGuide
    });
    alert('Pedido actualizado.');
    setIsOrderModalOpen(false);
    loadData();
  };

  const handleDeleteOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este pedido?')) {
      await db.deleteOrder(orderId);
      loadData();
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderData.clientEmail || !newOrderData.nombre_producto || newOrderData.total_final <= 0) {
      alert("Completa los campos obligatorios");
      return;
    }

    const saldo = newOrderData.total_final - newOrderData.monto_pagado;
    const newOrder = {
      numero_seguimiento: Math.floor(100000 + Math.random() * 900000).toString(),
      clientEmail: newOrderData.clientEmail,
      nombre_producto: newOrderData.nombre_producto,
      descripcion: newOrderData.descripcion || 'Pedido creado manualmente',
      estado: (saldo === 0 ? 'Agendado' : 'En espera de agendar') as any,
      fecha_solicitud: new Date().toISOString().split('T')[0],
      total_final: newOrderData.total_final,
      monto_pagado: newOrderData.monto_pagado,
      saldo_pendiente: saldo,
      imagen_url: 'https://via.placeholder.com/200?text=Manual',
      desglose: { precio_base: newOrderData.total_final, empaque: 0, accesorios: 0, descuento: 0 }
    };

    await db.addOrder(newOrder as any);
    setIsCreateOrderModalOpen(false);
    setNewOrderData({ clientEmail: '', nombre_producto: '', descripcion: '', total_final: 0, monto_pagado: 0 });
    loadData();
    alert(`Pedido creado: #${newOrder.numero_seguimiento}`);
  };

  // SUPPLY HANDLERS
  const handleSaveSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupply) {
      if (supplies.find(s => s.id === editingSupply.id)) {
        await db.updateSupply(editingSupply);
      } else {
        await db.addSupply(editingSupply);
      }
      setIsSupplyModalOpen(false);
      loadData();
    }
  };

  const handleDeleteSupply = async (id: string) => {
    if (confirm('¿Eliminar este insumo?')) {
      await db.deleteSupply(id);
      loadData();
    }
  };

  const openNewSupply = () => {
    setEditingSupply({
      id: `sup-${Date.now()}`,
      name: '',
      reference: '',
      unitValue: 0,
      quantity: 0,
      color: '',
      number: '',
      lowStockThreshold: 5
      imageUrl: ''
    });
    setIsSupplyModalOpen(true);
  };

  // CLIENT HANDLERS
  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este cliente?')) {
      await db.deleteClient(clientId);
      loadData();
    }
  };

  // GALLERY HANDLERS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: any) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) alert("Imagen muy pesada (>800KB)");
      const reader = new FileReader();
      reader.onload = (ev) => {
        setter((prev: any) => prev ? { ...prev, imageUrl: ev.target?.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGallery) {
      try {
        const exists = gallery.some(g => g.id === editingGallery.id);
        if (exists) {
          await db.updateGalleryItem(editingGallery);
        } else {
          await db.addGalleryItem(editingGallery);
        }
        setIsGalleryModalOpen(false);
        loadData();
      } catch (error: any) {
        alert(error.message || "Error al guardar");
      }
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (confirm('¿Eliminar imagen?')) {
      await db.deleteGalleryItem(id);
      loadData();
    }
  };

  const openNewGallery = () => {
    setEditingGallery({ id: `gal-${Date.now()}`, title: '', description: '', imageUrl: '', price: 0 });
    setIsGalleryModalOpen(true);
  };

  // CONTENT HANDLERS
  const handleSaveHomeConfig = async () => {
    await db.saveHomeConfig(homeConfig);
    alert('Imágenes actualizadas');
    loadData();
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage1' | 'heroImage2') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) alert("Imagen pesada");
      const reader = new FileReader();
      reader.onload = (ev) => {
        setHomeConfig(prev => ({ ...prev, [field]: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTejedora = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTejedora) {
      const newList = tejedoras.some(t => t.id === editingTejedora.id)
        ? tejedoras.map(t => t.id === editingTejedora.id ? editingTejedora : t)
        : [...tejedoras, editingTejedora];
      await db.saveTejedoras(newList);
      setIsTejedoraModalOpen(false);
      loadData();
    }
  };

  const handleDeleteTejedora = async (id: string) => {
    if (confirm("¿Eliminar tejedora?")) {
      await db.deleteTejedora(id);
      loadData();
    }
  };

  // COMMUNITY HANDLERS
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      if (posts.some(p => p.id === editingPost.id)) {
        await db.updatePost(editingPost);
      } else {
        await db.addPost(editingPost);
      }
      setIsPostModalOpen(false);
      loadData();
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("¿Eliminar publicación?")) {
      await db.deletePost(id);
      loadData();
    }
  };

  const openNewPost = () => {
    setEditingPost({
      id: `post-${Date.now()}`,
      userId: 'admin',
      userName: 'Puntadas de Mechis',
      userAvatar: 'https://ui-avatars.com/api/?name=Admin&background=random',
      topic: 'Exhibición',
      imageUrl: '',
      description: '',
      likes: 0,
      likedBy: [],
      timestamp: 'Ahora'
    });
    setIsPostModalOpen(true);
  };

  // CHALLENGES HANDLERS
  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChallenge) {
      if (challenges.find(c => c.id === editingChallenge.id)) {
        await db.updateChallenge(editingChallenge);
      } else {
        await db.addChallenge(editingChallenge);
      }
      setIsChallengeModalOpen(false);
      loadData();
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (confirm("¿Eliminar reto?")) {
      await db.deleteChallenge(id);
      loadData();
    }
  };

  const openNewChallenge = () => {
    setEditingChallenge({
      id: `ch-${Date.now()}`,
      title: '',
      description: '',
      imageUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      difficulty: 'Fácil',
      reward: '',
      participants: 0,
      status: 'upcoming'
    });
    setIsChallengeModalOpen(true);
  };

  // VIEWS
  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100"><DollarSign className="text-green-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Ingresos</p>
            <p className="text-2xl font-bold">${orders.reduce((acc,o) => acc + o.monto_pagado, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-100"><ShoppingCart className="text-blue-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Pedidos Activos</p>
            <p className="text-2xl font-bold">{orders.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-pink-100"><Heart className="text-pink-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Posts Comunidad</p>
            <p className="text-2xl font-bold">{posts.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-100"><Trophy className="text-purple-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Retos Activos</p>
            <p className="text-2xl font-bold">{challenges.filter(c => c.status === 'active').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h2>
        <button
          onClick={() => setIsCreateOrderModalOpen(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800"
        >
          <Plus size={18}/> Nuevo Pedido Manual
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Ticket</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Guía</th>
              <th className="p-4">Saldo</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold">#{order.numero_seguimiento}</td>
                <td className="p-4">
                  {order.nombre_producto}
                  <div className="text-xs text-gray-500">{order.clientEmail}</div>
                </td>
                <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{order.estado}</span></td>
                <td className="p-4">
                  {order.guia_transportadora ? (
                    <span className="text-blue-600 flex items-center gap-1"><Truck size={14}/> {order.guia_transportadora}</span>
                  ) : <span className="text-gray-400 text-xs">Sin asignar</span>}
                </td>
                <td className="p-4 text-red-500 font-bold">${order.saldo_pendiente.toLocaleString()}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleOpenOrder(order)} className="text-pink-600 hover:bg-pink-50 p-2 rounded"><Eye size={18}/></button>
                  <button onClick={(e) => handleDeleteOrder(e, order.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const SuppliesView = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Box className="text-amber-600"/> Insumos / Materia Prima
      </h2>
      <button onClick={openNewSupply} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700">
        <Plus size={18}/> Nuevo Insumo
      </button>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="p-4">Imagen</th>
              <th className="p-4">Producto</th>
            <th className="p-4">Ref. / Detalles</th>
            <th className="p-4 text-center">Cantidad</th>
            <th className="p-4 text-right">Valor Unit.</th>
            <th className="p-4 text-right">Valor Total</th>
            <th className="p-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {supplies.map(sup => {
            const totalValue = sup.unitValue * sup.quantity;
            const isLowStock = sup.quantity <= sup.lowStockThreshold;
            return (
              <tr key={sup.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                  <td className="p-4">
                    {sup.imageUrl ? (
                      <img
                        src={sup.imageUrl}
                        alt={sup.name}
                        className="w-16 h-16 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Box size={24} className="text-gray-400"/>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-gray-800">{sup.name}</span>
                  </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase">{sup.reference}</span>
                    <span className="text-xs text-gray-600">Color: {sup.color}</span>
                    <span className="text-xs text-gray-600">Num: {sup.number}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>{sup.quantity}</span>
                </td>
                <td className="p-4 text-right text-gray-600">${sup.unitValue.toLocaleString()}</td>
                <td className="p-4 text-right font-bold text-gray-800">${totalValue.toLocaleString()}</td>
                <td className="p-4 text-center flex justify-center gap-2">
                  <button onClick={() => { setEditingSupply(sup); setIsSupplyModalOpen(true); }} className="text-blue-500 p-1 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => handleDeleteSupply(sup.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

  // CLIENTS VIEW
  const ClientsView = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Descuento</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 border-t border-gray-100">
                <td className="p-4 font-bold">{c.nombre_completo}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4">{c.telefono || 'N/A'}</td>
                <td className="p-4">{c.descuento_activo}%</td>
                <td className="p-4">
                  <button onClick={(e) => handleDeleteClient(e, c.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // GALLERY VIEW
  const GalleryView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Galería del Home</h2>
        <button onClick={openNewGallery} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700">
          <Plus size={18}/> Nueva Foto
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {gallery.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="h-48 overflow-hidden relative">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition group-hover:scale-105"/>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition gap-2">
                <button onClick={() => { setEditingGallery(item); setIsGalleryModalOpen(true); }} className="bg-white p-2 rounded-full text-blue-600"><Edit2 size={18}/></button>
                <button onClick={() => handleDeleteGallery(item.id)} className="bg-white p-2 rounded-full text-red-600"><Trash2 size={18}/></button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500 truncate">{item.description}</p>
              {item.price && <p className="text-sm font-bold text-pink-600 mt-2">${item.price.toLocaleString()}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // CONTENT VIEW
  const ContentView = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Contenido</h2>
      </div>
      
      {/* Banner Images */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon size={20}/> Imágenes del Banner Principal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Imagen Derecha 1 (Abajo)</label>
            {homeConfig.heroImage1 && <img src={homeConfig.heroImage1} alt="Hero 1" className="w-full h-40 object-cover rounded-lg mb-2"/>}
            <input type="file" accept="image/*" onChange={(e) => handleHeroUpload(e, 'heroImage1')} className="text-sm w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Imagen Derecha 2 (Arriba)</label>
            {homeConfig.heroImage2 && <img src={homeConfig.heroImage2} alt="Hero 2" className="w-full h-40 object-cover rounded-lg mb-2"/>}
            <input type="file" accept="image/*" onChange={(e) => handleHeroUpload(e, 'heroImage2')} className="text-sm w-full"/>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button onClick={handleSaveHomeConfig} className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold">Guardar Imágenes</button>
        </div>
      </div>

      {/* Tejedoras */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Users size={20}/> Equipo de Tejedoras</h3>
          <button
            onClick={() => { setEditingTejedora({ id: `tej-${Date.now()}`, nombre: '', especialidad: '', imageUrl: '' }); setIsTejedoraModalOpen(true); }}
            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Plus size={16}/> Agregar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tejedoras.map(t => (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3 flex gap-3 items-center">
              <img src={t.imageUrl} alt={t.nombre} className="w-12 h-12 rounded-full object-cover"/>
              <div className="flex-1">
                <p className="font-bold text-sm">{t.nombre}</p>
                <p className="text-xs text-gray-500">{t.especialidad}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingTejedora(t); setIsTejedoraModalOpen(true); }} className="p-1 text-blue-500"><Edit2 size={16}/></button>
                <button onClick={() => handleDeleteTejedora(t.id)} className="p-1 text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // COMMUNITY VIEW
  const CommunityView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Comunidad - Publicaciones</h2>
        <button onClick={openNewPost} className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-pink-700">
          <Plus size={18}/> Agregar Publicación
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group">
            <div className="h-48 overflow-hidden bg-gray-100">
              <img src={post.imageUrl} alt="post" className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition gap-2">
                <button onClick={() => { setEditingPost(post); setIsPostModalOpen(true); }} className="bg-white p-2 rounded-full text-blue-600"><Edit2 size={18}/></button>
                <button onClick={() => handleDeletePost(post.id)} className="bg-white p-2 rounded-full text-red-600"><Trash2 size={18}/></button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <img src={post.userAvatar} className="w-6 h-6 rounded-full"/>
                <span className="text-sm font-bold text-gray-700">{post.userName}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Heart size={12}/> {post.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // CHALLENGES VIEW
  const ChallengesView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Retos</h2>
        <button onClick={openNewChallenge} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700">
          <Plus size={18}/> Nuevo Reto
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Reto</th>
              <th className="p-4">Fechas</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Participantes</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {challenges.map(ch => (
              <tr key={ch.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={ch.imageUrl} className="w-10 h-10 rounded object-cover bg-gray-200"/>
                    <div>
                      <p className="font-bold">{ch.title}</p>
                      <p className="text-xs text-gray-500">{ch.difficulty}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs">
                  From: {ch.startDate}<br/>
                  To: {ch.endDate}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${ch.status === 'active' ? 'bg-green-100 text-green-700' : ch.status === 'completed' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                    {ch.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">{ch.participants}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setEditingChallenge(ch); setIsChallengeModalOpen(true); }} className="text-blue-500 p-1"><Edit2 size={16}/></button>
                  <button onClick={() => handleDeleteChallenge(ch.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // SETTINGS VIEW
  const SettingsView = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Configuración Global</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Límite para pago completo ($)</label>
          <input type="number" className="w-full border rounded-lg p-2" value={config.limite_pago_completo} onChange={(e) => setConfig({...config, limite_pago_completo: Number(e.target.value)})}/>
          <p className="text-xs text-gray-500 mt-1">Pedidos menores a este valor deben pagarse 100% por adelantado.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abono Mínimo Fijo ($)</label>
          <input type="number" className="w-full border rounded-lg p-2" value={config.abono_minimo_fijo} onChange={(e) => setConfig({...config, abono_minimo_fijo: Number(e.target.value)})}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descuento por Referido (%)</label>
          <input type="number" className="w-full border rounded-lg p-2" value={config.descuento_referido} onChange={(e) => setConfig({...config, descuento_referido: Number(e.target.value)})}/>
        </div>
        <button onClick={async () => { await db.saveConfig(config); alert('Guardado'); }} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800">Guardar Cambios</button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    </div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 shadow-sm z-10">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Admin Panel</h1>
        </div>
        <nav className="px-3 space-y-1">
          {[
            { id: 'dashboard', label: 'Resumen', icon: <LayoutDashboard size={20}/> },
            { id: 'finance', label: 'Contabilidad', icon: <PieChart size={20}/>, action: () => navigate('/admin/accounting') },
            { id: 'orders', label: 'Pedidos', icon: <ShoppingBag size={20}/> },
            { id: 'supplies', label: 'Insumos', icon: <Box size={20}/> },
            { id: 'clients', label: 'Clientes', icon: <Users size={20}/> },
            { id: 'community', label: 'Comunidad', icon: <Heart size={20}/> },
            { id: 'challenges', label: 'Retos', icon: <Trophy size={20}/> },
            { id: 'gallery', label: 'Galería', icon: <ImageIcon size={20}/> },
            { id: 'content', label: 'Contenido Inicio', icon: <PenTool size={20}/> },
            { id: 'settings', label: 'Configuración', icon: <Settings size={20}/> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id ? 'bg-pink-50 text-pink-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'supplies' && <SuppliesView />}
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'gallery' && <GalleryView />}
        {activeTab === 'content' && <ContentView />}
        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'challenges' && <ChallengesView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* MODALS */}
      
      {/* Order Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Pedido #{selectedOrder.numero_seguimiento}</h3>
              <button onClick={() => setIsOrderModalOpen(false)}><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-xl">
                <label className="block text-sm font-bold mb-2">Número de Guía Transportadora</label>
                <input type="text" className="w-full border p-2 rounded-lg" placeholder="Ej: Interrapidismo 1234567" value={trackingGuide} onChange={(e) => setTrackingGuide(e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Estado del Pedido</label>
                <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)} className="w-full p-2 border rounded">
                  <option value="En espera de agendar">En espera de agendar</option>
                  <option value="Agendado">Agendado</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Listo para entregar">Listo para entregar</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              {selectedOrder.saldo_pendiente > 0 && (
                <button onClick={handleVerifyPayment} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">Registrar Pago</button>
              )}
              <button onClick={handleUpdateStatusAndGuide} className="w-full bg-gray-900 text-white py-2 rounded-lg font-bold">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Crear Pedido Manual</h3>
              <button onClick={() => setIsCreateOrderModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Email del Cliente</label>
                <input type="email" className="w-full border p-2 rounded-lg" value={newOrderData.clientEmail} onChange={e => setNewOrderData({...newOrderData, clientEmail: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Nombre del Producto</label>
                <input type="text" className="w-full border p-2 rounded-lg" value={newOrderData.nombre_producto} onChange={e => setNewOrderData({...newOrderData, nombre_producto: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Descripción</label>
                <textarea className="w-full border p-2 rounded-lg h-24" value={newOrderData.descripcion} onChange={e => setNewOrderData({...newOrderData, descripcion: e.target.value})}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Precio Total ($)</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={newOrderData.total_final} onChange={e => setNewOrderData({...newOrderData, total_final: Number(e.target.value)})} required/>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Abono ($)</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={newOrderData.monto_pagado} onChange={e => setNewOrderData({...newOrderData, monto_pagado: Number(e.target.value)})}/>
                </div>
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white p-3 rounded-lg font-bold">Crear Pedido</button>
            </form>
          </div>
        </div>
      )}

      {/* Supply Modal */}
      {isSupplyModalOpen && editingSupply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">Editar Insumo</h3>
              <button onClick={() => setIsSupplyModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveSupply} className="space-y-4">
              <div>
                <label className="text-sm font-bold">Nombre del Producto</label>
                <input className="w-full border p-2 rounded-lg" value={editingSupply.name} onChange={e => setEditingSupply({...editingSupply, name: e.target.value})} required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Referencia</label>
                  <input className="w-full border p-2 rounded-lg" value={editingSupply.reference} onChange={e => setEditingSupply({...editingSupply, reference: e.target.value})} required/>
                </div>
                <div>
                  <label className="text-sm font-bold">Número / Calibre</label>
                  <input className="w-full border p-2 rounded-lg" value={editingSupply.number} onChange={e => setEditingSupply({...editingSupply, number: e.target.value})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Color</label>
                  <input className="w-full border p-2 rounded-lg" value={editingSupply.color} onChange={e => setEditingSupply({...editingSupply, color: e.target.value})} required/>
                </div>
                <div>
                  <label className="text-sm font-bold">Cantidad</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={editingSupply.quantity} onChange={e => setEditingSupply({...editingSupply, quantity: Number(e.target.value)})} required/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Valor Unitario ($)</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={editingSupply.unitValue} onChange={e => setEditingSupply({...editingSupply, unitValue: Number(e.target.value)})} required/>
                </div>
                <div>
                  <label className="text-sm font-bold">Alerta Stock Bajo</label>
                  <input type="number" className="w-full border p-2 rounded-lg" value={editingSupply.lowStockThreshold} onChange={e => setEditingSupply({...editingSupply, lowStockThreshold: Number(e.target.value)})} required/>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold">URL de Imagen</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg" 
                  value={editingSupply.imageUrl || ''} 
                  onChange={e => setEditingSupply({...editingSupply, imageUrl: e.target.value})}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <button type="submit" className="w-full bg-amber-600 text-white p-2 rounded-lg font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
{isGalleryModalOpen && editingGallery && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
      <h3 className="font-bold text-xl mb-4">Editar Galería</h3>
      <form onSubmit={handleSaveGallery} className="space-y-4">
        <div>
          <label className="text-sm font-bold">Título</label>
          <input className="w-full border p-2 rounded" value={editingGallery.title} onChange={(e) => setEditingGallery({...editingGallery, title: e.target.value})} required/>
        </div>
        <div>
          <label className="text-sm font-bold">Descripción</label>
          <textarea className="w-full border p-2 rounded" value={editingGallery.description} onChange={(e) => setEditingGallery({...editingGallery, description: e.target.value})} required/>
        </div>
        <div>
          <label className="text-sm font-bold">Precio</label>
          <input 
            type="number"
            placeholder="0"
            value={editingGallery.price || ''}
            onChange={(e) => setEditingGallery({...editingGallery, price: parseFloat(e.target.value) || 0})}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="text-sm font-bold">Imagen</label>
          {editingGallery.imageUrl && <img src={editingGallery.imageUrl} alt="preview" className="w-full h-32 object-cover rounded mb-2"/>}
          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setEditingGallery)}/>
        </div>
        <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded font-bold">Guardar</button>
      </form>
    </div>
  </div>
)}
      {/* Tejedora Modal */}
      {isTejedoraModalOpen && editingTejedora && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-xl mb-4">Editar Tejedora</h3>
            <form onSubmit={handleSaveTejedora} className="space-y-4">
              <div>
                <label className="text-sm font-bold">Nombre</label>
                <input className="w-full border p-2 rounded" value={editingTejedora.nombre} onChange={(e) => setEditingTejedora({...editingTejedora, nombre: e.target.value})} required/>
              </div>
              <div>
                <label className="text-sm font-bold">Especialidad</label>
                <input className="w-full border p-2 rounded" value={editingTejedora.especialidad} onChange={(e) => setEditingTejedora({...editingTejedora, especialidad: e.target.value})} required/>
              </div>
              <div>
                <label className="text-sm font-bold">Foto</label>
                {editingTejedora.imageUrl && <img src={editingTejedora.imageUrl} alt="prev" className="w-20 h-20 rounded-full object-cover mb-2"/>}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setEditingTejedora)} />
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {isPostModalOpen && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-xl mb-4">Editar Publicación</h3>
            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="text-sm font-bold">Descripción</label>
                <textarea className="w-full border p-2 rounded" rows={3} value={editingPost.description} onChange={e => setEditingPost({...editingPost, description: e.target.value})} required/>
              </div>
              <div>
                <label className="text-sm font-bold">Foto</label>
                {editingPost.imageUrl && <img src={editingPost.imageUrl} alt="preview" className="w-full h-48 object-cover rounded mb-2"/>}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setEditingPost)}/>
              </div>
              <button type="submit" className="w-full bg-pink-600 text-white p-2 rounded font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {isChallengeModalOpen && editingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="font-bold text-xl mb-4">Editar Reto</h3>
            <form onSubmit={handleSaveChallenge} className="space-y-4">
              <div>
                <label className="text-sm font-bold">Título</label>
                <input className="w-full border p-2 rounded" value={editingChallenge.title} onChange={e => setEditingChallenge({...editingChallenge, title: e.target.value})} required/>
              </div>
              <div>
                <label className="text-sm font-bold">Descripción</label>
                <textarea className="w-full border p-2 rounded" value={editingChallenge.description} onChange={e => setEditingChallenge({...editingChallenge, description: e.target.value})} required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Inicio</label>
                  <input type="date" className="w-full border p-2 rounded" value={editingChallenge.startDate} onChange={e => setEditingChallenge({...editingChallenge, startDate: e.target.value})} required/>
                </div>
                <div>
                  <label className="text-sm font-bold">Fin</label>
                  <input type="date" className="w-full border p-2 rounded" value={editingChallenge.endDate} onChange={e => setEditingChallenge({...editingChallenge, endDate: e.target.value})} required/>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold">Imagen</label>
                {editingChallenge.imageUrl && <img src={editingChallenge.imageUrl} alt="preview" className="w-full h-32 object-cover rounded mb-2"/>}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setEditingChallenge)}/>
              </div>
              <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;