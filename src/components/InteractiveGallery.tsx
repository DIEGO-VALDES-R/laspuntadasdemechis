import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Search, ShoppingCart, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GalleryItem } from '../types';

// Colores de marca
const COLORS = {
  coral: '#D4735E',
  sageGreen: '#A9B4A1',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

interface InteractiveGalleryProps {
  items: GalleryItem[];
}

const InteractiveGallery: React.FC<InteractiveGalleryProps> = ({ items }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const categories = useMemo(() => {
    const cats = ['Todos', ...new Set(items.map(item => item.category || 'Sin categoría'))];
    return cats;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchTerm]);

  const lightboxSlides = filteredItems.map(item => ({
    src: item.imageUrl,
    title: item.title,
    description: item.description,
  }));

    // 🆕 FUNCIÓN DE COMPARTIR OPTIMIZADA PARA VISTA PREVIA VISUAL (V4)
  const handleShare = async (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation();
    
    // Ponemos la imagen al principio para que WhatsApp genere la vista previa visual
    const imageLink = item.imageUrl;
    const pageUrl = window.location.href.includes('localhost') 
      ? 'https://laspuntadasdemechis.vercel.app/' 
      : window.location.href;

    const shareText = 
      `📸 *Mira la foto:* ${imageLink}\n\n` +
      `🧶 *¡Hermoso Amigurumi de Puntadas de Mechis!* 🧶\n\n` +
      `✨ *Producto:* ${item.title}\n` +
      `🏷️ *Categoría:* ${item.category || 'Personalizado'}\n` +
      `💰 *Precio:* $${item.price?.toLocaleString( ) || 'Consultar'}\n` +
      `📝 *Descripción:* ${item.description}\n\n` +
      `👇 *Ver en la web:* ${pageUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: shareText,
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText )}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };


  // 🆕 Función para solicitar corregida (Elimina el "undefined")
  const handleBuy = (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation();
    navigate('/request', { 
      state: { 
        reorderOrder: { 
          nombre_producto: item.title,
          descripcion: item.description,
          imagen_url: item.imageUrl,
          numero_seguimiento: 'GALERIA' // 👈 Esto evita el "undefined"
        } 
      } 
    });
  };

  return (
    <section className="py-16 bg-white" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold" style={{ color: COLORS.coral }}>Nuestras Creaciones</h2>
          <p className="text-gray-600 mt-2">Un poco de nuestro trabajo reciente</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar amigurumis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredItems.length === 0 ? (
              <motion.div 
                key="no-results"
                className="col-span-full text-center text-gray-400 py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                No se encontraron resultados
              </motion.div>
            ) : (
              filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.02, 
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }}
                  className="group relative overflow-hidden rounded-2xl shadow-md bg-white border border-gray-100 flex flex-col h-full cursor-pointer"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  {/* Imagen */}
                  <div className="aspect-square overflow-hidden bg-gray-100 relative">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-white text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Ver detalles</span>
                    </div>
                  </div>
                  
                  {/* Contenido */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight" style={{ color: COLORS.coral }}>{item.title}</h3>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-sage-100 text-sage-700 rounded-lg">
                        {item.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{item.description}</p>
                    
                    <div className="mb-4">
                      {item.price && item.price > 0 ? (
                        <p className="font-black text-2xl text-purple-600">${item.price.toLocaleString()}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Precio bajo consulta</p>
                      )}
                    </div>

                    {/* 🆕 BOTONES SEPARADOS Y VISIBLES */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button
                        onClick={(e) => handleBuy(e, item)}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <ShoppingCart size={14} />
                        Solicitar
                      </button>
                      
                      <button
                        onClick={(e) => handleShare(e, item)}
                        className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all active:scale-95"
                      >
                        <Share2 size={14} />
                        Compartir
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={lightboxSlides}
        />
      </div>
    </section>
  );
};

export default InteractiveGallery;