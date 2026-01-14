import { Link } from 'react-router-dom';
import { uploadImage, deleteImage } from '../services/storage';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import {
  LayoutDashboard, ShoppingCart, Users, Package, DollarSign, Settings,
  Search, Eye, X, Save, ShoppingBag, Plus, Trash2, Edit2, 
  Image as ImageIcon, Upload, PenTool, Truck, Heart, Trophy, Box, PieChart, FileText, Star, ChevronDown, Pencil
} from 'lucide-react';
import { Order, Client, Supply, InventoryItem, GalleryItem, DEFAULT_CONFIG, Tejedora, HomeConfig, Post, Challenge, GlobalConfig, InsumoAmigurumi, AmigurumiRecord } from '../types';
import CompleteMigration from "../components/admin/CompleteMigration";
import { supabase } from '../lib/supabase';

// ========================================
// COMPONENTE DE AUTOCOMPLETADO INTELIGENTE
// ========================================

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder: string;
  field: 'marca' | 'referencia' | 'color';
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ 
  value, 
  onChange, 
  suggestions, 
  placeholder, 
  field,
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm disabled:bg-gray-100"
        />
        {suggestions.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown 
              size={16} 
              className={`transition-transform ${showSuggestions ? 'rotate-180' : ''}`} 
            />
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-purple-600">•</span>
                <span className="font-medium">{suggestion}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {field === 'marca' && '(En inventario)'}
                  {field === 'referencia' && '(Stock disponible)'}
                  {field === 'color' && '(Disponible)'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================
// FUNCIONES HELPER PARA SUGERENCIAS
// ========================================

const getMarcasSuggestions = (supplies: Supply[], tipo: string): string[] => {
  const tipoMap: { [key: string]: string[] } = {
    'lana': ['lana', 'hilo', 'copito', 'silviamigurumi', 'lanasol'],
    'hilo': ['lana', 'hilo', 'copito', 'silviamigurumi'],
    'ojos': ['ojos', 'seguridad'],
    'relleno': ['relleno', 'silicona']
  };
  
  const searchTerms = tipoMap[tipo.toLowerCase()] || [tipo.toLowerCase()];
  const marcas = supplies
    .filter(s => searchTerms.some(term => s.name.toLowerCase().includes(term)))
    .map(s => s.name);
  
  return [...new Set(marcas)].sort();
};

const getReferenciasSuggestions = (supplies: Supply[], marca: string): string[] => {
  if (!marca) return [];
  
  const referencias = supplies
    .filter(s => s.name.toLowerCase() === marca.toLowerCase())
    .map(s => s.reference);
  
  return [...new Set(referencias)].filter(Boolean).sort();
};

const getColoresSuggestions = (supplies: Supply[], marca: string, referencia?: string): string[] => {
  if (!marca) return [];
  
  let filtered = supplies.filter(s => 
    s.name.toLowerCase() === marca.toLowerCase()
  );
  
  if (referencia) {
    filtered = filtered.filter(s => 
      s.reference.toLowerCase() === referencia.toLowerCase()
    );
  }
  
  const colores = filtered.map(s => s.color).filter(Boolean);
  return [...new Set(colores)].sort();
};

const isInsumoInInventory = (supplies: Supply[], insumo: InsumoAmigurumi): boolean => {
  return supplies.some(s => 
    s.name.toLowerCase() === insumo.marca.toLowerCase() &&
    s.color.toLowerCase() === insumo.color.toLowerCase() &&
    (insumo.referencia ? s.reference.toLowerCase() === insumo.referencia.toLowerCase() : true)
  );
};

// ========================================
// COMPONENTE PRINCIPAL - ADMIN DASHBOARD
// ========================================

const AdminDashboard: React.FC = () => {
  // ========================================
  // HOOKS Y VARIABLES GLOBALES
  // ========================================
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  // ========================================
  // ESTADOS PARA DATOS DE LA APLICACIÓN
  // ========================================
  
  // Datos principales
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [config, setConfig] = useState<GlobalConfig>({ limite_pago_completo: 70000, abono_minimo_fijo: 50000, descuento_referido: 10 });
  const [homeConfig, setHomeConfig] = useState<HomeConfig>({ 
  heroImage1: '', 
  heroImage2: '',
  cardPrice1: '$30.00',
  cardPrice2: '$27.00',
  cardPrice3: '$26.00',
  cardPrice4: '$25.00',
  cardPrice5: '$24.00', // Nueva
  cardPrice6: '$23.00', // Nueva
  cardPrice7: '$22.00', // Nueva
  cardImage3: '',
  cardImage4: '',
  cardImage5: '',
  cardImage6: '', // Nueva
  cardImage7: '', // Nueva
  cardImage8: ''  // Nueva
});

  const [tejedoras, setTejedoras] = useState<Tejedora[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  // 🆕 ESTADOS PARA CONTENIDO DEL SITIO
  const [siteStats, setSiteStats] = useState({
    amigurumiCount: 17,
    clientCount: 17,
    rating: 4.9,
    yearsExperience: 5
  });

  const [editableSections, setEditableSections] = useState({
    valuePropsTitle: '¿Por Qué Elegirnos?',
    statsTitle: 'Nuestro Impacto',
    statsSubtitle: 'Números que hablan por nosotros',
    testimonialsTitle: 'Lo Que Dicen Nuestros Clientes',
    testimonialsSubtitle: 'Más de 450 clientes satisfechos'
  });

  // 🆕 ESTADOS PARA INSUMOS POR AMIGURUMI (Mantenidos para modales globales si existieran)
  const [amigurumiRecords, setAmigurumiRecords] = useState<AmigurumiRecord[]>([]);
  const [isAmigurumiModalOpen, setIsAmigurumiModalOpen] = useState(false);
  const [editingAmigurumi, setEditingAmigurumi] = useState<AmigurumiRecord | null>(null);
  const [currentInsumoAmigurumi, setCurrentInsumoAmigurumi] = useState<InsumoAmigurumi>({
    id: '',
    tipo: 'lana',
    marca: '',
    referencia: '',
    color: '',
    cantidad: '',
    unidad: 'gramos'
  });

  // ========================================
  // ESTADOS PARA MODALES
  // ========================================
  
  // Modales de pedidos
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderClient, setOrderClient] = useState<Client | null>(null);
  
  // 🆕 ESTADOS PARA EDICIÓN DE DATOS DEL CLIENTE EN EL MODAL
  const [editingOrderClientName, setEditingOrderClientName] = useState('');
  const [editingOrderClientEmail, setEditingOrderClientEmail] = useState('');
  const [editingOrderClientPhone, setEditingOrderClientPhone] = useState('');
  const [editingOrderTotal, setEditingOrderTotal] = useState(0);
  const [editingOrderPaid, setEditingOrderPaid] = useState(0);

  // 🆕 ESTADO PARA TIPO DE EMPAQUE (CAMBIO SOLICITADO)
  const [tipoEmpaqueOrder, setTipoEmpaqueOrder] = useState<'cupula_vidrio' | 'caja_carton' | 'bolsa_organza' | 'sin_empaque'>('cupula_vidrio');

  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    clientEmail: '',
    clientName: '',
    clientPhone: '',
    nombre_producto: '',
    descripcion: '',
    total_final: 0,
    monto_pagado: 0,
    imagen: null as File | null,
    imagenPreview: '',
    tipo_empaque: '' as 'cupula_vidrio' | 'caja_carton' | 'bolsa_organza' | 'sin_empaque' // 🆕 Inicializado en vacío para el select dinámico
  });
  const [showNotificationOptions, setShowNotificationOptions] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

  // Estados para actualización de pedidos
  const [statusUpdate, setStatusUpdate] = useState('');
  const [trackingGuide, setTrackingGuide] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [finalImageFile, setFinalImageFile] = useState<File | null>(null);
  const [finalImagePreview, setFinalImagePreview] = useState<string>('');
  const [uploadingFinalImage, setUploadingFinalImage] = useState(false);
  
  // Modales de clientes
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Modales de galería
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  
  // Modales de tejedoras
  const [isTejedoraModalOpen, setIsTejedoraModalOpen] = useState(false);
  const [editingTejedora, setEditingTejedora] = useState<Tejedora | null>(null);
  
  // Modales de retos
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  
  // Modales de publicaciones
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Modales de insumos
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);

  // 🆕 INVENTORY STATES
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [activeInventoryCategory, setActiveInventoryCategory] = useState<'sizes' | 'packaging' | 'accessories'>('sizes');

  // ========================================
  // FUNCIONES PARA GUARDAR CONTENIDO DEL SITIO
  // ========================================
  
  const handleSaveSiteStats = async () => {
    try {
      await db.updateSiteStats(siteStats);
      alert('✅ Estadísticas guardadas correctamente');
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('❌ Error al guardar estadísticas');
    }
  };

  const handleSaveEditableSections = async () => {
    try {
      await db.updateEditableSections(editableSections);
      alert('✅ Títulos guardados correctamente');
    } catch (error) {
      console.error('Error saving sections:', error);
      alert('❌ Error al guardar títulos');
    }
  };

  // ========================================
  // FUNCIONES PARA INSUMOS DE AMIGURUMI (MANTENIDAS PARA MODAL RÁPIDO)
  // ========================================
  
  const loadAmigurumiRecords = async (): Promise<AmigurumiRecord[]> => {
    try {
      const { data, error } = await db.getAmigurumiRecords();
      if (error) {
        console.error('Error cargando amigurumis:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error al cargar amigurumis:', error);
      return [];
    }
  };

  const saveAmigurumiRecord = async (amigurumiData: AmigurumiRecord) => {
    try {
      setLoading(true);
      console.log('💾 Guardando amigurumi...', amigurumiData);
      
      if (!amigurumiData.nombre || !amigurumiData.nombre.trim()) {
        alert('❌ El nombre del amigurumi es obligatorio');
        return;
      }
      
      if (!amigurumiData.insumos || amigurumiData.insumos.length === 0) {
        alert('❌ Debes agregar al menos un insumo');
        return;
      }
      
      const exists = amigurumiData.id && amigurumiRecords.some(a => a.id === amigurumiData.id);
      
      if (!amigurumiData.id) {
        amigurumiData.id = `amg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      if (exists) {
        console.log('📝 Actualizando amigurumi existente:', amigurumiData.id);
        const { data, error } = await db.updateAmigurumiRecord(amigurumiData.id, {
          nombre: amigurumiData.nombre,
          insumos: amigurumiData.insumos
        });
        
        if (error) {
          console.error('❌ Error al actualizar:', error);
          throw new Error(`Error al actualizar: ${error.message || 'Error desconocido'}`);
        }
        
        console.log('✅ Respuesta de actualización:', data);
        alert('✅ Amigurumi actualizado correctamente');
      } else {
        console.log('🆕 Creando nuevo amigurumi:', amigurumiData.id);
        const { data, error } = await db.createAmigurumiRecord(amigurumiData);
        
        if (error) {
          console.error('❌ Error al crear:', error);
          throw new Error(`Error al crear: ${error.message || 'Error desconocido'}`);
        }
        
        console.log('✅ Respuesta de creación:', data);
        alert('✅ Amigurumi creado correctamente');
      }
      
      await loadData();
      
    } catch (error) {
      console.error('❌ Error al guardar amigurumi:', error);
      alert(`❌ Error al guardar: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAmigurumiRecord = async (id: string) => {
    if (!confirm('¿Eliminar este registro de amigurumi?')) return;
    try {
      const { error } = await db.deleteAmigurumiRecord(id);
      if (error) throw error;
      await loadData();
      alert('✅ Amigurumi eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('❌ Error al eliminar: ' + (error as Error).message);
    }
  };

  const handleSaveAmigurumiRecordModal = async () => {
    if (!editingAmigurumi) {
      alert('❌ No hay datos para guardar');
      return;
    }
    
    console.log('💾 Preparando para guardar:', editingAmigurumi);
    
    if (!editingAmigurumi.nombre || !editingAmigurumi.nombre.trim()) {
      alert('❌ Por favor ingresa el nombre del amigurumi');
      return;
    }
    
    if (!editingAmigurumi.insumos || editingAmigurumi.insumos.length === 0) {
      alert('❌ Por favor agrega al menos un insumo');
      return;
    }
    
    const amigurumiData: AmigurumiRecord = {
      id: editingAmigurumi.id || `amg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: editingAmigurumi.nombre.trim(),
      insumos: editingAmigurumi.insumos
    };
    
    console.log('📦 Datos a guardar:', amigurumiData);
    
    await saveAmigurumiRecord(amigurumiData);
    
    setIsAmigurumiModalOpen(false);
    setEditingAmigurumi(null);
    setCurrentInsumoAmigurumi({
      id: '',
      tipo: 'lana',
      marca: '',
      referencia: '',
      color: '',
      cantidad: '',
      unidad: 'gramos'
    });
  };

  // ========================================
  // FUNCIONES AUXILIARES UI PARA INSUMOS (Mantenidas para Modal Rápido)
  // ========================================

  const handleAddInsumoToAmigurumi = () => {
    if (!editingAmigurumi) return;
    if (!currentInsumoAmigurumi.marca || !currentInsumoAmigurumi.color) {
      alert('Completa marca y color');
      return;
    }
    setEditingAmigurumi({
      ...editingAmigurumi,
      insumos: [
        ...editingAmigurumi.insumos,
        { ...currentInsumoAmigurumi, id: Date.now().toString() }
      ]
    });
    setCurrentInsumoAmigurumi({
      id: '',
      tipo: 'lana',
      marca: '',
      referencia: '',
      color: '',
      cantidad: '',
      unidad: 'gramos'
    });
  };

  const handleRemoveInsumoFromAmigurumi = (id: string) => {
    if (!editingAmigurumi) return;
    setEditingAmigurumi({
      ...editingAmigurumi,
      insumos: editingAmigurumi.insumos.filter(i => i.id !== id)
    });
  };

  const handleReferenciaChangeModal = (referencia: string) => {
    const insumoEnStock = supplies.find(
      s => s.reference.toLowerCase() === referencia.toLowerCase()
    );

    if (insumoEnStock) {
      setCurrentInsumoAmigurumi({
        ...currentInsumoAmigurumi,
        referencia: referencia,
        marca: insumoEnStock.name,
        color: insumoEnStock.color
      });
    } else {
      setCurrentInsumoAmigurumi({
        ...currentInsumoAmigurumi,
        referencia: referencia
      });
    }
  };

  const checkInsumoStock = (insumo: InsumoAmigurumi): { enStock: boolean; stockBajo: boolean; supply?: Supply } => {
    const supply = supplies.find(
      s => s.reference.toLowerCase() === insumo.referencia.toLowerCase() &&
           s.color.toLowerCase() === insumo.color.toLowerCase()
    );
    
    if (supply) {
      return {
        enStock: true,
        stockBajo: supply.quantity <= supply.lowStockThreshold,
        supply
      };
    }
    
    return { enStock: false, stockBajo: false };
  };

  const openNewAmigurumiRecord = () => {
    setEditingAmigurumi({
      id: '',
      nombre: '',
      insumos: [],
      fechaActualizacion: new Date().toISOString()
    });
    setIsAmigurumiModalOpen(true);
  };

  // ========================================
  // CARGA DE DATOS INICIAL
  // ========================================
  
  const loadData = async () => {
  setLoading(true);
  try {
    const [
      ordersData, 
      clientsData, 
      suppliesData, 
      inventoryData, 
      galleryResponse, // 🔧 CAMBIADO
      configData, 
      homeData, 
      teamData, 
      postsData, 
      challengesData, 
      referralsData,
      statsData,
      sectionsData
    ] = await Promise.all([
      db.getOrders(),
      db.getAllClients(),
      db.getSupplies(),
      db.getInventoryItems(),
      db.getGallery(1, 100), // 🔧 Pedir 100 items
      db.getConfig(),
      db.getHomeConfig(),
      db.getTejedoras(),
      db.getPosts(),
      db.getChallenges(),
      db.getAllReferrals(),
      db.getSiteStats(),
      db.getEditableSections()
    ]);
    
    setOrders(ordersData);
    setClients(clientsData);
    setSupplies(suppliesData);
    setInventoryItems(inventoryData);
    setGallery(galleryResponse.data); // 🔧 Extraer .data
    setConfig(configData);
    setHomeConfig(homeData);
    setTejedoras(teamData);
    setPosts(postsData);
    setChallenges(challengesData);
    setReferrals(referralsData);
    setSiteStats(statsData);
    setEditableSections(sectionsData);
    
    const amigurumiData = await loadAmigurumiRecords();
    setAmigurumiRecords(amigurumiData);
    
  } catch (error) {
    console.error('Failed to load data:', error);
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

  // ========================================
  // MANEJO DE PEDIDOS
  // ========================================
  
  const handleOpenOrder = async (order: Order) => {
    console.log('🔍 Abriendo pedido #', order.numero_seguimiento);
    console.log('📸 final_image_url en el pedido:', order.final_image_url);
    console.log('📦 Objeto completo:', order);
    
    setSelectedOrder(order);
    setStatusUpdate(order.estado);
    setTrackingGuide(order.guia_transportadora || '');
    setTipoEmpaqueOrder((order as any).tipo_empaque || ''); // ✅ NUEVA LÍNEA
    
    setFinalImageFile(null);
    setFinalImagePreview('');

    try {
      // 🔧 PRIMERO cargar info del cliente de la BD
      const clientInfo = await db.getClientByEmail(order.clientEmail);
      setOrderClient(clientInfo);
      
      // 🔧 LUEGO inicializar estados con prioridad: datos del pedido > datos del cliente BD > valores por defecto
      setEditingOrderClientName(order.clientName || clientInfo?.nombre_completo || '');
      setEditingOrderClientEmail(order.clientEmail || '');
      setEditingOrderClientPhone(order.clientPhone || clientInfo?.telefono || '');
      
    } catch (error) {
      console.error('Error al cargar información del cliente:', error);
      setOrderClient(null);
      
      // 🔧 Si no hay cliente en BD, usar solo los datos del pedido
      setEditingOrderClientName(order.clientName || '');
      setEditingOrderClientEmail(order.clientEmail || '');
      setEditingOrderClientPhone(order.clientPhone || '');
    }

    setEditingOrderTotal(order.total_final || 0);
    setEditingOrderPaid(order.monto_pagado || 0);

    setIsOrderModalOpen(true);
  };

  const handleFinalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFinalImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setFinalImageFile(file);
  };

  const handleUploadFinalImage = async () => {
    if (!finalImageFile || !selectedOrder) return;

    setUploadingFinalImage(true);
    try {
      console.log('📤 Subiendo imagen final para pedido:', selectedOrder.id);
      const imageUrl = await uploadImage(finalImageFile, 'orders');
      console.log('✅ Imagen subida a Storage:', imageUrl);
      
      if (imageUrl) {
        console.log('💾 Actualizando pedido en BD...');
        await db.updateOrder(selectedOrder.id, {
          final_image_url: imageUrl
        });
        console.log('✅ Pedido actualizado en BD');

        alert('✅ Imagen final subida correctamente');
        setFinalImageFile(null);
        setFinalImagePreview('');
        
        setSelectedOrder({...selectedOrder, final_image_url: imageUrl});
        console.log('✅ Estado local actualizado');
        
        await loadData();
        console.log('✅ Datos recargados');
      }
    } catch (error) {
      console.error('❌ Error uploading final image:', error);
      alert('Error al subir la imagen final');
    } finally {
      setUploadingFinalImage(false);
    }
  };

  const handleDeleteFinalImage = async () => {
    if (!selectedOrder?.final_image_url) return;
    
    if (!window.confirm('¿Eliminar la imagen final del amigurumi?')) return;

    try {
      await deleteImage(selectedOrder.final_image_url);
      
      await db.updateOrder(selectedOrder.id, {
        final_image_url: null
      });

      alert('✅ Imagen final eliminada');
      setSelectedOrder({...selectedOrder, final_image_url: undefined});
      loadData();
    } catch (error) {
      console.error('Error deleting final image:', error);
      alert('Error al eliminar la imagen');
    }
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
  
  try {
    const updateData: any = {
      estado: statusUpdate,
      guia_transportadora: trackingGuide,
      clientName: editingOrderClientName || selectedOrder.clientName || '',  // ✅
      clientPhone: editingOrderClientPhone || selectedOrder.clientPhone || '', // ✅
      total_final: editingOrderTotal,
      monto_pagado: editingOrderPaid,
      saldo_pendiente: editingOrderTotal - editingOrderPaid,
      tipo_empaque: tipoEmpaqueOrder // ✅ NUEVA LÍNEA
    };

    console.log('💾 Actualizando pedido con datos:', updateData);

    await db.updateOrder(selectedOrder.id, updateData);
    
    setSelectedOrder({
      ...selectedOrder,
      clientName: updateData.clientName,
      clientPhone: updateData.clientPhone,
      estado: statusUpdate,
      guia_transportadora: trackingGuide,
      total_final: updateData.total_final,
      monto_pagado: updateData.monto_pagado,
      saldo_pendiente: updateData.saldo_pendiente
    });

    alert('✅ Pedido actualizado correctamente');
    
    const shouldNotify = window.confirm(
      '¿Deseas enviar una notificación por WhatsApp al cliente sobre esta actualización?'
    );
    
    if (shouldNotify) {
      sendOrderUpdateNotification();
    }
    
    setIsOrderModalOpen(false);
    await loadData();
  } catch (error) {
    console.error('Error updating order:', error);
    alert('❌ Error al actualizar el pedido');
  }
};

// Nueva función para enviar notificación de actualización
const sendOrderUpdateNotification = () => {
  if (!selectedOrder) return;
  
  // Usar los datos editados actuales para notificar
  const clientName = editingOrderClientName || orderClient?.nombre_completo || 'Cliente';
  const clientPhone = editingOrderClientPhone || orderClient?.telefono || '';
  const clientEmail = editingOrderClientEmail || selectedOrder.clientEmail;
  
  const phone = clientPhone.replace(/\D/g, '') || '';
  if (!phone) {
    alert('❌ El cliente no tiene teléfono registrado');
    return;
  }
  
  const formattedPhone = phone.startsWith('57') ? phone : `57${phone}`;
  
  let statusEmoji = '📦';
  let statusMessage = '';
  
  switch (statusUpdate) {
    case 'Agendado':
      statusEmoji = '✅';
      statusMessage = 'Tu pedido ha sido *agendado* y pronto comenzaremos a trabajar en él.';
      break;
    case '¡Ya estamos tejiendo tu pedido! Pronto estará listo.':
      statusEmoji = '🧵';
      statusMessage = '¡Ya estamos tejiendo tu amigurumi! Pronto estará listo.';
      break;
    case 'Tu Amigurumi ya fue tejido.':
      statusEmoji = '✨';
      statusMessage = '¡Tu amigurumi ya fue tejido y está quedando hermoso!';
      break;
    case 'Listo para entregar':
      statusEmoji = '🎁';
      statusMessage = '¡Tu amigurumi ya fue tejido y está listo! Ya puedes recogerlo.';
      break;
    case 'Entregado':
      statusEmoji = '🎉';
      statusMessage = 'Tu pedido ha sido *entregado*. ¡Esperamos que lo disfrutes!';
      break;
    case 'Cancelado':
      statusEmoji = '❌';
      statusMessage = 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.';
      break;
    default:
      statusMessage = `El estado de tu pedido ha cambiado a: *${statusUpdate}*`;
  }
  
  // 🆕 Mensajes personalizados según el tipo de empaque
  const tipoEmpaque = tipoEmpaqueOrder || '';
  let cuidadoProducto = '';
  
  if (tipoEmpaque && tipoEmpaque !== 'sin_empaque') {
    // Tiene empaque específico - mostrar nombre sin precio
    cuidadoProducto = `⚠️ *IMPORTANTE - CUIDADO DEL PRODUCTO:*
Tu pedido viene empacado en: *${tipoEmpaque}*
Te recomendamos:
- Manipular con cuidado
- Guardar en lugar seco cuando no esté en uso`;
  } else if (tipoEmpaque === 'sin_empaque') {
    // Sin empaque
    cuidadoProducto = `⚠️ *IMPORTANTE - CUIDADO DEL PRODUCTO:*
Te recomendamos:
- Manipular con las manos limpias
- Guardar en lugar seco cuando no esté en uso`;
  }

  const infoPago = selectedOrder.saldo_pendiente > 0 ? `
💳 *DATOS DE PAGO:*
- *Bre-B:* @sandrab1072
- *Cuenta de ahorros Bancolombia:* 123-456-789-00
` : '';
  
  const message = `
Hola *${clientName}*, 👋

 ${statusEmoji} *Actualización de tu Pedido #${selectedOrder.numero_seguimiento}*

 ${statusMessage}

📋 *Detalles:*
- Producto: ${selectedOrder.nombre_producto}
- Estado actual: *${statusUpdate}*
 ${trackingGuide ? `• 📮 Guía de envío: *${trackingGuide}*` : ''}
 ${selectedOrder.saldo_pendiente > 0 ? `• 💰 Saldo pendiente: ${selectedOrder.saldo_pendiente.toLocaleString('es-CO')}` : ''}
 ${infoPago}
 ${trackingGuide && statusUpdate === 'Listo para entregar' ? `
📦 Puedes rastrear tu envío aquí: 👇
https://www.google.com/search?q=${encodeURIComponent(trackingGuide)}
` : ''}
 ${cuidadoProducto}

¡Gracias por confiar en *Puntadas de Mechis*! ✨
`.trim();
  
  const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappLink, '_blank');
};
  const handleDeleteOrder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este pedido?')) {
      await db.deleteOrder(orderId);
      loadData();
    }
  };

  // ========================================
  // MANEJO DE CREACIÓN DE PEDIDOS
  // ========================================
  
  const handleOrderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es muy grande. Máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewOrderData(prev => ({
          ...prev,
          imagen: file,
          imagenPreview: ev.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderData.clientEmail || !newOrderData.nombre_producto || newOrderData.total_final <= 0) {
      alert("Completa los campos obligatorios");
      return;
    }

    try {
      console.log('🔍 Verificando si el cliente existe:', newOrderData.clientEmail);
      let clientExists = await db.getClientByEmail(newOrderData.clientEmail);
      
      if (!clientExists) {
        console.log('📝 Cliente no existe, creando automáticamente...');
        
        await db.registerClient({
          nombre_completo: newOrderData.clientName || 'Cliente Manual',
          email: newOrderData.clientEmail,
          telefono: newOrderData.clientPhone || '',
          cedula: '',
          direccion: '',
          password: `temp${Date.now()}`
        });
        
        console.log('✅ Cliente creado exitosamente');
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log('✅ Cliente ya existe en la base de datos');
      }

      const saldo = newOrderData.total_final - newOrderData.monto_pagado;
      
      let finalImageUrl = 'https://placehold.co/400x400/e8e8e8/666666?text=Pedido+Manual';
      if (newOrderData.imagen) {
        setUploadingImage(true);
        const uploadedUrl = await uploadImage(newOrderData.imagen, 'orders');
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
        setUploadingImage(false);
      }

      const newOrder = {
        numero_seguimiento: Math.floor(100000 + Math.random() * 900000).toString(),
        clientEmail: newOrderData.clientEmail,
        clientName: newOrderData.clientName, // ✅ Agregado
        clientPhone: newOrderData.clientPhone, // ✅ Agregado
        nombre_producto: newOrderData.nombre_producto,
        descripcion: newOrderData.descripcion || 'Pedido creado manualmente',
        estado: (saldo === 0 ? 'Agendado' : 'En espera de agendar') as any,
        fecha_solicitud: new Date().toISOString().split('T')[0],
        total_final: newOrderData.total_final,
        monto_pagado: newOrderData.monto_pagado,
        saldo_pendiente: saldo,
        imagen_url: finalImageUrl,
        tipo_empaque: newOrderData.tipo_empaque, // ✅ AGREGADO
        desglose: { precio_base: newOrderData.total_final, empaque: 0, accesorios: 0, descuento: 0 }
      };

      console.log('💾 Guardando pedido:', newOrder.numero_seguimiento);
      await db.addOrder(newOrder as any);
      console.log('✅ Pedido guardado exitosamente');
      
      setCreatedOrderNumber(newOrder.numero_seguimiento);
      setShowNotificationOptions(true);
      
      await loadData();
      
      alert('✅ Pedido creado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      alert(`Error al crear el pedido: ${(error as Error).message}`);
    }
  };

  const sendEmailNotification = () => {
    const saldo = newOrderData.total_final - newOrderData.monto_pagado;
    const subject = `Nuevo Pedido #${createdOrderNumber} - Puntadas de Mechis`;
    const body = `
Hola ${newOrderData.clientName || 'Cliente'},

Tu pedido ha sido creado exitosamente:

📦 Número de Seguimiento: #${createdOrderNumber}
🎨 Producto: ${newOrderData.nombre_producto}
📝 Descripción: ${newOrderData.descripcion || 'Sin descripción'}
💰 Total a Pagar: $${newOrderData.total_final.toLocaleString()}
✅ Abono Realizado: $${newOrderData.monto_pagado.toLocaleString()}
⏳ Saldo Pendiente: $${saldo.toLocaleString()}

Gracias por tu preferencia.

Puntadas de Mechis
  `.trim();

    const mailtoLink = `mailto:${newOrderData.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    closeCreateOrderModal();
  };
  const sendWhatsAppNotification = (phone: string, tejedoraName: string) => {
    const saldo = newOrderData.total_final - newOrderData.monto_pagado;
    const message = `
🎉 *Nuevo Pedido #${createdOrderNumber}*

👤 Cliente: ${newOrderData.clientName || newOrderData.clientEmail}
📞 Teléfono: ${newOrderData.clientPhone || 'No proporcionado'}

📦 *Detalles del Pedido:*
🎨 Producto: ${newOrderData.nombre_producto}
📝 Descripción: ${newOrderData.descripcion || 'Sin descripción'}

💰 *Información de Pago:*
• Total: $${newOrderData.total_final.toLocaleString()}
• Abono: $${newOrderData.monto_pagado.toLocaleString()}
• Saldo Pendiente: $${saldo.toLocaleString()}

✨ _Puntadas de Mechis_
  `.trim();

    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  const sendClientWhatsAppNotification = () => {
    const saldo = newOrderData.total_final - newOrderData.monto_pagado;
    const message = `
Hola *${newOrderData.clientName || 'Cliente'}*, 👋

Tu pedido en *Puntadas de Mechis* ha sido creado exitosamente:

📦 *Número de Seguimiento:* #${createdOrderNumber}
🎨 *Producto:* ${newOrderData.nombre_producto}
📝 *Descripción:* ${newOrderData.descripcion || 'Sin descripción'}

💰 *Resumen de Pago:*
• Total: $${newOrderData.total_final.toLocaleString()}
• Abono: $${newOrderData.monto_pagado.toLocaleString()}
• Saldo Pendiente: $${saldo.toLocaleString()}

Puedes hacer seguimiento a tu pedido en nuestro sitio web con tu número de seguimiento.

¡Gracias por tu preferencia! ✨
  `.trim();

    const phone = newOrderData.clientPhone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('57') ? phone : `57${phone}`;
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  const closeCreateOrderModal = () => {
    setIsCreateOrderModalOpen(false);
    setShowNotificationOptions(false);
    setCreatedOrderNumber('');
    setNewOrderData({ 
      clientEmail: '', 
      clientName: '', 
      clientPhone: '', 
      nombre_producto: '', 
      descripcion: '', 
      total_final: 0, 
      monto_pagado: 0,
      imagen: null,
      imagenPreview: '',
      tipo_empaque: '' // ✅ AGREGADO (Reseteado a vacío)
    });
  };

  // ========================================
  // MANEJO DE REFERIDOS
  // ========================================
  
  const handleDeleteReferral = async (id: string) => {
    if (confirm("¿Eliminar este referido?")) {
      await db.deleteReferral(id);
      loadData();
    }
  };

  // ========================================
  // MANEJO DE INSUMOS
  // ========================================
  
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

  const openNewSupply = () => {
    setEditingSupply({
      id: `sup-${Date.now()}`,
      name: '',
      reference: '',
      unitValue: 0,
      quantity: 0,
      color: '',
      number: '',
      lowStockThreshold:5,
      imageUrl: ''
    });
    setIsSupplyModalOpen(true);
  };

  // ========================================
  // MANEJO DE CLIENTES
  // ========================================
  
  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este cliente?')) {
      await db.deleteClient(clientId);
      loadData();
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      await db.updateClient(editingClient.id, {
        nombre_completo: editingClient.nombre_completo,
        email: editingClient.email,
        telefono: editingClient.telefono,
        cedula: editingClient.cedula,
        direccion: editingClient.direccion,
        descuento_activo: editingClient.descuento_activo
      });
      setIsClientModalOpen(false);
      setEditingClient(null);
      loadData();
      alert('✅ Cliente actualizado correctamente');
    } catch (error) {
      console.error('Error updating client:', error);
      alert('❌ Error al actualizar el cliente');
    }
  };

// ========================================
// MANEJO DE GALERÍA
// ========================================

const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>, 
  setter: (val: any) => void
) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validar tamaño (5MB máx)
  if (file.size > 5 * 1024 * 1024) {
    alert("Imagen muy pesada (máx 5MB)");
    return;
  }
  
  try {
    console.log('📤 Subiendo imagen a Supabase Storage...');
    
    // Subir a Supabase Storage
    const imageUrl = await uploadImage(file, 'gallery');
    
    if (imageUrl) {
      console.log('✅ Imagen subida:', imageUrl);
      
      // Actualizar el estado con la URL de Supabase
      setter((prev: any) => prev ? { ...prev, imageUrl } : null);
      
      alert('✅ Imagen cargada correctamente');
    } else {
      alert('❌ Error al subir la imagen');
    }
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    alert('Error al subir la imagen');
  }
};

const handleSaveGallery = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!editingGallery) {
    alert('❌ No hay datos para guardar');
    return;
  }
  
  // Validar campos requeridos
  if (!editingGallery.title || !editingGallery.description) {
    alert('❌ Por favor completa título y descripción');
    return;
  }
  
  if (!editingGallery.imageUrl) {
    alert('❌ Por favor sube una imagen');
    return;
  }
  
  try {
    console.log('💾 Guardando en galería:', editingGallery);
    
    const exists = gallery.some(g => g.id === editingGallery.id);
    
    if (exists) {
      console.log('🔄 Actualizando imagen existente');
      await db.updateGalleryItem(editingGallery);
      alert('✅ Imagen actualizada correctamente');
    } else {
      console.log('🆕 Agregando nueva imagen');
      await db.addGalleryItem(editingGallery);
      alert('✅ Imagen agregada a la galería');
    }
    
    setIsGalleryModalOpen(false);
    setEditingGallery(null);
    await loadData(); // Recargar datos
    
  } catch (error: any) {
    console.error('❌ Error saving gallery:', error);
    alert('❌ Error al guardar: ' + (error.message || 'Error desconocido'));
  }
};

const handleDeleteGallery = async (id: string) => {
  if (!confirm('¿Eliminar esta imagen de la galería?')) return;
  
  try {
    console.log('🗑️ Eliminando imagen:', id);
    
    // Obtener la imagen antes de borrarla para eliminar el archivo de Storage
    const item = gallery.find(g => g.id === id);
    
    if (item?.imageUrl && item.imageUrl.includes('supabase')) {
      console.log('🗑️ Eliminando archivo de Storage...');
      await deleteImage(item.imageUrl);
    }
    
    await db.deleteGalleryItem(id);
    
    alert('✅ Imagen eliminada correctamente');
    await loadData();
  } catch (error) {
    console.error('❌ Error deleting gallery:', error);
    alert('Error al eliminar la imagen');
  }
};

const openNewGallery = () => {
  setEditingGallery({ 
    id: `gal-${Date.now()}`, 
    title: '', 
    description: '', 
    imageUrl: '', 
    category: 'Sin categoría', // 🆕 Agregado
    price: 0 
  });
  setIsGalleryModalOpen(true);
};

  // ========================================
  // MANEJO DE CONTENIDO DEL HOME
  // ========================================
  
  const handleSaveHomeConfig = async () => {
    await db.saveHomeConfig(homeConfig);
    alert('Configuración guardada');
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

  // ========================================
  // MANEJO DE TEJEDORAS (CORREGIDO)
  // ========================================
  
  const handleSaveTejedora = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTejedora) {
      alert('❌ No hay datos para guardar');
      return;
    }

    if (!editingTejedora.nombre || !editingTejedora.especialidad) {
      alert('❌ Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const newList = tejedoras.some(t => t.id === editingTejedora.id)
        ? tejedoras.map(t => t.id === editingTejedora.id ? editingTejedora : t)
        : [...tejedoras, editingTejedora];

      await db.saveTejedoras(newList);
      
      alert('✅ Tejedora guardada correctamente');
      setIsTejedoraModalOpen(false);
      setEditingTejedora(null);
      await loadData();
      
    } catch (error) {
      console.error('❌ Error al guardar tejedora:', error);
      alert('❌ Error al guardar tejedora. Revisa la consola para más detalles.');
    }
  };

  const handleDeleteTejedora = async (id: string) => {
    if (!confirm("¿Eliminar tejedora?")) {
      return;
    }

    try {
      await db.deleteTejedora(id);
      alert('✅ Tejedora eliminada correctamente');
      await loadData();
    } catch (error) {
      console.error('❌ Error al eliminar tejedora:', error);
      alert('❌ Error al eliminar tejedora. Revisa la consola para más detalles.');
    }
  };

  // ========================================
  // MANEJO DE PUBLICACIONES DE COMUNIDAD
  // ========================================
  
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

  // ========================================
  // MANEJO DE RETOS
  // ========================================
  
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

  // ========================================
  // MANEJO DE INVENTARIO
  // ========================================
  
  const openNewInventoryItem = () => {
    setEditingInventoryItem({
      id: `inv-${Date.now()}`,
      category: activeInventoryCategory,
      label: '',
      price: 0
    });
    setIsInventoryModalOpen(true);
  };

  const handleSaveInventoryItem = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingInventoryItem || !editingInventoryItem.label || editingInventoryItem.price <= 0) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const exists = inventoryItems.some(i => i.id === editingInventoryItem.id);
      if (exists) {
        await db.updateInventoryItem(editingInventoryItem);
      } else {
        await db.addInventoryItem(editingInventoryItem);
      }
      setIsInventoryModalOpen(false);
      setEditingInventoryItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Error al guardar');
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    if (!confirm('¿Eliminar este item del inventario?')) return;
    await db.deleteInventoryItem(id);
    loadData();
  };

  // ========================================
  // MANEJO DE ARCHIVOS DE INSUMOS
  // ========================================
  
  const handleSupplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSupply) return;

    setUploadingImage(true);
    
    try {
      const imageUrl = await uploadImage(file, 'supplies');
      
      if (imageUrl) {
        setEditingSupply({ ...editingSupply, imageUrl });
        alert('Imagen cargada exitosamente');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al cargar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteSupply = async (id: string) => {
    if (!confirm('¿Eliminar este insumo?')) return;
    
    const supply = supplies.find(s => s.id === id);
    
    if (supply?.imageUrl && supply.imageUrl.includes('supplies-images')) {
      await deleteImage(supply.imageUrl);
    }
    
    await db.deleteSupply(id);
    loadData();
  };

  // ========================================
  // MANEJO DE ESTADOS DE REFERIDOS
  // ========================================
  
  const handleUpdateReferralStatus = async (referralId: string, status: string) => {
    try {
      await db.updateReferral(referralId, { status });
      alert('Estado del referido actualizado');
      loadData();
    } catch (error) {
      console.error('Error al actualizar estado del referido:', error);
      alert('Error al actualizar estado del referido');
    }
  };

    const handleAddReferral = async () => {
    const name = prompt('Ingrese el nombre del referido:');
    if (!name || !name.trim()) {
      alert('❌ El nombre es obligatorio');
      return;
    }

    const email = prompt('Ingrese el email del referido:');
    if (!email || !email.trim()) {
      alert('❌ El email es obligatorio');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('❌ El email no tiene un formato válido');
      return;
    }
    
    // Mostrar lista de clientes para obtener el ID fácilmente
    const clientsList = clients.map(c => `${c.nombre_completo} (${c.email})\nID: ${c.id}\n`).join('\n');
    const referrerId = prompt(`Selecciona un referente copiando su ID:\n\n${clientsList}`);
    if (!referrerId || !referrerId.trim()) {
      alert('❌ Debes seleccionar un referente');
      return;
    }

    // Verificar si el ID existe en la lista de clientes
    const referrer = clients.find(c => c.id === referrerId.trim());
    if (!referrer) {
      alert('❌ ID de referente no válido. Por favor copia el ID exacto de la lista.');
      return;
    }
    
    try {
      console.log('📝 Guardando referido en Supabase...');
      console.log('📦 Datos a guardar:', {
        name: name.trim(),
        email: email.trim(),
        referrer_id: referrerId.trim(),
        status: 'pending',
        discount: config.descuento_referido
      });

      // 🔧 LLAMADA DIRECTA A SUPABASE CON NOMBRES CORRECTOS DE COLUMNAS
      const { data, error } = await supabase
        .from('referrals')
        .insert([{
          referred_name: name.trim(),
          referred_email: email.trim(),
          client_id: referrerId.trim(),
          estado: 'Pendiente',
          discount: config.descuento_referido,
          purchases: 0,
          created_at: new Date().toISOString()
        }])
        .select();

      console.log('📤 Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('❌ Error de Supabase:', error);
        console.error('❌ Detalles:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`❌ Error al guardar:\n${error.message}\n\n${error.hint || 'Revisa la consola para más detalles'}`);
        return;
      }

      if (!data || data.length === 0) {
        console.error('❌ No se recibió confirmación del guardado');
        alert('❌ El referido no se guardó. Por favor verifica la tabla en Supabase.');
        return;
      }

      console.log('✅ Referido guardado exitosamente:', data[0]);
      alert(`✅ Referido agregado correctamente\n\nNombre: ${name}\nEmail: ${email}\nReferente: ${referrer.nombre_completo}`);
      await loadData();
      
    } catch (error) {
      console.error('❌ Excepción al agregar referido:', error);
      alert(`❌ Error inesperado: ${(error as Error).message}`);
    }
  };

  // ========================================
  // VISTA DE INSUMOS POR AMIGURUMI (NUEVA VERSIÓN CON AUTOCOMPLETADO)
  // ========================================
  
  const InsumosAmigurumiView = () => {
    const [amigurumis, setAmigurumis] = useState<AmigurumiRecord[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      nombre: '',
      insumos: [] as InsumoAmigurumi[]
    });
    const [currentInsumo, setCurrentInsumo] = useState<InsumoAmigurumi>({
      id: '',
      tipo: 'lana',
      marca: '',
      referencia: '',
      color: '',
      cantidad: '',
      unidad: 'gramos'
    });
    
    // Estado local para supplies para este componente
    const [supplies, setSupplies] = useState<Supply[]>([]);

    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando datos...');
        
        const { data: amigurumiData, error: amigurumiError } = await db.getAmigurumiRecords();
        if (amigurumiError) throw amigurumiError;
        
        const suppliesData = await db.getSupplies();
        
        console.log('✅ Datos cargados:', { 
          amigurumis: amigurumiData?.length || 0,
          supplies: suppliesData?.length || 0
        });
        
        setAmigurumis(amigurumiData || []);
        setSupplies(suppliesData || []);
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        alert('Error al cargar los datos: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const saveData = async (nombre: string, insumos: InsumoAmigurumi[]) => {
      try {
        setLoading(true);
        console.log('💾 Guardando...', { nombre, insumos, editingId });
        
        const amigurumiData: AmigurumiRecord = {
          id: editingId || `amg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nombre,
          insumos,
          fecha_actualizacion: new Date().toISOString()
        };
        
        if (editingId) {
          console.log('📝 Actualizando amigurumi ID:', editingId);
          const { error } = await db.updateAmigurumiRecord(editingId, amigurumiData);
          
          if (error) {
            console.error('❌ Error al actualizar:', error);
            throw error;
          }
          
          alert('✅ Amigurumi actualizado exitosamente');
        } else {
          console.log('🆕 Creando nuevo amigurumi');
          const { error } = await db.createAmigurumiRecord(amigurumiData);
          
          if (error) {
            console.error('❌ Error al crear:', error);
            throw error;
          }
          
          alert('✅ Amigurumi guardado exitosamente');
        }
        
        await loadData();
      } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert('Error al guardar los datos: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const deleteAmigurumi = async (id: string) => {
      if (window.confirm('¿Estás seguro de eliminar este amigurumi?')) {
        try {
          setLoading(true);
          console.log('🗑️ Eliminando amigurumi ID:', id);
          
          const { error } = await db.deleteAmigurumiRecord(id);
          
          if (error) {
            console.error('❌ Error al eliminar:', error);
            throw error;
          }
          
          await loadData();
          alert('✅ Amigurumi eliminado exitosamente');
        } catch (error) {
          console.error('❌ Error al eliminar:', error);
          alert('Error al eliminar: ' + (error as Error).message);
        } finally {
          setLoading(false);
        }
      }
    };

    const handleAddInsumo = () => {
      if (!currentInsumo.marca || !currentInsumo.color) {
        alert('Por favor completa al menos marca y color');
        return;
      }
      setFormData({
        ...formData,
        insumos: [...formData.insumos, { ...currentInsumo, id: Date.now().toString() }]
      });
      setCurrentInsumo({
        id: '',
        tipo: 'lana',
        marca: '',
        referencia: '',
        color: '',
        cantidad: '',
        unidad: 'gramos'
      });
    };

    const handleRemoveInsumo = (id: string) => {
      setFormData({
        ...formData,
        insumos: formData.insumos.filter(i => i.id !== id)
      });
    };

    const handleSaveAmigurumi = async () => {
      if (!formData.nombre) {
        alert('Por favor ingresa el nombre del amigurumi');
        return;
      }
      if (formData.insumos.length === 0) {
        alert('Por favor agrega al menos un insumo');
        return;
      }

      await saveData(formData.nombre, formData.insumos);
      handleCancel();
    };

    const handleEdit = (amigurumi: AmigurumiRecord) => {
      setFormData({
        nombre: amigurumi.nombre,
        insumos: amigurumi.insumos || []
      });
      setEditingId(amigurumi.id);
      setIsEditing(true);
    };

    const handleCancel = () => {
      setFormData({ nombre: '', insumos: [] });
      setCurrentInsumo({
        id: '',
        tipo: 'lana',
        marca: '',
        referencia: '',
        color: '',
        cantidad: '',
        unidad: 'gramos'
      });
      setIsEditing(false);
      setEditingId(null);
    };

    const filteredAmigurumis = amigurumis.filter(a =>
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handlers inteligentes para campos con autocompletado
    const handleMarcaChange = (marca: string) => {
      setCurrentInsumo(prev => ({
        ...prev,
        marca,
        referencia: '',
        color: ''
      }));
    };

    const handleReferenciaChange = (referencia: string) => {
      const supply = supplies.find(s => 
        s.name.toLowerCase() === currentInsumo.marca.toLowerCase() &&
        s.reference.toLowerCase() === referencia.toLowerCase()
      );

      if (supply && supply.color) {
        setCurrentInsumo(prev => ({
          ...prev,
          referencia,
          color: supply.color
        }));
      } else {
        setCurrentInsumo(prev => ({
          ...prev,
          referencia,
          color: ''
        }));
      }
    };

    useEffect(() => {
      loadData();
    }, []);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            Gestión de Insumos por Amigurumi
          </h1>
          <p className="text-gray-600 mb-4">
            Registra los materiales con sugerencias inteligentes del inventario
          </p>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              <Plus size={20} />
              Nuevo Amigurumi
            </button>
          ) : (
            /* FORMULARIO DE EDICIÓN */
            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <h2 className="text-xl font-bold text-purple-800 mb-4">
                {editingId ? 'Editar Amigurumi' : 'Nuevo Amigurumi'}
              </h2>

              {/* NOMBRE DEL AMIGURUMI */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Amigurumi *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Osito Teddy, Conejito Rosa, etc."
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* FORMULARIO DE AGREGAR INSUMO */}
              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Plus size={18} className="text-green-600" />
                  Agregar Insumo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  {/* TIPO */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tipo de Material
                    </label>
                    <select
                      value={currentInsumo.tipo}
                      onChange={(e) => {
                        setCurrentInsumo({ 
                          ...currentInsumo, 
                          tipo: e.target.value,
                          marca: '',
                          referencia: '',
                          color: ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    >
                      <option value="lana">Lana</option>
                      <option value="hilo">Hilo</option>
                      <option value="relleno">Relleno</option>
                      <option value="ojos">Ojos de Seguridad</option>
                      <option value="fieltro">Fieltro</option>
                      <option value="botones">Botones</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* MARCA CON AUTOCOMPLETADO */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Marca * 
                      <span className="text-purple-600 ml-1">↓ Sugerencias</span>
                    </label>
                    <AutocompleteInput
                      value={currentInsumo.marca}
                      onChange={handleMarcaChange}
                      suggestions={getMarcasSuggestions(supplies, currentInsumo.tipo)}
                      placeholder="Ej: Copito, Silviamigurumi, Lanasol"
                      field="marca"
                    />
                  </div>

                  {/* REFERENCIA CON AUTOCOMPLETADO */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Referencia/Código
                      {currentInsumo.marca && (
                        <span className="text-purple-600 ml-1">↓ Sugerencias</span>
                      )}
                    </label>
                    <AutocompleteInput
                      value={currentInsumo.referencia}
                      onChange={handleReferenciaChange}
                      suggestions={getReferenciasSuggestions(supplies, currentInsumo.marca)}
                      placeholder="Ej: REF-1234"
                      field="referencia"
                      disabled={!currentInsumo.marca}
                    />
                  </div>

                  {/* COLOR CON AUTOCOMPLETADO */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Color *
                      {currentInsumo.marca && (
                        <span className="text-purple-600 ml-1">↓ Sugerencias</span>
                      )}
                    </label>
                    <AutocompleteInput
                      value={currentInsumo.color}
                      onChange={(val) => setCurrentInsumo({ ...currentInsumo, color: val })}
                      suggestions={getColoresSuggestions(supplies, currentInsumo.marca, currentInsumo.referencia)}
                      placeholder="Ej: Blanco hueso, Rosa pastel"
                      field="color"
                      disabled={!currentInsumo.marca}
                    />
                  </div>

                  {/* CANTIDAD */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="text"
                      value={currentInsumo.cantidad}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, cantidad: e.target.value })}
                      placeholder="Ej: 50, 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  {/* UNIDAD */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unidad
                    </label>
                    <select
                      value={currentInsumo.unidad}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, unidad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    >
                      <option value="gramos">Gramos</option>
                      <option value="metros">Metros</option>
                      <option value="unidades">Unidades</option>
                      <option value="pares">Pares</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddInsumo}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Agregar Insumo
                </button>
              </div>

              {/* LISTA DE INSUMOS AGREGADOS */}
              {formData.insumos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Insumos Agregados ({formData.insumos.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.insumos.map((insumo) => (
                      <div
                        key={insumo.id}
                        className={`bg-white border-2 rounded-lg p-3 flex justify-between items-start transition-colors ${
                          isInsumoInInventory(supplies, insumo)
                            ? 'border-green-300 hover:border-green-400' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">
                              {insumo.tipo}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {insumo.marca}
                            </span>
                            {isInsumoInInventory(supplies, insumo) && (
                              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                                ✓ En inventario
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Color:</span> {insumo.color}
                            {insumo.referencia && (
                              <span className="ml-3">
                                <span className="font-medium">Ref:</span> {insumo.referencia}
                              </span>
                            )}
                            {insumo.cantidad && (
                              <span className="ml-3">
                                <span className="font-medium">Cantidad:</span> {insumo.cantidad} {insumo.unidad}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInsumo(insumo.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveAmigurumi}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? 'Guardando...' : 'Guardar Amigurumi'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
                >
                  <X size={20} />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BANNER INFORMATIVO */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">💡 Autocompletado Inteligente</h3>
          <ul className="space-y-2 text-sm">
            <li>• Sugerencias basadas en tu inventario</li>
            <li>• Escribe libremente si no encuentras</li>
            <li>• Marca verde ✓ = en inventario</li>
          </ul>
        </div>

        {/* LISTA DE AMIGURUMIS */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-purple-800">
              Mis Amigurumis ({filteredAmigurumis.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar amigurumi..."
                className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Cargando...
            </div>
          ) : filteredAmigurumis.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No se encontraron amigurumis' : 'No hay amigurumis registrados aún'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAmigurumis.map((amigurumi) => (
                <div
                  key={amigurumi.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-purple-800">
                        {amigurumi.nombre}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Actualizado: {amigurumi.fecha_actualizacion 
                          ? new Date(amigurumi.fecha_actualizacion).toLocaleDateString('es-CO') 
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(amigurumi)}
                        disabled={loading}
                        className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        <Edit2 size={18}/>
                      </button>
                      <button
                        onClick={() => deleteAmigurumi(amigurumi.id)}
                        disabled={loading}
                        className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                      Lista de Insumos:
                    </h4>
                    <div className="space-y-2">
                      {(amigurumi.insumos || []).map((insumo) => (
                        <div key={insumo.id} className="bg-white rounded-lg p-2 border border-gray-200">
                          <div className="flex items-start gap-2">
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded shrink-0">
                              {insumo.tipo}
                            </span>
                            <div className="text-sm flex-1">
                              <div className="font-semibold text-gray-800">{insumo.marca}</div>
                              <div className="text-gray-600">
                                <span className="font-medium">Color:</span> {insumo.color}
                              </div>
                              {insumo.referencia && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Referencia:</span> {insumo.referencia}
                                </div>
                              )}
                              {insumo.cantidad && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Cantidad:</span> {insumo.cantidad} {insumo.unidad}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ========================================
  // VISTAS DEL DASHBOARD (Resto de vistas)
  // ========================================
  
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

  const InventoryView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-purple-600"/> Inventario de Productos
        </h2>
        <button 
          onClick={openNewInventoryItem} 
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus size={18}/> Agregar Item
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveInventoryCategory('sizes')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeInventoryCategory === 'sizes'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📏 Tamaños
        </button>
        <button
          onClick={() => setActiveInventoryCategory('packaging')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeInventoryCategory === 'packaging'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📦 Empaques
        </button>
        <button
          onClick={() => setActiveInventoryCategory('accessories')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeInventoryCategory === 'accessories'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ✨ Accesorios
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4 text-right">Precio</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventoryItems
              .filter(item => item.category === activeInventoryCategory)
              .map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.label}</td>
                  <td className="p-4 text-right font-bold text-gray-800">
                    ${item.price.toLocaleString()}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingInventoryItem(item);
                        setIsInventoryModalOpen(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                    >
                      <Edit2 size={16}/>
                    </button>
                    <button
                      onClick={() => handleDeleteInventoryItem(item.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            {inventoryItems.filter(item => item.category === activeInventoryCategory).length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  No hay items en esta categoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditClient(c)} 
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar cliente"
                    >
                      <Edit2 size={16}/>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClient(e, c.id)} 
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ReferralsView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Referidos</h2>
        <button 
          onClick={handleAddReferral}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus size={18}/> Nuevo Referido
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-100"><Users className="text-purple-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Total Referidos</p>
            <p className="text-2xl font-bold">{referrals.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100"><DollarSign className="text-green-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Referidos Activos</p>
            <p className="text-2xl font-bold">{referrals.filter(r => r.status === 'active').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 rounded-full bg-yellow-100"><Trophy className="text-yellow-600"/></div>
          <div>
            <p className="text-gray-500 text-sm">Referidos Pendientes</p>
            <p className="text-2xl font-bold">{referrals.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Referido</th>
              <th className="p-4">Email</th>
              <th className="p-4">Referido por</th>
              <th className="p-4">Descuento</th>
              <th className="p-4">Compras</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Fecha de Registro</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {referrals.map(referral => (
              <tr key={referral.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold">{referral.name}</td>
                <td className="p-4">{referral.email}</td>
                <td className="p-4">{referral.referredByName || 'N/A'}</td>
                <td className="p-4">{referral.discount}%</td>
                <td className="p-4">{referral.purchases || 0}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    referral.status === 'active' ? 'bg-green-100 text-green-700' : 
                    referral.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {referral.status === 'active' ? 'Activo' : 
                     referral.status === 'pending' ? 'Pendiente' : 
                     'Inactivo'}
                  </span>
                </td>
                <td className="p-4">{referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4 flex gap-2">
                  <button className="text-blue-500 hover:bg-blue-50 p-2 rounded">
                    <Eye size={16}/>
                  </button>
                  <button className="text-green-500 hover:bg-green-50 p-2 rounded">
                    <Users size={16}/>
                  </button>
                  <button onClick={() => handleDeleteReferral(referral.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
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

  const GalleryView = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">Galería del Home</h2>
      <button 
        onClick={openNewGallery} 
        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700"
      >
        <Plus size={18}/> Nueva Foto
      </button>
    </div>
    
    {/* 🔧 AGREGADO: Mensaje si no hay items */}
    {gallery.length === 0 ? (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">No hay imágenes en la galería</p>
        <p className="text-gray-400 text-sm mt-2">Haz clic en "Nueva Foto" para agregar una</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {gallery.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="h-48 overflow-hidden relative">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition group-hover:scale-105"
                onError={(e) => {
                  console.error('Error loading image:', item.imageUrl);
                  e.currentTarget.src = 'https://placehold.co/400x400/e8e8e8/666666?text=Error+Cargando';
                }}
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition gap-2">
                <button 
                  onClick={() => { setEditingGallery(item); setIsGalleryModalOpen(true); }} 
                  className="bg-white p-2 rounded-full text-blue-600"
                >
                  <Edit2 size={18}/>
                </button>
                <button 
                  onClick={() => handleDeleteGallery(item.id)} 
                  className="bg-white p-2 rounded-full text-red-600"
                >
                  <Trash2 size={18}/>
                </button>
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
    )}
  </div>
);

  // 🔧 REEMPLAZA LA FUNCIÓN ContentView COMPLETA EN AdminDashboard.tsx

const ContentView = () => {
  const [localCardPrice1, setLocalCardPrice1] = useState(homeConfig.cardPrice1 || '$30.00');
  const [localCardPrice2, setLocalCardPrice2] = useState(homeConfig.cardPrice2 || '$27.00');
  const [localCardPrice3, setLocalCardPrice3] = useState(homeConfig.cardPrice3 || '$26.00');
  const [localCardPrice4, setLocalCardPrice4] = useState(homeConfig.cardPrice4 || '$25.00');
  const [localCardPrice5, setLocalCardPrice5] = useState(homeConfig.cardPrice5 || '$24.00');
  const [localCardPrice6, setLocalCardPrice6] = useState(homeConfig.cardPrice6 || '$23.00');
  const [localCardPrice7, setLocalCardPrice7] = useState(homeConfig.cardPrice7 || '$22.00');

  // 🆕 Estados para saber si se está subiendo una imagen
  const [uploadingCard, setUploadingCard] = useState<number | null>(null);

  useEffect(() => {
    setLocalCardPrice1(homeConfig.cardPrice1 || '$30.00');
    setLocalCardPrice2(homeConfig.cardPrice2 || '$27.00');
    setLocalCardPrice3(homeConfig.cardPrice3 || '$26.00');
    setLocalCardPrice4(homeConfig.cardPrice4 || '$25.00');
    setLocalCardPrice5(homeConfig.cardPrice5 || '$24.00');
    setLocalCardPrice6(homeConfig.cardPrice6 || '$23.00');
    setLocalCardPrice7(homeConfig.cardPrice7 || '$22.00');
  }, [homeConfig]);

  // 🔧 FUNCIÓN CORREGIDA - Ahora sube a Supabase Storage
  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, cardNumber: 2 | 3 | 4 | 5 | 6 | 7 | 8) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Imagen muy pesada (máx 5MB)");
      return;
    }

    try {
      setUploadingCard(cardNumber);
      console.log(`📤 Subiendo imagen para tarjeta ${cardNumber}...`);

      // 🔧 SUBIR A SUPABASE STORAGE
      const imageUrl = await uploadImage(file, 'gallery');
      
      if (!imageUrl) {
        alert('❌ Error al subir la imagen');
        return;
      }

      console.log(`✅ Imagen subida: ${imageUrl}`);

      // 🔧 ACTUALIZAR EL ESTADO INMEDIATAMENTE
      const fieldMap: Record<number, keyof HomeConfig> = {
        2: 'heroImage2',
        3: 'cardImage3',
        4: 'cardImage4',
        5: 'cardImage5',
        6: 'cardImage6',
        7: 'cardImage7',
        8: 'cardImage8'
      };
      
      const field = fieldMap[cardNumber];
      
      if (field) {
        // Actualizar estado local
        setHomeConfig(prev => ({ ...prev, [field]: imageUrl }));
        
        // 🆕 GUARDAR INMEDIATAMENTE EN BD
        const updatedConfig = { ...homeConfig, [field]: imageUrl };
        await db.saveHomeConfig(updatedConfig);
        
        console.log(`✅ Tarjeta ${cardNumber - 1} guardada automáticamente`);
      }

      alert(`✅ Imagen de tarjeta ${cardNumber - 1} cargada y guardada automáticamente.`);

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      alert('❌ Error al subir la imagen');
    } finally {
      setUploadingCard(null);
    }
  };

  const handleSaveContentConfig = async () => {
    try {
      const updatedConfig = {
        ...homeConfig,
        cardPrice1: localCardPrice1,
        cardPrice2: localCardPrice2,
        cardPrice3: localCardPrice3,
        cardPrice4: localCardPrice4,
        cardPrice5: localCardPrice5,
        cardPrice6: localCardPrice6,
        cardPrice7: localCardPrice7,
      };
      
      console.log('💾 Guardando configuración completa:', updatedConfig);
      
      const result = await db.saveHomeConfig(updatedConfig);
      
      if (result.error) {
        console.error('❌ Error al guardar:', result.error);
        alert('❌ Error al guardar: ' + result.error.message);
        return;
      }
      
      setHomeConfig(updatedConfig);
      alert('✅ Contenido actualizado correctamente');
      await loadData();
    } catch (error) {
      console.error('❌ Error inesperado:', error);
      alert('❌ Error al guardar: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Contenido</h2>
      </div>
      
      {/* LOGO PRINCIPAL */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ImageIcon size={20}/> Logo Principal (Izquierda)
        </h3>
        <div>
          <label className="block text-sm font-medium mb-2">Logo del Sitio</label>
          {homeConfig.heroImage1 && (
            <img 
              src={homeConfig.heroImage1} 
              alt="Logo" 
              className="w-40 h-40 object-contain rounded-lg mb-2 border-2 border-gray-200 bg-white p-2"
            />
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => handleHeroUpload(e, 'heroImage1')} 
            className="text-sm w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Este logo aparece en la columna izquierda sobre el texto
          </p>
        </div>
      </div>

      {/* TARJETAS FLOTANTES */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ImageIcon size={20}/> Tarjetas Flotantes (Derecha)
        </h3>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <p className="text-sm text-blue-800 font-medium">
            💡 <strong>Importante:</strong> Solo se mostrarán las tarjetas que tengan imagen Y precio configurados.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Después de subir cada imagen, haz clic en "Guardar Todo el Contenido" al final de la página.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* TARJETA 1 - Verde */}
          <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50 relative">
            {uploadingCard === 2 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <h4 className="font-bold text-green-800">Tarjeta 1 (Verde)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.heroImage2 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.heroImage2} 
                    alt="Tarjeta 1" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-green-300"
                  />
                  <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 2)}
                disabled={uploadingCard === 2}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice1}
                onChange={(e) => setLocalCardPrice1(e.target.value)}
                className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="$30.00"
              />
            </div>
          </div>

          {/* TARJETA 2 - Morada */}
          <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50 relative">
            {uploadingCard === 3 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <h4 className="font-bold text-purple-800">Tarjeta 2 (Morada)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.cardImage3 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.cardImage3} 
                    alt="Tarjeta 2" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-purple-300"
                  />
                  <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 3)}
                disabled={uploadingCard === 3}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice2}
                onChange={(e) => setLocalCardPrice2(e.target.value)}
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="$27.00"
              />
            </div>
          </div>

          {/* TARJETA 3 - Amarilla */}
          <div className="border-2 border-yellow-200 rounded-xl p-4 bg-yellow-50 relative">
            {uploadingCard === 4 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <h4 className="font-bold text-yellow-800">Tarjeta 3 (Amarilla)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.cardImage4 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.cardImage4} 
                    alt="Tarjeta 3" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-yellow-300"
                  />
                  <span className="absolute top-2 right-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 4)}
                disabled={uploadingCard === 4}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice3}
                onChange={(e) => setLocalCardPrice3(e.target.value)}
                className="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500"
                placeholder="$26.00"
              />
            </div>
          </div>

          {/* TARJETA 4 - Rosa */}
          <div className="border-2 border-pink-200 rounded-xl p-4 bg-pink-50 relative">
            {uploadingCard === 5 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
              <h4 className="font-bold text-pink-800">Tarjeta 4 (Rosa)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.cardImage5 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.cardImage5} 
                    alt="Tarjeta 4" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-pink-300"
                  />
                  <span className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 5)}
                disabled={uploadingCard === 5}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice4}
                onChange={(e) => setLocalCardPrice4(e.target.value)}
                className="w-full px-3 py-2 border-2 border-pink-300 rounded-lg focus:outline-none focus:border-pink-500"
                placeholder="$25.00"
              />
            </div>
          </div>

          {/* 🆕 TARJETA 5 - Azul */}
          <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50 relative">
            {uploadingCard === 6 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <h4 className="font-bold text-blue-800">Tarjeta 5 (Azul)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.cardImage6 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.cardImage6} 
                    alt="Tarjeta 5" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-blue-300"
                  />
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 6)}
                disabled={uploadingCard === 6}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice5}
                onChange={(e) => setLocalCardPrice5(e.target.value)}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="$24.00"
              />
            </div>
          </div>

          {/* 🆕 TARJETA 6 - Naranja */}
          <div className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50 relative">
            {uploadingCard === 7 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <h4 className="font-bold text-orange-800">Tarjeta 6 (Naranja)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.cardImage7 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.cardImage7} 
                    alt="Tarjeta 6" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-orange-300"
                  />
                  <span className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 7)}
                disabled={uploadingCard === 7}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice6}
                onChange={(e) => setLocalCardPrice6(e.target.value)}
                className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
                placeholder="$23.00"
              />
            </div>
          </div>

          {/* 🆕 TARJETA 7 - Roja */}
          <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50 relative">
            {uploadingCard === 8 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <h4 className="font-bold text-red-800">Tarjeta 7 (Roja)</h4>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Imagen</label>
              {homeConfig.cardImage8 && (
                <div className="relative mb-2">
                  <img 
                    src={homeConfig.cardImage8} 
                    alt="Tarjeta 7" 
                    className="w-full h-40 object-cover rounded-lg border-2 border-red-300"
                  />
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cargada
                  </span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleCardImageUpload(e, 8)}
                disabled={uploadingCard === 8}
                className="text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="text"
                value={localCardPrice7}
                onChange={(e) => setLocalCardPrice7(e.target.value)}
                className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="$22.00"
              />
            </div>
          </div>

        </div>

        <div className="mt-6 text-right">
          <button 
            onClick={handleSaveContentConfig}
            disabled={uploadingCard !== null}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:from-pink-700 hover:to-purple-700 shadow-lg flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20}/>
            Guardar Todo el Contenido
          </button>
        </div>
      </div>

      {/* EQUIPO DE TEJEDORAS */}
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
};

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
  <span className={`px-2 py-1 rounded text-xs font-bold ${
    ch.status === 'active' ? 'bg-green-100 text-green-700' : 
    ch.status === 'completed' ? 'bg-gray-200 text-gray-600' : 
    ch.status === 'starting' ? 'bg-yellow-100 text-yellow-700' :
    'bg-blue-100 text-blue-700'
  }`}>
    {ch.status === 'upcoming' ? 'PRÓXIMAMENTE' : 
     ch.status === 'starting' ? 'POR INICIAR' : 
     ch.status === 'active' ? 'EN PROCESO' : 
     'FINALIZADO'}
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

  const SiteContentView = () => (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold">📝 Editor de Contenido del Sitio</h2>

      <section className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Edit2 className="text-purple-500" />
          Títulos de Secciones
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título "¿Por Qué Elegirnos?"
            </label>
            <input
              type="text"
              value={editableSections.valuePropsTitle}
              onChange={(e) => setEditableSections({...editableSections, valuePropsTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título "Nuestro Impacto"
            </label>
            <input
              type="text"
              value={editableSections.statsTitle}
              onChange={(e) => setEditableSections({...editableSections, statsTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Estadísticas
            </label>
            <input
              type="text"
              value={editableSections.statsSubtitle}
              onChange={(e) => setEditableSections({...editableSections, statsSubtitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título Testimonios
            </label>
            <input
              type="text"
              value={editableSections.testimonialsTitle}
              onChange={(e) => setEditableSections({...editableSections, testimonialsTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Testimonios
            </label>
            <input
              type="text"
              value={editableSections.testimonialsSubtitle}
              onChange={(e) => setEditableSections({...editableSections, testimonialsSubtitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={handleSaveEditableSections}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
          >
            <Save size={20} />
            Guardar Títulos
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          📊 Estadísticas del Sitio
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amigurumis Creados
            </label>
            <input
              type="number"
              value={siteStats.amigurumiCount}
              onChange={(e) => setSiteStats({...siteStats, amigurumiCount: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clientes Felices
            </label>
            <input
              type="number"
              value={siteStats.clientCount}
              onChange={(e) => setSiteStats({...siteStats, clientCount: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Promedio (1.0 - 5.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={siteStats.rating}
              onChange={(e) => setSiteStats({...siteStats, rating: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Años de Experiencia
            </label>
            <input
              type="number"
              value={siteStats.yearsExperience}
              onChange={(e) => setSiteStats({...siteStats, yearsExperience: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSiteStats}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
        >
          <Save size={20} />
          Guardar Estadísticas
        </button>
      </section>
    </div>
  );

  // ========================================
  // INDICADOR DE CARGA
  // ========================================
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    </div>;
  }

  // ========================================
  // RENDERIZADO PRINCIPAL
  // ========================================
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Barra lateral de navegación */}
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
            { id: 'inventory', label: 'Inventario', icon: <Package size={20}/> },
            { id: 'insumos-amigurumi', label: 'Insumos x Amigurumi', icon: <Package size={20}/> },
            { id: 'clients', label: 'Clientes', icon: <Users size={20}/> },
            { id: 'referrals', label: 'Referidos', icon: <Users size={20}/> },
            { id: 'community', label: 'Comunidad', icon: <Heart size={20}/> },
            { id: 'challenges', label: 'Retos', icon: <Trophy size={20}/> },
            { id: 'gallery', label: 'Galería', icon: <ImageIcon size={20}/> },
            { id: 'content', label: 'Contenido Inicio', icon: <PenTool size={20}/> },
            { id: 'site-content', label: 'Editar Contenido', icon: <Edit2 size={20}/> },
            { id: 'quote-generator', label: 'Cotizaciones', icon: <FileText size={20}/>, action: () => navigate('/admin/quote-generator') },
            { id: 'testimonials', label: 'Testimonios', icon: <Star size={20}/>, action: () => navigate('/admin/testimonials') },
            { id: 'settings', label: 'Configuración', icon: <Settings size={20}/> },
            { id: 'migration', label: '🔄 Migración', icon: <Upload size={20}/> },
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

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'supplies' && <SuppliesView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'insumos-amigurumi' && <InsumosAmigurumiView />}
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'referrals' && <ReferralsView />}
        {activeTab === 'gallery' && <GalleryView />}
        {activeTab === 'content' && <ContentView />}
        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'challenges' && <ChallengesView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'site-content' && <SiteContentView />}
        {activeTab === 'migration' && <CompleteMigration />}
      </main>

      {/* ========================================
       MODALES
       ======================================== */}
      
      {/* Modal de edición de cliente */}
      {isClientModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Editar Cliente</h3>
              <button onClick={() => setIsClientModalOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editingClient.nombre_completo}
                  onChange={(e) => setEditingClient({...editingClient, nombre_completo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={editingClient.telefono || ''}
                  onChange={(e) => setEditingClient({...editingClient, telefono: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                <input
                  type="text"
                  value={editingClient.cedula || ''}
                  onChange={(e) => setEditingClient({...editingClient, cedula: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={editingClient.direccion || ''}
                  onChange={(e) => setEditingClient({...editingClient, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento Activo (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingClient.descuento_activo}
                  onChange={(e) => setEditingClient({...editingClient, descuento_activo: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles de pedido */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Pedido #{selectedOrder.numero_seguimiento}</h3>
              <button onClick={() => setIsOrderModalOpen(false)}><X size={24}/></button>
            </div>
            
            <div className="mb-6 bg-blue-50 p-4 rounded-xl">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Users size={20} className="text-blue-600"/>
                Información del Cliente
              </h4>
              
              {/* 🆕 FORMULARIO DE EDICIÓN */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={editingOrderClientName}
                      onChange={(e) => setEditingOrderClientName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingOrderClientEmail}
                      onChange={(e) => setEditingOrderClientEmail(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="cliente@email.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editingOrderClientPhone}
                      onChange={(e) => setEditingOrderClientPhone(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="3001234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Descuento Activo
                    </label>
                    <p className="font-medium">{orderClient?.descuento_activo || '0'}%</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-xl">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <ShoppingBag size={20} className="text-gray-600"/>
                Detalles del Pedido
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Producto</p>
                  <p className="font-medium">{selectedOrder.nombre_producto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Descripción</p>
                  <p className="font-medium">{selectedOrder.descripcion || 'Sin descripción'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de solicitud</p>
                  <p className="font-medium">{selectedOrder.fecha_solicitud}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado actual</p>
                  <p className="font-medium">{selectedOrder.estado}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Total</label>
                  <input
                    type="number"
                    value={editingOrderTotal}
                    onChange={(e) => setEditingOrderTotal(Number(e.target.value))}
                    className="w-full px-2 py-1 border rounded font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Pagado</label>
                  <input
                    type="number"
                    value={editingOrderPaid}
                    onChange={(e) => setEditingOrderPaid(Number(e.target.value))}
                    className="w-full px-2 py-1 border rounded font-medium"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo pendiente</p>
                  <p className="font-medium text-red-600">${(editingOrderTotal - editingOrderPaid).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guía de transportadora</p>
                  <p className="font-medium">{selectedOrder.guia_transportadora || 'Sin asignar'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl space-y-4">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <ImageIcon size={20} className="text-purple-600"/>
                  Imágenes del Pedido
                </h4>

                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">📸 Imagen de Referencia (lo que pidió)</p>
                  {selectedOrder.imagen_url ? (
                    <img 
                      src={selectedOrder.imagen_url} 
                      alt="Referencia" 
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      Sin imagen de referencia
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">✨ Imagen Final (producto terminado)</p>
                  
                  {selectedOrder.final_image_url ? (
                    <div className="relative">
                      <img 
                        src={selectedOrder.final_image_url} 
                        alt="Producto Final" 
                        className="w-full h-48 object-cover rounded-lg border-2 border-green-400"
                        onError={(e) => {
                          console.error('❌ Error cargando imagen final:', selectedOrder.final_image_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleDeleteFinalImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X size={16}/>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {finalImagePreview && (
                        <div className="relative">
                          <img 
                            src={finalImagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg border-2 border-blue-400"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFinalImageFile(null);
                              setFinalImagePreview('');
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          >
                            <X size={16}/>
                          </button>
                        </div>
                      )}

                      <label className="w-full border-2 border-dashed border-purple-300 rounded-lg p-6 cursor-pointer hover:bg-purple-50 flex flex-col items-center gap-2">
                        <Upload size={28} className="text-purple-600" />
                        <span className="font-medium text-purple-700 text-center">
                          {uploadingFinalImage ? 'Subiendo imagen...' : 'Click para subir foto del amigurumi terminado'}
                        </span>
                        <span className="text-xs text-gray-500">Máx 5MB - JPG, PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFinalImageUpload}
                          disabled={uploadingFinalImage}
                          className="hidden"
                        />
                      </label>

                      {finalImageFile && (
                        <button
                          type="button"
                          onClick={handleUploadFinalImage}
                          disabled={uploadingFinalImage}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2"
                        >
                          {uploadingFinalImage ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload size={18}/>
                              Guardar Imagen Final
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl">
                <label className="block text-sm font-bold mb-2">Número de Guía Transportadora</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg" 
                  placeholder="Ej: Interrapidismo 1234567" 
                  value={trackingGuide} 
                  onChange={(e) => setTrackingGuide(e.target.value)}
                />
              </div>

              {/* 🆕 CAMPO DE TIPO DE EMPAQUE (CAMBIO SOLICITADO - DINÁMICO DESDE INVENTARIO) */}
              <div>
                <label className="block text-sm font-bold mb-2">Tipo de Empaque 📦</label>
                <select
                  value={tipoEmpaqueOrder}
                  onChange={(e) => setTipoEmpaqueOrder(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar empaque...</option>
                  <option value="sin_empaque">❌ Sin Empaque</option>
                  {inventoryItems
                    .filter(item => item.category === 'packaging')
                    .map(pack => (
                      <option key={pack.id} value={pack.label}>
                        📦 {pack.label} (${pack.price.toLocaleString()})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Estado del Pedido</label>
                <select 
                  value={statusUpdate} 
                  onChange={(e) => setStatusUpdate(e.target.value)} 
                  className="w-full p-2 border rounded"
                >
                  <option value="En espera de agendar">En espera de agendar</option>
                  <option value="Agendado">Agendado</option>
                  <option value="¡Ya estamos tejiendo tu pedido! Pronto estará listo.">¡Ya estamos tejiendo tu pedido! Pronto estará listo.</option>
                  <option value="Tu Amigurumi ya fue tejido.">Tu Amigurumi ya fue tejido.</option>
                  <option value="Listo para entregar">Listo para entregar</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {selectedOrder.saldo_pendiente > 0 && (
                <button 
                  onClick={handleVerifyPayment} 
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700"
                >
                  Registrar Pago
                </button>
              )}

              <button 
                onClick={handleUpdateStatusAndGuide} 
                className="w-full bg-gray-900 text-white py-2 rounded-lg font-bold hover:bg-gray-800"
              >
                Guardar Cambios
              </button>

              {/* 🆕 AGREGA ESTA SECCIÓN NUEVA */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893 11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Notificaciones WhatsApp
                </h4>
                
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={sendOrderUpdateNotification}
                    disabled={!editingOrderClientPhone}
                    className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Notificar Cliente
                    </button>
                  
                  {!editingOrderClientPhone && (
                    <p className="text-xs text-red-600 text-center">
                      ⚠️ Cliente sin teléfono registrado
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 text-center">
                    Se enviará un mensaje con la actualización del estado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inventario */}
{isInventoryModalOpen && editingInventoryItem && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">
          {inventoryItems.some(i => i.id === editingInventoryItem.id)
            ? 'Editar Item'
            : 'Nuevo Item'}
        </h3>
        <button
          onClick={() => {
            setIsInventoryModalOpen(false);
            setEditingInventoryItem(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24}/>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={editingInventoryItem.category}
            onChange={e =>
              setEditingInventoryItem({
                ...editingInventoryItem,
                category: e.target.value as 'sizes' | 'packaging' | 'accessories'
              })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="sizes">📏 Tamaño</option>
            <option value="packaging">📦 Empaque</option>
            <option value="accessories">✨ Accesorio</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={editingInventoryItem.label}
            onChange={e =>
              setEditingInventoryItem({
                ...editingInventoryItem,
                label: e.target.value
              })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ej: 15cm, Caja Premium, Base LED"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio ($)
          </label>
          <input
            type="number"
            value={editingInventoryItem.price}
            onChange={e =>
              setEditingInventoryItem({
                ...editingInventoryItem,
                price: parseFloat(e.target.value) || 0
              })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0"
            min="0"
          />
        </div>

        <button
          onClick={handleSaveInventoryItem}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-bold"
        >
          <Save size={20}/>
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal de creación de pedido */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            
            {!showNotificationOptions ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl">Crear Pedido Manual</h3>
                  <button onClick={closeCreateOrderModal}><X size={24}/></button>
                </div>
                
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Nombre del Cliente *</label>
                    <input 
                      type="text" 
                      className="w-full border p-2 rounded-lg" 
                      value={newOrderData.clientName}
                      onChange={e => setNewOrderData({...newOrderData, clientName: e.target.value})} 
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Email *</label>
                      <input 
                        type="email" 
                        className="w-full border p-2 rounded-lg" 
                        value={newOrderData.clientEmail}
                        onChange={e => setNewOrderData({...newOrderData, clientEmail: e.target.value})} 
                        placeholder="cliente@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Teléfono *</label>
                      <input 
                        type="tel" 
                        className="w-full border p-2 rounded-lg" 
                        value={newOrderData.clientPhone}
                        onChange={e => setNewOrderData({...newOrderData, clientPhone: e.target.value})} 
                        placeholder="3001234567"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Nombre del Producto *</label>
                    <input 
                      type="text" 
                      className="w-full border p-2 rounded-lg" 
                      value={newOrderData.nombre_producto}
                      onChange={e => setNewOrderData({...newOrderData, nombre_producto: e.target.value})} 
                      placeholder="Peluche personalizado"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Descripción</label>
                    <textarea 
                      className="w-full border p-2 rounded-lg h-24" 
                      value={newOrderData.descripcion} 
                      onChange={e => setNewOrderData({...newOrderData, descripcion: e.target.value})}
                      placeholder="Detalles adicionales del pedido..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Foto de Referencia</label>
                    <div className="flex items-center gap-4">
                      {newOrderData.imagenPreview ? (
                        <div className="relative w-20 h-20">
                          <img 
                            src={newOrderData.imagenPreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => setNewOrderData({...newOrderData, imagen: null, imagenPreview: ''})}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload size={20} className="text-gray-400" />
                          <span className="text-[10px] text-gray-500 mt-1">Subir</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleOrderImageChange}
                          />
                        </label>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>Sube una foto de referencia para el pedido.</p>
                        <p>Máximo 5MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Precio Total ($) *</label>
                      <input 
                        type="number" 
                        className="w-full border p-2 rounded-lg" 
                        value={newOrderData.total_final}
                        onChange={e => setNewOrderData({...newOrderData, total_final: Number(e.target.value)})} 
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Abono ($)</label>
                      <input 
                        type="number" 
                        className="w-full border p-2 rounded-lg" 
                        value={newOrderData.monto_pagado}
                        onChange={e => setNewOrderData({...newOrderData, monto_pagado: Number(e.target.value)})}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* 🆕 CAMPO DE TIPO DE EMPAQUE (CAMBIO SOLICITADO - DINÁMICO DESDE INVENTARIO) */}
                  <div>
                    <label className="block text-sm font-bold mb-1">Tipo de Empaque 📦</label>
                    <select
                      value={newOrderData.tipo_empaque}
                      onChange={e => setNewOrderData({...newOrderData, tipo_empaque: e.target.value as any})}
                      className="w-full border p-2 rounded-lg"
                    >
                      <option value="">Seleccionar empaque...</option>
                      <option value="sin_empaque">❌ Sin Empaque</option>
                      {inventoryItems
                        .filter(item => item.category === 'packaging')
                        .map(pack => (
                          <option key={pack.id} value={pack.label}>
                            📦 {pack.label} (${pack.price.toLocaleString()})
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-bold text-gray-700">Saldo Pendiente:</p>
                    <p className="text-2xl font-bold text-amber-600">
                      ${(newOrderData.total_final - newOrderData.monto_pagado).toLocaleString()}
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={uploadingImage}
                    className={`w-full p-3 rounded-lg font-bold transition-colors ${
                      uploadingImage 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {uploadingImage ? 'Subiendo Imagen...' : 'Crear Pedido'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="font-bold text-xl mb-2">¡Pedido Creado!</h3>
                  <p className="text-gray-600">Número de seguimiento: <span className="font-bold">#{createdOrderNumber}</span></p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-700 text-center mb-4">¿Cómo deseas notificar al cliente?</p>

                  <button 
                    onClick={sendClientWhatsAppNotification}
                    className="w-full bg-green-600 text-white p-4 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Enviar por WhatsApp al Cliente
                  </button>

                  <button 
                    onClick={sendEmailNotification}
                    className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2V7a2 2 0 00-2-2z"></path>
                    </svg>
                    Enviar por Email
                  </button>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">O enviar por WhatsApp a:</p>
                    
                    <button 
                      onClick={() => sendWhatsAppNotification('573124915127', 'Sandra')}
                      className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Sandra (312-491-5127)
                    </button>

                    <button 
                      onClick={() => sendWhatsAppNotification('573224589653', 'Sofi')}
                      className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.P157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Sofi (322-458-9653)
                    </button>
                  </div>

                  <button 
                    onClick={closeCreateOrderModal}
                    className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg font-bold hover:bg-gray-300"
                  >
                    Cerrar sin Enviar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de insumos */}
      {isSupplyModalOpen && editingSupply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl">
                {supplies.find(s => s.id === editingSupply.id) ? 'Editar Insumo' : 'Nuevo Insumo'}
              </h3>
              <button onClick={() => setIsSupplyModalOpen(false)}>
                <X size={24}/>
              </button>
            </div>
            
            <form onSubmit={handleSaveSupply} className="space-y-4">
              <div>
                <label className="text-sm font-bold">Nombre del Producto</label>
                <input 
                  className="w-full border p-2 rounded-lg" 
                  value={editingSupply.name} 
                  onChange={(e) => setEditingSupply({...editingSupply, name: e.target.value})} 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Referencia</label>
                  <input 
                    className="w-full border p-2 rounded-lg" 
                    value={editingSupply.reference} 
                    onChange={(e) => setEditingSupply({...editingSupply, reference: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold">Número / Calibre</label>
                  <input 
                    className="w-full border p-2 rounded-lg" 
                    value={editingSupply.number} 
                    onChange={(e) => setEditingSupply({...editingSupply, number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Color</label>
                  <input 
                    className="w-full border p-2 rounded-lg" 
                    value={editingSupply.color} 
                    onChange={(e) => setEditingSupply({...editingSupply, color: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold">Cantidad</label>
                  <input 
                    type="number" 
                    className="w-full border p-2 rounded-lg" 
                    value={editingSupply.quantity} 
                    onChange={(e) => setEditingSupply({...editingSupply, quantity: Number(e.target.value)})} 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Valor Unitario ($)</label>
                  <input 
                    type="number" 
                    className="w-full border p-2 rounded-lg" 
                    value={editingSupply.unitValue} 
                    onChange={(e) => setEditingSupply({...editingSupply, unitValue: Number(e.target.value)})} 
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold">Alerta Stock Bajo</label>
                  <input 
                    type="number" 
                    className="w-full border p-2 rounded-lg" 
                    value={editingSupply.lowStockThreshold} 
                    onChange={(e) => setEditingSupply({...editingSupply, lowStockThreshold: Number(e.target.value)})} 
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-bold block mb-2">Imagen del Producto</label>
                
                {editingSupply.imageUrl && (
                  <div className="mb-3 relative">
                    <img 
                      src={editingSupply.imageUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingSupply({...editingSupply, imageUrl: ''})}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X size={16}/>
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="O pega una URL de imagen..."
                      className="w-full border p-2 rounded-lg text-sm"
                      value={editingSupply.imageUrl || ''}
                      onChange={e => setEditingSupply({...editingSupply, imageUrl: e.target.value})}
                    />
                  </div>

                  <div className="relative">
                    <label className="w-full border-2 border-dashed border-amber-300 rounded-lg p-4 text-sm cursor-pointer hover:bg-amber-50 flex flex-col items-center gap-2">
                      <Upload size={24} className="text-amber-600" />
                      <span className="font-medium text-amber-700">
                        {uploadingImage ? 'Subiendo...' : 'Click para subir archivo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSupplyImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  📁 Sube una imagen (máx 5MB) o pega una URL desde internet
                </p>
              </div>

              <button 
                type="submit" 
                disabled={uploadingImage}
                className="w-full bg-amber-600 text-white p-3 rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Subiendo imagen...
                  </>
                ) : (
                  'Guardar Insumo'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de galería */}
{isGalleryModalOpen && editingGallery && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-xl">
          {gallery.some(g => g.id === editingGallery.id) ? 'Editar Imagen' : 'Nueva Imagen'}
        </h3>
        <button 
          onClick={() => {
            setIsGalleryModalOpen(false);
            setEditingGallery(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={24}/>
        </button>
      </div>
      
      <form onSubmit={handleSaveGallery} className="space-y-4">
        {/* Título */}
        <div>
          <label className="text-sm font-bold">Título *</label>
          <input 
            className="w-full border p-2 rounded" 
            value={editingGallery.title} 
            onChange={(e) => setEditingGallery({...editingGallery, title: e.target.value})} 
            placeholder="Ej: Osito Teddy"
            required
          />
        </div>
        
        {/* Descripción */}
        <div>
          <label className="text-sm font-bold">Descripción *</label>
          <textarea 
            className="w-full border p-2 rounded h-24" 
            value={editingGallery.description} 
            onChange={(e) => setEditingGallery({...editingGallery, description: e.target.value})} 
            placeholder="Describe el amigurumi..."
            required
          />
        </div>
        
        {/* Categoría */}
        <div>
          <label className="text-sm font-bold">Categoría</label>
          <input 
            className="w-full border p-2 rounded" 
            value={editingGallery.category || 'Sin categoría'} 
            onChange={(e) => setEditingGallery({...editingGallery, category: e.target.value})} 
            placeholder="Ej: Animales, Personajes, etc."
          />
        </div>
        
        {/* Precio */}
        <div>
          <label className="text-sm font-bold">Precio (opcional)</label>
          <input 
            type="number"
            placeholder="0"
            value={editingGallery.price || ''}
            onChange={(e) => setEditingGallery({...editingGallery, price: parseFloat(e.target.value)})}
            className="w-full border p-2 rounded"
          />
        </div>
        
        {/* Preview de imagen */}
        {editingGallery.imageUrl && (
          <div className="relative">
            <img 
              src={editingGallery.imageUrl} 
              alt="preview" 
              className="w-full h-48 object-cover rounded border-2 border-gray-200"
              onError={(e) => {
                console.error('Error loading preview');
                e.currentTarget.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setEditingGallery({...editingGallery, imageUrl: ''})}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              <X size={16}/>
            </button>
          </div>
        )}
        
        {/* Upload de imagen */}
        <div>
          <label className="text-sm font-bold block mb-2">Imagen *</label>
          <label className="w-full border-2 border-dashed border-purple-300 rounded-lg p-6 cursor-pointer hover:bg-purple-50 flex flex-col items-center gap-2">
            <Upload size={32} className="text-purple-600" />
            <span className="font-medium text-purple-700 text-center">
              {uploadingImage ? 'Subiendo...' : 'Click para subir imagen'}
            </span>
            <span className="text-xs text-gray-500">Máx 5MB - JPG, PNG</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileUpload(e, setEditingGallery)}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={uploadingImage}
          className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingImage ? 'Subiendo imagen...' : 'Guardar en Galería'}
        </button>
      </form>
    </div>
  </div>
)}

      {/* Modal de tejedoras */}
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

      {/* Modal de publicaciones */}
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

      {/* Modal de retos */}
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
        
        {/* CAMPO DE ESTADO */}
        <div>
          <label className="text-sm font-bold">Estado del Reto</label>
          <select 
            className="w-full border p-2 rounded" 
            value={editingChallenge.status} 
            onChange={e => setEditingChallenge({...editingChallenge, status: e.target.value as any})}
          >
            <option value="upcoming">Próximamente</option>
            <option value="starting">Por iniciar</option>
            <option value="active">En proceso</option>
            <option value="completed">Finalizado</option>
          </select>
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

      {/* Modal de insumos por amigurumi */}
{isAmigurumiModalOpen && editingAmigurumi && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">
          {editingAmigurumi.id ? 'Editar Amigurumi' : 'Nuevo Amigurumi'}
        </h3>
        <button onClick={() => {
          setIsAmigurumiModalOpen(false);
          setEditingAmigurumi(null);
        }}>
          <X size={24}/>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">Nombre del Amigurumi *</label>
          <input
            type="text"
            value={editingAmigurumi.nombre}
            onChange={(e) => setEditingAmigurumi({...editingAmigurumi, nombre: e.target.value})}
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
            placeholder="Ej: Osito Teddy, Conejito Rosa, etc."
          />
        </div>

        {editingAmigurumi.insumos.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              Insumos Agregados ({editingAmigurumi.insumos.length})
            </h4>
            <div className="space-y-2">
              {editingAmigurumi.insumos.map((insumo) => (
                <div
                  key={insumo.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-3 flex justify-between items-start hover:border-purple-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">
                        {insumo.tipo}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {insumo.marca}
                      </span>
                      {isInsumoInInventory(supplies, insumo) && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                          ✓ En inventario
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Color:</span> {insumo.color}
                      {insumo.referencia && (
                        <span className="ml-3">
                          <span className="font-medium">Ref:</span> {insumo.referencia}
                        </span>
                      )}
                      {insumo.cantidad && (
                        <span className="ml-3">
                          <span className="font-medium">Cantidad:</span> {insumo.cantidad} {insumo.unidad}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveInsumoFromAmigurumi(insumo.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Agregar Nuevo Insumo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {/* TIPO */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tipo de Material
              </label>
              <select
                value={currentInsumoAmigurumi.tipo}
                onChange={(e) => setCurrentInsumoAmigurumi({ 
                  ...currentInsumoAmigurumi, 
                  tipo: e.target.value,
                  marca: '',
                  referencia: '',
                  color: '',
                  cantidad: '',
                  unidad: 'gramos'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="lana">Lana</option>
                <option value="hilo">Hilo</option>
                <option value="relleno">Relleno</option>
                <option value="ojos">Ojos de Seguridad</option>
                <option value="fieltro">Fieltro</option>
                <option value="botones">Botones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* MARCA CON AUTOCOMPLETADO */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Marca * 
                <span className="text-purple-600 ml-1">↓ Sugerencias</span>
              </label>
              <AutocompleteInput
                value={currentInsumoAmigurumi.marca}
                onChange={(val) => setCurrentInsumoAmigurumi({...currentInsumoAmigurumi, marca: val})}
                suggestions={getMarcasSuggestions(supplies, currentInsumoAmigurumi.tipo)}
                placeholder="Ej: Copito, Lanasol"
                field="marca"
              />
            </div>

            {/* REFERENCIA CON AUTOCOMPLETADO */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Referencia/Código
                {currentInsumoAmigurumi.marca && (
                  <span className="text-purple-600 ml-1">↓ Sugerencias</span>
                )}
              </label>
              <AutocompleteInput
                value={currentInsumoAmigurumi.referencia}
                onChange={(val) => handleReferenciaChangeModal(val)}
                suggestions={getReferenciasSuggestions(supplies, currentInsumoAmigurumi.marca)}
                placeholder="Ej: REF-1234"
                field="referencia"
                disabled={!currentInsumoAmigurumi.marca}
              />
            </div>

            {/* COLOR CON AUTOCOMPLETADO */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Color *
                {currentInsumoAmigurumi.marca && (
                  <span className="text-purple-600 ml-1">↓ Sugerencias</span>
                )}
              </label>
              <AutocompleteInput
                value={currentInsumoAmigurumi.color}
                onChange={(val) => setCurrentInsumoAmigurumi({...currentInsumoAmigurumi, color: val})}
                suggestions={getColoresSuggestions(supplies, currentInsumoAmigurumi.marca, currentInsumoAmigurumi.referencia)}
                placeholder="Ej: Blanco hueso, Rosa pastel"
                field="color"
                disabled={!currentInsumoAmigurumi.marca}
              />
            </div>

            {/* CANTIDAD */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cantidad
              </label>
              <input
                type="text"
                value={currentInsumoAmigurumi.cantidad}
                onChange={(e) => setCurrentInsumoAmigurumi({...currentInsumoAmigurumi, cantidad: e.target.value})}
                placeholder="Ej: 50, 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            {/* UNIDAD */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Unidad
              </label>
              <select
                value={currentInsumoAmigurumi.unidad}
                onChange={(e) => setCurrentInsumoAmigurumi({...currentInsumoAmigurumi, unidad: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              >
                <option value="gramos">Gramos</option>
                <option value="metros">Metros</option>
                <option value="unidades">Unidades</option>
                <option value="pares">Pares</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAddInsumoToAmigurumi}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Agregar Insumo
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveAmigurumiRecordModal}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={20} />
            Guardar Amigurumi
          </button>
          <button
            onClick={() => {
              setIsAmigurumiModalOpen(false);
              setEditingAmigurumi(null);
            }}
            className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            <X size={20} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminDashboard;