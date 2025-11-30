import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Upload, Check, Copy, ExternalLink, MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Order, ProductConfig, InventoryItem } from '../types';
import { mockPaymentMethods } from '../services/mockData';
import { db } from '../services/db';

// --- DYNAMIC FORM CONFIGURATION ---
type FieldType = 'text' | 'select' | 'radio';

interface FormField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

interface AmigurumiTypeConfig {
  id: string;
  label: string;
  fields: FormField[];
}

const AMIGURUMI_TYPES: AmigurumiTypeConfig[] = [
  {
    id: 'otro',
    label: 'Otro / Personalizado (Descripción Libre)',
    fields: [] // Empty fields means use standard textarea
  },
  {
    id: 'virgen',
    label: 'Virgen Religiosa',
    fields: [
      { key: 'cuerpo', label: 'Color Cuerpo', type: 'text', placeholder: 'Ej: Piel clara' },
      { key: 'manto', label: 'Color Manto', type: 'text', placeholder: 'Ej: Azul rey' },
      { key: 'denario_acabado', label: 'Acabado Denario', type: 'select', options: ['Plateado', 'Dorado'] },
      { key: 'corona_acabado', label: 'Acabado Corona', type: 'select', options: ['Plateado', 'Dorado'] },
      { key: 'detalles_acabado', label: 'Acabado Detalles', type: 'select', options: ['Plateado', 'Dorado'] },
    ]
  },
  {
    id: 'coneja',
    label: 'Coneja',
    fields: [
      { key: 'cuerpo', label: 'Color Cuerpo', type: 'select', options: ['Galleta', 'Piel', 'Blanco', 'Rosado', 'Gris', 'Beige'] },
      { key: 'falda', label: 'Color Falda/Vestido', type: 'select', options: ['Blanco', 'Rosado', 'Azul', 'Lila', 'Verde Menta', 'Amarillo', 'Otro'] },
      { key: 'diadema', label: '¿Diadema de flores?', type: 'select', options: ['Sí', 'No'] },
      { key: 'orejas', label: 'Color Interior Orejas', type: 'text', placeholder: 'Ej: Rosado pastel' },
    ]
  },
  {
    id: 'sirena',
    label: 'Sirena',
    fields: [
      { key: 'piel', label: 'Tono de Piel', type: 'select', options: ['Piel clara', 'Piel morena', 'Piel oscura'] },
      { key: 'cabello', label: 'Color de Cabello', type: 'text', placeholder: 'Ej: Rojo Ariel' },
      { key: 'cola_color', label: 'Color de Cola', type: 'text', placeholder: 'Ej: Verde esmeralda' },
      { key: 'cola_estilo', label: 'Estilo de Cola', type: 'select', options: ['Escamas brillantes', 'Lisa', 'Con detalles'] },
      { key: 'top_tipo', label: 'Top/Sostén', type: 'select', options: ['Concha', 'Estrella de mar', 'Flores'] },
      { key: 'top_color', label: 'Color del Top', type: 'text', placeholder: 'Ej: Morado' },
    ]
  },
  {
    id: 'harry_potter',
    label: 'Harry Potter (Saga)',
    fields: [
      { key: 'personaje', label: 'Personaje', type: 'select', options: ['Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Draco Malfoy', 'Luna Lovegood', 'Dobby', 'Hagrid', 'Otro'] },
      { key: 'piel', label: 'Tono de Piel', type: 'select', options: ['Claro', 'Medio', 'Oscuro'] },
      { key: 'cabello', label: 'Color Cabello', type: 'text', placeholder: 'Ej: Negro, Rojo Weasley' },
      { key: 'casa', label: 'Uniforme / Casa', type: 'select', options: ['Gryffindor (Rojo/Dorado)', 'Slytherin (Verde/Plata)', 'Ravenclaw (Azul/Bronce)', 'Hufflepuff (Amarillo/Negro)', 'Ropa de calle'] },
      { key: 'accesorios', label: 'Accesorios', type: 'text', placeholder: 'Ej: Varita, Libro, Túnica, Bufanda, Escoba, Lechuza' },
      { key: 'detalles', label: 'Detalles Especiales', type: 'text', placeholder: 'Ej: Cicatriz de rayo, Gafas redondas, Ninguno' },
    ]
  },
  {
    id: 'tim_burton',
    label: 'Coraline / Tim Burton',
    fields: [
      { key: 'pelicula', label: 'Película / Estilo', type: 'select', options: ['Coraline', 'El Extraño Mundo de Jack', 'El Cadáver de la Novia', 'Frankenweenie', 'Alicia en el País de las Maravillas'] },
      { key: 'personaje', label: 'Personaje Específico', type: 'text', placeholder: 'Ej: Coraline Jones, Victor Van Dort' },
      { key: 'piel', label: 'Tono de Piel', type: 'text', placeholder: 'Ej: Pálido, Grisáceo' },
      { key: 'cabello', label: 'Color Cabello', type: 'text', placeholder: 'Ej: Azul, Negro' },
      { key: 'outfit', label: 'Outfit Característico', type: 'text', placeholder: 'Ej: Impermeable amarillo, Traje de rayas' },
      { key: 'accesorios', label: 'Accesorios', type: 'text', placeholder: 'Ej: Llave negra, Ojos de botón, Muñeca, Gato' },
      { key: 'ojos', label: 'Estilo de Ojos', type: 'select', options: ['Botones', 'Normales', 'Grandes estilo Tim Burton'] },
    ]
  },
  {
    id: 'disney_princesas',
    label: 'Princesas Disney',
    fields: [
      { key: 'personaje', label: 'Personaje', type: 'select', options: ['Elsa', 'Anna', 'Moana', 'Bella', 'Ariel', 'Cenicienta', 'Blancanieves', 'Rapunzel', 'Tiana', 'Jasmine', 'Otra'] },
      { key: 'piel', label: 'Tono de Piel', type: 'text', placeholder: 'Ej: Clara, Morena' },
      { key: 'cabello', label: 'Color Cabello', type: 'text', placeholder: 'Ej: Rubio largo, Negro' },
      { key: 'vestido', label: 'Color Vestido Característico', type: 'text', placeholder: 'Ej: Azul hielo, Amarillo baile' },
      { key: 'accesorios', label: 'Accesorios', type: 'text', placeholder: 'Ej: Corona, Varita, Flor, Animal companion' },
      { key: 'detalles', label: 'Detalles Especiales', type: 'text', placeholder: 'Ej: Pecas, Tatuajes' },
    ]
  },
  {
    id: 'disney_pixar',
    label: 'Disney Pixar',
    fields: [
      { key: 'pelicula', label: 'Película', type: 'select', options: ['Toy Story', 'Monsters Inc', 'Buscando a Nemo', 'Intensamente', 'Coco', 'Up', 'Cars', 'Otra'] },
      { key: 'personaje', label: 'Personaje Específico', type: 'text', placeholder: 'Ej: Woody, Miguel, Alegría' },
      { key: 'colores', label: 'Colores Principales', type: 'text', placeholder: 'Ej: Naranja y Blanco (Nemo)' },
      { key: 'accesorios', label: 'Accesorios Característicos', type: 'text', placeholder: 'Ej: Sombrero, Guitarra, Globos' },
      { key: 'detalles', label: 'Detalles Especiales', type: 'text', placeholder: 'Expresión facial, pose, etc.' },
    ]
  },
  {
    id: 'superheroes',
    label: 'Superhéroes (Marvel/DC)',
    fields: [
      { key: 'universo', label: 'Universo', type: 'select', options: ['Marvel', 'DC Comics', 'Otro'] },
      { key: 'personaje', label: 'Superhéroe', type: 'text', placeholder: 'Ej: Spiderman, Batman' },
      { key: 'version', label: 'Versión del Traje', type: 'text', placeholder: 'Ej: Traje clásico comic, Película reciente' },
      { key: 'mascara', label: '¿Con máscara?', type: 'select', options: ['Sí, puesta', 'No, sin máscara', 'Máscara removible'] },
    ]
  },
  {
    id: 'mascotas',
    label: 'Mascota Personalizada',
    fields: [
      { key: 'tipo', label: 'Tipo de Animal', type: 'text', placeholder: 'Ej: Perro, Gato, Conejo' },
      { key: 'raza', label: 'Raza / Mestizo', type: 'text', placeholder: 'Ej: Golden Retriever' },
      { key: 'manchas', label: 'Manchas o Señas Particulares', type: 'text', placeholder: 'Describe ubicación de manchas' },
      { key: 'accesorios', label: 'Accesorios', type: 'text', placeholder: 'Ej: Pañoleta roja, Collar azul' },
    ]
  },
  {
    id: 'profesiones',
    label: 'Profesiones',
    fields: [
      { key: 'profesion', label: 'Profesión', type: 'text', placeholder: 'Ej: Médico, Ingeniero, Policía' },
      { key: 'genero', label: 'Género Muñeco', type: 'select', options: ['Hombre', 'Mujer'] },
      { key: 'uniforme', label: 'Color Uniforme', type: 'text', placeholder: 'Ej: Bata blanca, Overol azul' },
      { key: 'accesorios', label: 'Herramientas/Accesorios', type: 'text', placeholder: 'Ej: Estetoscopio, Casco, Plano' },
    ]
  }
];

const RequestForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  
  // Dynamic Inventory State
  const [inventory, setInventory] = useState<ProductConfig>({ sizes: [], packaging: [], accessories: [] });
  const [globalConfig, setGlobalConfig] = useState(db.getConfig());

  // Dynamic Form State
  const [selectedType, setSelectedType] = useState<string>('otro');
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [extraNotes, setExtraNotes] = useState('');

  const [formData, setFormData] = useState({
    nombreProducto: '',
    descripcion: '', // This will be auto-generated
    imagen: null as File | null,
    imagenPreview: '', // New state for preview
    sizeId: '', 
    packagingId: '', 
    accessories: [] as string[],
    paymentMethod: '',
    paymentOption: 'total' as 'total' | 'abono',
  });

  useEffect(() => {
      setInventory(db.getInventory());
      setGlobalConfig(db.getConfig());
      
      const user = localStorage.getItem('puntadas_user');
      if (!user) {
          navigate('/register');
      } else {
          setUserEmail(user);
      }
      
      // Handle Reorder Logic
      if (location.state && location.state.reorderOrder) {
          const oldOrder = location.state.reorderOrder as Order;
          setFormData(prev => ({
              ...prev,
              nombreProducto: oldOrder.nombre_producto,
              // Try to find if description contains a type hint, otherwise default to 'otro' and dump desc in notes
              imagenPreview: oldOrder.imagen_url,
          }));
          setExtraNotes(`[REORDEN de #${oldOrder.numero_seguimiento}]\n${oldOrder.descripcion}`);
      }
  }, [navigate, location]);

  // --- FORM LOGIC ---

  // Update formData.descripcion whenever dynamic inputs change
  useEffect(() => {
    if (selectedType === 'otro') {
      setFormData(prev => ({ ...prev, descripcion: extraNotes }));
    } else {
      const currentConfig = AMIGURUMI_TYPES.find(t => t.id === selectedType);
      const typeLabel = currentConfig?.label || selectedType;
      
      let generatedDesc = `TIPO: ${typeLabel.toUpperCase()}\n\n`;
      
      // Add fields in order defined in configuration
      if (currentConfig && currentConfig.fields) {
        currentConfig.fields.forEach(field => {
            const value = dynamicValues[field.key];
            if (value) generatedDesc += `- ${field.label}: ${value}\n`;
        });
      }

      if (extraNotes) {
        generatedDesc += `\nNOTAS ADICIONALES:\n${extraNotes}`;
      }

      setFormData(prev => ({ ...prev, descripcion: generatedDesc }));
    }
  }, [selectedType, dynamicValues, extraNotes]);

  const handleDynamicChange = (key: string, value: string) => {
    setDynamicValues(prev => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setDynamicValues({}); // Reset dynamic values when type changes
  };

  // Helper to get item by ID
  const getItem = (id: string, list: InventoryItem[]) => list.find(i => i.id === id);

  // Set defaults once inventory loads
  useEffect(() => {
      if(inventory.sizes.length > 0 && !formData.sizeId) {
          setFormData(prev => ({ 
              ...prev, 
              sizeId: inventory.sizes[2]?.id || inventory.sizes[0].id,
              packagingId: inventory.packaging[2]?.id || inventory.packaging[0].id
           }));
      }
  }, [inventory]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { // 2MB limit check
        alert("La imagen es muy grande. Por favor usa una imagen menor a 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({
          ...prev,
          imagen: file,
          imagenPreview: ev.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate totals
  const selectedSize = getItem(formData.sizeId, inventory.sizes);
  const selectedPack = getItem(formData.packagingId, inventory.packaging);
  
  const basePrice = selectedSize?.price || 0;
  const packPrice = selectedPack?.price || 0;
  const accPrice = formData.accessories.reduce((acc, id) => {
      const item = getItem(id, inventory.accessories);
      return acc + (item?.price || 0);
  }, 0);

  const subtotal = basePrice + packPrice + accPrice;
  const discount = 0; 
  const total = subtotal - discount;
  
  // Logic from Global Config
  const canPayPartial = total > (globalConfig?.limite_pago_completo || 0);
  const abonoFijo = globalConfig?.abono_minimo_fijo || 0;

  const montoAPagar = formData.paymentOption === 'total' || !canPayPartial 
    ? total 
    : abonoFijo;

  const saldoPendiente = total - montoAPagar;

  const nextStep = () => {
      if (step === 1) {
          if (!formData.nombreProducto) {
              alert("Por favor ingresa el nombre del producto.");
              return;
          }
          if (selectedType === 'otro' && !extraNotes) {
              alert("Por favor describe tu pedido.");
              return;
          }
      }
      setStep(s => Math.min(s + 1, 4));
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const toggleAccessory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      accessories: prev.accessories.includes(id) 
        ? prev.accessories.filter(i => i !== id)
        : [...prev.accessories, id]
    }));
  };

  const createOrder = (isBold: boolean): Order => {
    const trackingNumber = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Si es Bold, no se asume pago. Se queda en 0 y estado En espera.
    // Si es Manual, igual, hasta que se confirme.
    // La diferencia es que con Bold el link se abre.
    
    const finalDescription = isBold 
        ? `${formData.descripcion}\n\n[PAGO BOLD INICIADO: $${montoAPagar.toLocaleString()} - Pendiente de Confirmación]`
        : formData.descripcion;

    const newOrder: Order = {
        id: `ord-${Date.now()}`,
        clientEmail: userEmail,
        numero_seguimiento: trackingNumber,
        nombre_producto: formData.nombreProducto || 'Amigurumi Personalizado',
        estado: 'En espera de agendar', // Siempre en espera hasta confirmar dinero
        fecha_solicitud: new Date().toISOString().split('T')[0],
        total_final: total,
        monto_pagado: 0, // Se asume 0 hasta que el admin verifique
        saldo_pendiente: total, // Deuda total hasta verificar
        imagen_url: formData.imagenPreview || 'https://picsum.photos/200/200?random=1',
        descripcion: finalDescription,
        desglose: {
            precio_base: basePrice,
            empaque: packPrice,
            accesorios: accPrice,
            descuento: discount
        },
        puede_reordenar: false,
        puede_calificar: false
    };

    return newOrder;
  };

  const handleBoldPayment = () => {
    const boldMethod = mockPaymentMethods.find(m => m.id === 'bold');
    if (boldMethod?.url_pago) {
      const order = createOrder(true);
      db.addOrder(order);
      setSuccessView(true);
      setLastOrder(order);
      window.open(boldMethod.url_pago, '_blank');
    }
  };

  const handleManualConfirmation = () => {
    const order = createOrder(false); 
    db.addOrder(order);
    
    setSuccessView(true);
    setLastOrder(order);

    const metodoNombre = mockPaymentMethods.find(m => m.id === formData.paymentMethod)?.tipo || 'Manual';
    const msg = `Pedido #${order.numero_seguimiento}
Monto a Pagar: $${montoAPagar.toLocaleString()}
Método: ${metodoNombre}
Detalle: ${order.descripcion}`;

    const phone = "573124915127";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Success View State
  const [successView, setSuccessView] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  if (successView && lastOrder) {
      return (
          <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check size={40} className="text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Solicitud Registrada!</h2>
                  <p className="text-gray-600 mb-8">
                      Tu pedido <strong>#{lastOrder.numero_seguimiento}</strong> ha sido creado.
                      <br/>
                      <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-bold">Importante:</span>
                      <br/>
                      El estado cambiará a "Agendado" una vez verifiquemos el pago.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                      >
                          Ir a Mis Pedidos
                      </button>
                      <button 
                        onClick={() => { setSuccessView(false); setStep(1); setFormData({...formData, nombreProducto: '', descripcion: '', imagen: null, imagenPreview: '', accessories: []}); setSelectedType('otro'); setDynamicValues({}); setExtraNotes(''); }}
                        className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                      >
                          Solicitar Otro
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if(inventory.sizes.length === 0) return <div>Cargando precios...</div>;

  const currentTypeConfig = AMIGURUMI_TYPES.find(t => t.id === selectedType);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-4">
          {['Info', 'Personalización', 'Resumen', 'Pago'].map((label, i) => (
            <span key={i} className={`text-sm font-bold ${step > i ? 'text-pink-600' : 'text-gray-400'}`}>
              {label} ({i + 1}/4)
            </span>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* Step 1: Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">1. Información del Producto</h2>
            <div className="bg-pink-50 p-4 rounded-lg text-sm text-pink-700 border border-pink-200 flex items-start gap-3">
                <Sparkles className="flex-shrink-0" size={20}/>
                <p>¡Hola! Describe tu amigurumi ideal. Selecciona un tipo para ver opciones específicas o usa "Otro" para escribir libremente.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proyecto *</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                placeholder="Ej: Pikachu Detective, Virgen de Guadalupe..."
                value={formData.nombreProducto}
                onChange={e => setFormData({...formData, nombreProducto: e.target.value})}
              />
            </div>

            {/* Type Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Amigurumi</label>
                <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                    value={selectedType}
                    onChange={handleTypeChange}
                >
                    {AMIGURUMI_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                </select>
            </div>

            {/* Dynamic Fields */}
            {currentTypeConfig && currentTypeConfig.fields.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                    <h3 className="font-bold text-gray-700 text-sm border-b border-gray-200 pb-2 mb-4">Detalles para {currentTypeConfig.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentTypeConfig.fields.map(field => (
                            <div key={field.key} className={field.type === 'text' ? 'md:col-span-1' : ''}>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">{field.label}</label>
                                {field.type === 'select' ? (
                                    <select 
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none text-sm"
                                        value={dynamicValues[field.key] || ''}
                                        onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none text-sm"
                                        placeholder={field.placeholder || ''}
                                        value={dynamicValues[field.key] || ''}
                                        onChange={(e) => handleDynamicChange(field.key, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional Notes / Free Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                 {selectedType === 'otro' ? 'Descripción Detallada *' : 'Notas Adicionales / Comentarios'}
              </label>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none h-32"
                placeholder={selectedType === 'otro' ? "Describe colores, expresiones, ropa y todos los detalles..." : "Cualquier otro detalle que no esté en el formulario..."}
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de Referencia (Opcional)</label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative overflow-hidden"
              >
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                
                {formData.imagenPreview ? (
                  <div className="relative z-10">
                    <img 
                      src={formData.imagenPreview} 
                      alt="Preview" 
                      className="mx-auto h-40 object-contain rounded shadow-sm"
                    />
                    <p className="mt-2 text-sm text-green-600 font-medium">¡Imagen cargada!</p>
                    <p className="text-xs text-gray-400">Clic para cambiar</p>
                  </div>
                ) : (
                  <div className="relative z-10">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Arrastra o selecciona una imagen</p>
                    <p className="text-xs text-gray-400 mt-1">Máx 2MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Customization */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">2. Personalización</h2>
            
            {/* Size */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tamaño *</h3>
              <div className="space-y-2">
                {inventory.sizes.map((size) => (
                  <div 
                    key={size.id} 
                    onClick={() => setFormData({...formData, sizeId: size.id})}
                    className={`flex justify-between p-4 rounded-lg cursor-pointer border transition ${formData.sizeId === size.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.sizeId === size.id ? 'border-pink-500' : 'border-gray-400'}`}>
                            {formData.sizeId === size.id && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                        </div>
                        <span>{size.label}</span>
                    </div>
                    <span className="font-bold">${size.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Packaging */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Empaque *</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inventory.packaging.map((pack) => (
                  <div 
                    key={pack.id} 
                    onClick={() => setFormData({...formData, packagingId: pack.id})}
                    className={`p-4 rounded-lg cursor-pointer border transition ${formData.packagingId === pack.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                         <div className="text-sm font-medium">{pack.label}</div>
                         {formData.packagingId === pack.id && <Check size={16} className="text-purple-600"/>}
                    </div>
                    <div className="text-sm text-gray-500">+${pack.price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Accesorios</h3>
              <div className="grid grid-cols-2 gap-3">
                {inventory.accessories.map((acc) => (
                  <div 
                    key={acc.id} 
                    onClick={() => toggleAccessory(acc.id)}
                    className={`p-4 rounded-lg cursor-pointer border transition flex items-center justify-between ${formData.accessories.includes(acc.id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{acc.label}</div>
                      <div className="text-sm text-gray-500">+${acc.price.toLocaleString()}</div>
                    </div>
                    {formData.accessories.includes(acc.id) && <Check size={16} className="text-green-600"/>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
                <span>Precio actual:</span>
                <span className="text-xl font-bold">${total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-bold text-gray-800">3. Resumen</h2>
             
             <div className="bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-200">
                <div className="flex gap-4 mb-4">
                  {formData.imagenPreview && (
                    <img src={formData.imagenPreview} alt="Ref" className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-white" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{formData.nombreProducto}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 whitespace-pre-line">{formData.descripcion}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="font-semibold">Tamaño:</span>
                      <span>{selectedSize?.label}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="font-semibold">Empaque:</span>
                      <span>{selectedPack?.label}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="font-semibold">Accesorios:</span>
                      <span>{formData.accessories.length > 0 ? formData.accessories.map(id => getItem(id, inventory.accessories)?.label).join(', ') : 'Ninguno'}</span>
                    </div>
                </div>
                
                <div className="h-px bg-gray-300 my-4"></div>

                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio base:</span>
                    <span>${basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Empaque:</span>
                    <span>${packPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accesorios:</span>
                    <span>${accPrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between border-t-2 border-gray-800 pt-4 text-xl font-bold">
                    <span>TOTAL:</span>
                    <span>${total.toLocaleString()}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
                <div className="bg-white p-1 rounded border border-blue-200">
                    <Check size={16} className="text-blue-600" />
                </div>
                <label>Confirmo que los detalles son correctos y acepto los términos.</label>
             </div>
          </div>
        )}

        {/* Step 4: Payment Confirmation */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">4. Pago</h2>
            
            {/* Payment Amount Logic */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between mb-4 items-center">
                    <span className="text-gray-600">Total Pedido:</span>
                    <span className="text-lg font-bold">${total.toLocaleString()}</span>
                </div>
                
                <h3 className="font-semibold mb-2 text-sm text-gray-500 uppercase">¿Cuánto deseas pagar hoy?</h3>
                <div className="space-y-2">
                    <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${formData.paymentOption === 'total' ? 'border-pink-500 bg-pink-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentOption === 'total' ? 'border-pink-500' : 'border-gray-400'}`}>
                                {formData.paymentOption === 'total' && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                            </div>
                            <span>Pago Total</span>
                        </div>
                        <span className="font-bold">${total.toLocaleString()}</span>
                    </label>

                    {canPayPartial ? (
                         <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${formData.paymentOption === 'abono' ? 'border-pink-500 bg-pink-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.paymentOption === 'abono' ? 'border-pink-500' : 'border-gray-400'}`}>
                                    {formData.paymentOption === 'abono' && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                </div>
                                <span>Abono (Reserva)</span>
                            </div>
                            <span className="font-bold">${abonoFijo.toLocaleString()}</span>
                        </label>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                            <AlertCircle size={14}/>
                            Pedidos menores a ${globalConfig?.limite_pago_completo?.toLocaleString() || '0'} requieren pago completo.
                        </div>
                    )}
                </div>
                
                {formData.paymentOption === 'abono' && (
                     <div className="mt-2 text-right text-sm text-gray-500">
                        Saldo pendiente al entregar: <span className="font-bold text-gray-800">${saldoPendiente.toLocaleString()}</span>
                     </div>
                )}
            </div>

            <h3 className="font-semibold text-sm text-gray-500 uppercase mt-4">Selecciona Medio de Pago:</h3>
            <div className="space-y-3">
                {mockPaymentMethods.map((method) => (
                    <div 
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition ${formData.paymentMethod === method.id ? 'ring-2 ring-pink-500 bg-pink-50' : 'hover:bg-gray-50'}`}
                        onClick={() => setFormData({...formData, paymentMethod: method.id})}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{method.icono}</span>
                                <span className="font-bold text-gray-800">{method.tipo}</span>
                            </div>
                            {method.id === 'bold' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Automático</span>}
                        </div>
                        
                        {formData.paymentMethod === method.id && (
                            <div className="mt-3 pl-8 animate-fade-in">
                                {method.id === 'bold' ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-600">Pago seguro con tarjeta de crédito, débito o PSE.</p>
                                        <button 
                                            onClick={handleBoldPayment}
                                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-md"
                                        >
                                            <ExternalLink size={18} /> Pagar ${montoAPagar.toLocaleString()} en Bold
                                        </button>
                                        <p className="text-xs text-orange-600">Nota: El pago se verificará antes de agendar.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                         <p className="text-sm text-gray-600 font-medium">Cuenta: {method.numero}</p>
                                         <p className="text-xs text-gray-500">Titular: {method.titular}</p>
                                         <button className="text-xs flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 font-medium mb-2">
                                            <Copy size={12} /> Copiar Datos
                                         </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {formData.paymentMethod && formData.paymentMethod !== 'bold' && (
                 <div className="bg-blue-50 p-4 rounded-lg mt-4 text-sm border border-blue-200 animate-fade-in">
                    <p className="font-bold mb-2">Pasos para confirmar:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 mb-4">
                        <li>Transfiere <b>${montoAPagar.toLocaleString()}</b> a la cuenta indicada.</li>
                        <li>Toma una captura del comprobante.</li>
                        <li>Presiona el botón verde abajo.</li>
                    </ol>
                    <button 
                        onClick={handleManualConfirmation}
                        className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 flex justify-center items-center gap-2 transition transform active:scale-95 shadow-lg"
                    >
                         <MessageCircle size={20} /> Confirmar y Enviar Comprobante
                    </button>
                 </div>
            )}

          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
           <button 
                onClick={prevStep} 
                disabled={step === 1}
                className={`flex items-center px-4 py-2 rounded-lg transition ${step === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
           >
                <ChevronLeft size={20} /> Atrás
           </button>
           
           {step < 4 && (
             <button 
                onClick={nextStep} 
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
             >
                Siguiente <ChevronRight size={20} />
             </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default RequestForm;