import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../services/supabaseClient';
import { db } from '../services/db';
import { uploadImage } from '../services/storage';
import { InventoryItem, Client, QuoteData } from '../types';
import { 
  FileText, Download, Send, ChevronLeft, 
  DollarSign, Package, Image as ImageIcon, User, 
  Save, Eye, Trash2
} from 'lucide-react';

const COLORS = {
  coral: '#D4735E',
  sageGreen: '#A9B4A1',
  pastelPink: '#FFD6E0',
  pastelBlue: '#C5D8E8',
  pastelGreen: '#D8E6D8',
  pastelPurple: '#E6D7E8',
  pastelYellow: '#FFF5D6',
  pastelOrange: '#FFE5D9',
  pastelRed: '#FFD6D9',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#F5F5F5'
};

const QuoteGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [homeConfig, setHomeConfig] = useState<any>(null);
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [showSavedQuotes, setShowSavedQuotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [quoteData, setQuoteData] = useState<QuoteData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    productName: '',
    description: '',
    basePrice: 0,
    selectedSizeId: '',
    selectedPackagingId: '',
    selectedAccessories: [],
    imageUrl: '',
    notes: ''
  });

  const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}${day}-${random}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Iniciando carga de datos...');
      
      const [clientsData, inventoryData, homeData] = await Promise.all([
        db.getAllClients().catch(err => {
          console.error('Error cargando clientes:', err);
          return [];
        }),
        db.getInventoryItems().catch(err => {
          console.error('Error cargando inventario:', err);
          return [];
        }),
        db.getHomeConfig().catch(err => {
          console.error('Error cargando configuración:', err);
          return null;
        })
      ]);
      
      console.log('✅ Datos cargados:', {
        clients: clientsData.length,
        inventory: inventoryData.length,
        homeConfig: homeData ? 'loaded' : 'not loaded'
      });
      
      setClients(clientsData);
      setInventoryItems(inventoryData);
      setHomeConfig(homeData);
      
      await loadSavedQuotes();
      
    } catch (error) {
      console.error('❌ Error general en loadData:', error);
      setError('Error al cargar los datos. Por favor recarga la página.');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedQuotes = async () => {
    try {
      console.log('📋 Cargando cotizaciones guardadas...');
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading saved quotes:', error);
        setSavedQuotes([]);
      } else {
        console.log('✅ Cotizaciones cargadas:', data?.length || 0);
        setSavedQuotes(data || []);
      }
    } catch (error) {
      console.error('Exception in loadSavedQuotes:', error);
      setSavedQuotes([]);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('puntadas_user');
      const role = localStorage.getItem('puntadas_role');
      if (!user || role !== 'admin') {
        console.log('❌ Usuario no autenticado o no es admin');
        navigate('/login');
        return;
      }
    };

    checkAuth();
    loadData();
  }, [navigate]);

  const handleClientSelect = (email: string) => {
    const client = clients.find(c => c.email === email);
    if (client) {
      setQuoteData({
        ...quoteData,
        clientName: client.nombre_completo,
        clientEmail: client.email,
        clientPhone: client.telefono || ''
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setError(null);
        console.log('📤 Subiendo imagen...');
        const imageUrl = await uploadImage(file, 'quotes');
        console.log('✅ Imagen subida:', imageUrl);
        setQuoteData({ ...quoteData, imageUrl });
      } catch (error) {
        console.error('❌ Error uploading image:', error);
        setError('Error al subir la imagen');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSizeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSize = inventoryItems.find(item => item.id === e.target.value);
    const newBasePrice = selectedSize ? 0 : quoteData.basePrice;
    
    setQuoteData({ 
      ...quoteData, 
      selectedSizeId: e.target.value,
      basePrice: newBasePrice
    });
    
    setError(null);
  };

  const handleBasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBasePrice = Number(e.target.value);
    
    if (quoteData.selectedSizeId) {
      setError('No puedes modificar el precio base cuando hay un tamaño seleccionado');
      return;
    }
    
    setQuoteData({ ...quoteData, basePrice: newBasePrice });
    setError(null);
  };

  const calculateTotal = () => {
    let total = 0;
    
    if (quoteData.selectedSizeId) {
      const selectedSize = inventoryItems.find(item => item.id === quoteData.selectedSizeId);
      if (selectedSize) {
        total = selectedSize.price;
      }
    } else if (quoteData.basePrice > 0) {
      total = quoteData.basePrice;
    }
    
    if (quoteData.selectedPackagingId) {
      const selectedPackaging = inventoryItems.find(item => item.id === quoteData.selectedPackagingId);
      if (selectedPackaging) {
        total += selectedPackaging.price;
      }
    }
    
    if (quoteData.selectedAccessories && quoteData.selectedAccessories.length > 0) {
      quoteData.selectedAccessories.forEach(accId => {
        const accessory = inventoryItems.find(item => item.id === accId);
        if (accessory) {
          total += accessory.price;
        }
      });
    }
    
    return total;
  };

  const saveQuote = async () => {
    if (!quoteData.clientName || !quoteData.clientEmail || !quoteData.productName) {
      setError('Por favor completa los campos obligatorios del cliente y del producto');
      return;
    }

    if (!quoteData.selectedSizeId && quoteData.basePrice <= 0) {
      setError('Por favor selecciona un tamaño o especifica un precio base');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      console.log('💾 Guardando cotización...');
      
      const quoteToSave = {
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
        total_amount: calculateTotal(),
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('quotes')
        .insert([quoteToSave])
        .select();

      if (error) throw error;

      console.log('✅ Cotización guardada:', data);
      alert('Cotización guardada correctamente');
      
      setQuoteData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        productName: '',
        description: '',
        basePrice: 0,
        selectedSizeId: '',
        selectedPackagingId: '',
        selectedAccessories: [],
        imageUrl: '',
        notes: ''
      });
      
      await loadSavedQuotes();
      
    } catch (error) {
      console.error('❌ Error saving quote:', error);
      setError('Error al guardar la cotización');
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!quoteData.clientName || !quoteData.clientEmail || !quoteData.productName) {
      setError('Por favor completa los campos obligatorios del cliente y del producto');
      return;
    }

    if (!quoteData.selectedSizeId && quoteData.basePrice <= 0) {
      setError('Por favor selecciona un tamaño o especifica un precio base');
      return;
    }

    try {
      console.log('📄 Generando PDF con diseño mejorado...');
      const doc = new jsPDF();
      const total = calculateTotal();
      const quoteNumber = generateQuoteNumber();
      
      // Colores del nuevo diseño
      const roseRGB = [244, 114, 182]; // rose-400
      const emeraldRGB = [16, 185, 129]; // emerald-500
      const slateRGB = [71, 85, 105]; // slate-600

      // Header con gradiente simulado (rose a orange)
      doc.setFillColor(...roseRGB);
      doc.rect(0, 0, 210, 35, 'F');
      
      // Función para dibujar texto con contorno blanco
      const drawOutlinedText = (text: string, x: number, y: number, fillColor: number[]) => {
        const outlineOffset = 0.3;
        
        // Dibujar contorno blanco
        doc.setTextColor(255, 255, 255);
        doc.text(text, x - outlineOffset, y - outlineOffset);
        doc.text(text, x + outlineOffset, y - outlineOffset);
        doc.text(text, x - outlineOffset, y + outlineOffset);
        doc.text(text, x + outlineOffset, y + outlineOffset);
        doc.text(text, x - outlineOffset, y);
        doc.text(text, x + outlineOffset, y);
        doc.text(text, x, y - outlineOffset);
        doc.text(text, x, y + outlineOffset);
        
        // Dibujar texto con color de relleno
        doc.setTextColor(...fillColor);
        doc.text(text, x, y);
      };
      
      // Título principal con estilo multicolor y contorno blanco
      const titleText = 'PUNTADAS DE MECHIS';
      const titleColors = [
        [255, 107, 129], // Rosa vibrante
        [255, 154, 0],   // Naranja
        [76, 175, 80],   // Verde
        [156, 39, 176],  // Púrpura
        [33, 150, 243],  // Azul
        [255, 193, 7],   // Amarillo
      ];
      
      let xPos = 30;
      const fontSize = 28;
      const yPosition = 18;
      
      // Dividir el texto en partes y aplicar diferentes colores
      const words = titleText.split(' ');
      const colorsPerWord = [
        titleColors[0], // PUNTADAS - Rosa
        titleColors[1], // DE - Naranja
        titleColors[2], // MECHIS - Verde
      ];
      
      // Calcular el ancho total para centrar
      let totalWidth = 0;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      words.forEach((word, index) => {
        totalWidth += doc.getTextWidth(word) + (index < words.length - 1 ? doc.getTextWidth(' ') : 0);
      });
      
      // Posición inicial para centrar
      xPos = (210 - totalWidth) / 2;
      
      // Dibujar cada palabra con su color y contorno
      words.forEach((word, index) => {
        drawOutlinedText(word, xPos, yPosition, colorsPerWord[index]);
        xPos += doc.getTextWidth(word) + doc.getTextWidth(' ');
      });
      
      // CAMBIO: Subtítulo dentro del header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('hilos que conectan corazones', 105, 26, { align: 'center' });

      // Número de cotización en header (derecha) - COLOR BLANCO
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Cotización', 170, 12);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${quoteNumber}`, 170, 19);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-CO'), 170, 26);

      // CAMBIO: Subtítulo fuera del header y antes del logo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cotización de Amigurumi', 105, 42, { align: 'center' });

      // Logo en la parte superior
      if (homeConfig?.heroImage1) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = homeConfig.heroImage1;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          
          doc.addImage(img, 'JPEG', 20, 50, 40, 40);
        } catch (error) {
          console.warn('No se pudo cargar el logo:', error);
        }
      }

      let currentY = 95;

      // Sección: Información del Cliente
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Cliente', 20, currentY);
      
      currentY += 8;
      
      // Información del cliente con texto simple
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nombre: ${quoteData.clientName}`, 20, currentY);
      currentY += 6;
      doc.text(`Email: ${quoteData.clientEmail}`, 20, currentY);
      currentY += 6;
      doc.text(`Teléfono: ${quoteData.clientPhone || 'N/A'}`, 20, currentY);
      currentY += 6;
      doc.text(`Válida hasta: ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('es-CO')}`, 20, currentY);
      
      currentY += 12;

      // Sección: Detalles del Producto
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalles del Producto', 20, currentY);
      
      currentY += 6;

      // Card del producto con fondo degradado
      doc.setFillColor(255, 228, 230); // rose-50
      doc.rect(20, currentY, 170, 18, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(quoteData.productName, 23, currentY + 6);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(quoteData.description || 'Sin descripción', 23, currentY + 12);
      
      if (quoteData.selectedSizeId) {
        const selectedSize = inventoryItems.find(item => item.id === quoteData.selectedSizeId);
        if (selectedSize) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(225, 29, 72); // rose-600
          doc.text(`Tamaño: ${selectedSize.label}`, 23, currentY + 16);
        }
      }

      currentY += 22;

      // Imagen del producto (si existe) - REDUCIDA DE TAMAÑO
      if (quoteData.imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = quoteData.imageUrl;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          
          doc.addImage(img, 'JPEG', 20, currentY, 40, 40); // Cambiado de 60x60 a 40x40
          currentY += 45;
        } catch (error) {
          console.warn('No se pudo cargar la imagen del producto:', error);
          // Placeholder
          doc.setFillColor(240, 240, 240);
          doc.rect(20, currentY, 40, 40, 'F'); // Placeholder más pequeño
          doc.setTextColor(150, 150, 150);
          doc.text('Imagen no disponible', 40, currentY + 20, { align: 'center' });
          currentY += 45;
        }
      }

      // Tabla de Items
      const tableData: any[] = [];
      
      if (quoteData.selectedSizeId) {
        const selectedSize = inventoryItems.find(item => item.id === quoteData.selectedSizeId);
        if (selectedSize) {
          tableData.push([
            { content: `Tamaño: ${selectedSize.label}`, styles: { fontStyle: 'bold' } },
            { content: '1', styles: { halign: 'right' } },
            { content: `$${selectedSize.price.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
          ]);
        }
      } else if (quoteData.basePrice > 0) {
        tableData.push([
          { content: 'Precio Base', styles: { fontStyle: 'bold' } },
          { content: '1', styles: { halign: 'right' } },
          { content: `$${quoteData.basePrice.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
        ]);
      }
      
      if (quoteData.selectedPackagingId) {
        const selectedPackaging = inventoryItems.find(item => item.id === quoteData.selectedPackagingId);
        if (selectedPackaging) {
          tableData.push([
            { content: `Empaque: ${selectedPackaging.label}`, styles: { fontStyle: 'bold' } },
            { content: '1', styles: { halign: 'right' } },
            { content: `$${selectedPackaging.price.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
          ]);
        }
      }
      
      if (quoteData.selectedAccessories && quoteData.selectedAccessories.length > 0) {
        quoteData.selectedAccessories.forEach(accId => {
          const accessory = inventoryItems.find(item => item.id === accId);
          if (accessory) {
            tableData.push([
              { content: `Accesorio: ${accessory.label}`, styles: { fontStyle: 'bold' } },
              { content: '1', styles: { halign: 'right' } },
              { content: `$${accessory.price.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold' } }
            ]);
          }
        });
      }

      autoTable(doc, {
        startY: currentY,
        head: [['Concepto', 'Cant.', 'Valor']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: roseRGB,
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // gray-50
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // CAMBIO: Texto de entrega y altura dinámica de la caja
      const deliveryText = 'Cada pieza se elabora bajo pedido. Tiempos de entrega según agenda de producción. Consulta disponibilidad.';
      const splitDeliveryText = doc.splitTextToSize(deliveryText, 160);
      const deliveryTextHeight = splitDeliveryText.length * 4; // Altura aproximada del texto
      const totalBoxHeight = 12 + deliveryTextHeight; // Altura base + altura del texto

      // Total con fondo verde - ALTURA REDUCIDA
      doc.setFillColor(...emeraldRGB);
      doc.rect(20, currentY, 170, totalBoxHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 25, currentY + 6); // Ajustado
      doc.setFontSize(18);
      doc.text(`$${total.toLocaleString()}`, 185, currentY + 7, { align: 'right' }); // Ajustado
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(209, 250, 229); // emerald-100
      doc.text(splitDeliveryText, 25, currentY + 10); // Ajustado

      currentY += totalBoxHeight + 5; // Ajustar el Y para la siguiente sección

      // Notas adicionales
      if (quoteData.notes) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, currentY, 170, 20, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Notas Adicionales', 23, currentY + 5);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        const splitNotes = doc.splitTextToSize(quoteData.notes, 164);
        doc.text(splitNotes, 23, currentY + 10);
        
        currentY += 25;
      }

      // CORREGIDO: Verificar espacio para Términos y Footer
      const pageHeight = doc.internal.pageSize.height;
      const footerHeight = 22;
      const termsHeight = 20; // Aumentado para caber los 3 puntos
      const marginBottom = 5;

      if (currentY + termsHeight + footerHeight + marginBottom > pageHeight) {
        doc.addPage();
        currentY = 20;
      }

      // Términos y condiciones - ALTURA AUMENTADA
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, currentY, 170, termsHeight, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Términos y Condiciones', 23, currentY + 5);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text('• 50% de anticipo para iniciar producción', 23, currentY + 9);
      doc.text('• Saldo restante contra entrega', 23, currentY + 13);
      doc.text('• Cotización válida por 7 días', 23, currentY + 17);

      // Footer con fondo oscuro - Posicionado al final de la página
      const footerY = pageHeight - footerHeight;
      doc.setFillColor(...slateRGB);
      doc.rect(0, footerY, 210, footerHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Puntadas de Mechis', 105, footerY + 8, { align: 'center' });
      doc.setFontSize(7);
      doc.text('WhatsApp: +57 312 491 5147 | Email: puntadasdemechis@gmail.com', 105, footerY + 13, { align: 'center' });
      doc.setFontSize(6);
      doc.setTextColor(203, 213, 225);
      doc.text('¡Gracias por confiar en nosotros!', 105, footerY + 17, { align: 'center' });

      const filename = `cotizacion_${quoteData.clientName.replace(/\s/g, '_')}_${quoteNumber}.pdf`;
      doc.save(filename);
      
      console.log('✅ PDF generado con nuevo diseño');
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      setError('Error al generar el PDF: ' + (error as Error).message);
    }
  };

  const sendQuoteByEmail = () => {
    if (!quoteData.clientEmail || !quoteData.productName) {
      setError('Por favor completa los campos obligatorios');
      return;
    }

    if (!quoteData.selectedSizeId && quoteData.basePrice <= 0) {
      setError('Por favor selecciona un tamaño o especifica un precio base');
      return;
    }

    try {
      console.log('📧 Enviando cotización por email...');
      const total = calculateTotal();
      const quoteNumber = generateQuoteNumber();
      const subject = `Cotización #${quoteNumber} - ${quoteData.productName}`;
      
      let body = `
Hola ${quoteData.clientName},

Te enviamos la cotización para tu amigurumi personalizado:

📋 Cotización #${quoteNumber}
📦 Producto: ${quoteData.productName}
📝 Descripción: ${quoteData.description}

💰 Desglose de Precios:
`;

      if (quoteData.selectedSizeId) {
        const selectedSize = inventoryItems.find(item => item.id === quoteData.selectedSizeId);
        if (selectedSize) {
          body += `- Tamaño (${selectedSize.label}): $${selectedSize.price.toLocaleString()}\n`;
        }
      } else if (quoteData.basePrice > 0) {
        body += `- Precio Base: $${quoteData.basePrice.toLocaleString()}\n`;
      }

      if (quoteData.selectedPackagingId) {
        const selectedPackaging = inventoryItems.find(item => item.id === quoteData.selectedPackagingId);
        if (selectedPackaging) {
          body += `- Empaque (${selectedPackaging.label}): $${selectedPackaging.price.toLocaleString()}\n`;
        }
      }

      if (quoteData.selectedAccessories && quoteData.selectedAccessories.length > 0) {
        body += '\nAccesorios:\n';
        quoteData.selectedAccessories.forEach(accId => {
          const accessory = inventoryItems.find(item => item.id === accId);
          if (accessory) {
            body += `- ${accessory.label}: $${accessory.price.toLocaleString()}\n`;
          }
        });
      }

      body += `
💵 TOTAL: $${total.toLocaleString()}

⏰ Cada pieza se elabora bajo pedido. Tiempos de entrega según agenda de producción. Consulta disponibilidad.

📅 Válida hasta: ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('es-CO')}

 ${quoteData.notes ? `\n📌 Notas: ${quoteData.notes}` : ''}

Términos y Condiciones:
• 50% de anticipo para iniciar producción
• Saldo restante contra entrega
• Cotización válida por 7 días

¡Gracias por tu interés!

Puntadas de Mechis
WhatsApp: +57 312 491 5147
Email: puntadasdemechis@gmail.com
      `.trim();

      if (quoteData.imageUrl) {
        body += '\n\n📸 La imagen de referencia está adjunta en esta cotización.';
      }

      const mailtoLink = `mailto:${quoteData.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      
      console.log('✅ Email enviado');
    } catch (error) {
      console.error('❌ Error sending email:', error);
      setError('Error al enviar el email');
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
          <p className="text-sm text-gray-500">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={clearError}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const sizes = inventoryItems.filter(item => item.category === 'sizes');
  const packaging = inventoryItems.filter(item => item.category === 'packaging');
  const accessories = inventoryItems.filter(item => item.category === 'accessories');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft size={20} />
              Volver al Panel
            </button>
            
            <button
              onClick={() => setShowSavedQuotes(!showSavedQuotes)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Eye size={20} />
              {showSavedQuotes ? 'Nueva Cotización' : 'Ver Guardadas'}
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
              <FileText className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {showSavedQuotes ? 'Cotizaciones Guardadas' : 'Generador de Cotizaciones'}
              </h1>
              <p className="text-gray-600">
                {showSavedQuotes ? 'Gestiona tus cotizaciones anteriores' : 'Crea cotizaciones profesionales en PDF para tus clientes'}
              </p>
            </div>
          </div>
        </div>

        {showSavedQuotes ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cotizaciones Anteriores</h2>
            
            {savedQuotes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay cotizaciones guardadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedQuotes.map(quote => (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{quote.product_name}</h3>
                        <p className="text-sm text-gray-600">Cliente: {quote.client_name}</p>
                        <p className="text-sm text-gray-600">Email: {quote.client_email}</p>
                        <p className="text-sm text-gray-600">
                          Total: <span className="font-bold text-purple-600">${quote.total_amount?.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Fecha: {new Date(quote.created_at || '').toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setQuoteData({
                              clientName: quote.client_name,
                              clientEmail: quote.client_email,
                              clientPhone: quote.client_phone || '',
                              productName: quote.product_name,
                              description: quote.description || '',
                              basePrice: quote.base_price || 0,
                              selectedSizeId: quote.selected_size_id || '',
                              selectedPackagingId: quote.selected_packaging_id || '',
                              selectedAccessories: quote.selected_accessories || [],
                              imageUrl: quote.image_url || '',
                              notes: quote.notes || ''
                            });
                            setShowSavedQuotes(false);
                          }}
                          className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar esta cotización?')) {
                              supabase
                                .from('quotes')
                                .delete()
                                .eq('id', quote.id)
                                .then(() => {
                                  alert('Cotización eliminada correctamente');
                                  loadSavedQuotes();
                                })
                                .catch(error => {
                                  console.error('Error deleting quote:', error);
                                  alert('Error al eliminar la cotización');
                                });
                            }
                          }}
                          className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <section className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} style={{ color: COLORS.coral }} />
                Información del Cliente
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Cliente Existente
                  </label>
                  <select
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">-- Nuevo Cliente --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.email}>
                        {client.nombre_completo} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={quoteData.clientName}
                    onChange={(e) => setQuoteData({ ...quoteData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={quoteData.clientEmail}
                    onChange={(e) => setQuoteData({ ...quoteData, clientEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="cliente@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={quoteData.clientPhone}
                    onChange={(e) => setQuoteData({ ...quoteData, clientPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="3001234567"
                  />
                </div>
              </div>
            </section>

            <section className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={20} style={{ color: COLORS.sageGreen }} />
                Detalles del Producto
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={quoteData.productName}
                    onChange={(e) => setQuoteData({ ...quoteData, productName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ej: Osito Teddy Personalizado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={quoteData.description}
                    onChange={(e) => setQuoteData({ ...quoteData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                    placeholder="Detalles del amigurumi..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📏 Tamaño *</label>
                    <select
                      onChange={handleSizeSelect}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      value={quoteData.selectedSizeId}
                    >
                      <option value="">-- Seleccionar Tamaño --</option>
                      {sizes.map(size => (
                        <option key={size.id} value={size.id}>
                          {size.label} (+${size.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio Base</label>
                    <input
                      type="number"
                      value={quoteData.basePrice}
                      onChange={handleBasePriceChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {quoteData.selectedSizeId 
                        ? 'El precio se calcula automáticamente según el tamaño seleccionado'
                        : 'Especifica un precio base manualmente si no usas tamaños predefinidos'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de Referencia</label>
                  {quoteData.imageUrl && (
                    <img 
                      src={quoteData.imageUrl} 
                      alt="Preview" 
                      className="w-40 h-40 object-cover rounded-lg mb-2 border-2 border-gray-200" 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm"
                    disabled={loading}
                  />
                  {loading && (
                    <p className="text-sm text-blue-600 mt-1">Subiendo imagen...</p>
                  )}
                </div>
              </div>
            </section>

            <section className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={20} style={{ color: COLORS.coral }} />
                Opciones Adicionales
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📦 Empaque</label>
                  <select
                    onChange={(e) => {
                      setQuoteData({ ...quoteData, selectedPackagingId: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={quoteData.selectedPackagingId}
                  >
                    <option value="">-- Ninguno --</option>
                    {packaging.map(pack => (
                      <option key={pack.id} value={pack.id}>
                        {pack.label} (+${pack.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">✨ Accesorios</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {accessories.map(acc => (
                      <label key={acc.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuoteData({
                                ...quoteData,
                                selectedAccessories: [...quoteData.selectedAccessories, acc.id]
                              });
                            } else {
                              setQuoteData({
                                ...quoteData,
                                selectedAccessories: quoteData.selectedAccessories.filter(a => a !== acc.id)
                              });
                            }
                          }}
                          className="rounded text-pink-600 focus:ring-pink-500"
                          checked={quoteData.selectedAccessories.includes(acc.id)}
                        />
                        <span className="text-sm">{acc.label} (+${acc.price.toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📌 Notas Adicionales</h2>
              <textarea
                value={quoteData.notes}
                onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={3}
                placeholder="Términos, condiciones, tiempo de entrega, etc."
              />
            </section>

            <section>
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800">TOTAL:</span>
                  <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                    ${calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={saveQuote}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>

                <button
                  onClick={generatePDF}
                  disabled={!quoteData.clientName || !quoteData.clientEmail || !quoteData.productName || (!quoteData.selectedSizeId && quoteData.basePrice <= 0)}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  PDF
                </button>

                <button
                  onClick={sendQuoteByEmail}
                  disabled={!quoteData.clientEmail}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Email
                </button>

                <button
                  onClick={() => {
                    setQuoteData({
                      clientName: '',
                      clientEmail: '',
                      clientPhone: '',
                      productName: '',
                      description: '',
                      basePrice: 0,
                      selectedSizeId: '',
                      selectedPackagingId: '',
                      selectedAccessories: [],
                      imageUrl: '',
                      notes: ''
                    });
                    clearError();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-400 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Limpiar
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteGenerator;