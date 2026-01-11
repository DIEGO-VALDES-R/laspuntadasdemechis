import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Gift, Truck, Clock, Loader } from 'lucide-react';
import { db } from '../services/db';
import { GalleryItem, HomeConfig, Tejedora } from '../types';

// 🆕 IMPORTAR COMPONENTES CRÍTICOS (Se cargan de inmediato)
import AnimatedHero from '../components/AnimatedHero';
import ProcessTimeline from '../components/ProcessTimeline';
import StatsSection from '../components/StatsSection';

// 🆕 IMPORTAR COMPONENTES PESADOS CON LAZY LOADING (Se cargan bajo demanda)
const InteractiveGallery = lazy(() => import('../components/InteractiveGallery'));
const TestimonialsCarousel = lazy(() => import('../components/TestimonialsCarousel'));

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // Estado para el rastreador
  const [trackId, setTrackId] = useState('');

  // 🆕 Estado refactorizado para Galería con Paginación
  const [galleryData, setGalleryData] = useState<{
    items: GalleryItem[];
    currentPage: number;
    totalPages: number;
    isLoading: boolean;
  }>({
    items: [],
    currentPage: 1,
    totalPages: 1,
    isLoading: false
  });

  // Estados de configuración (con valores por defecto para renderizar inmediatamente)
  const [homeConfig, setHomeConfig] = useState<HomeConfig>({ 
    heroImage1: '', 
    heroImage2: '',
    cardImage3: '',
    cardImage4: '',
    cardImage5: '',
    cardPrice1: '',
    cardPrice2: '',
    cardPrice3: '',
    cardPrice4: ''
  });

  const [tejedoras, setTejedoras] = useState<Tejedora[]>([]);
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

  // 🆕 Flag para saber si el layout básico (config) está listo
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    // Paso 1: Iniciar carga de datos críticos y secundarios
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Fase 1: Cargar configuración crítica (Hero, Stats, Textos)
      // Esto permite que la parte superior de la página se pinte rápido
      const [configData, statsData, sectionsData] = await Promise.all([
        db.getHomeConfig(),
        db.getSiteStats(),
        db.getEditableSections()
      ]);

      setHomeConfig(configData);
      setSiteStats(statsData);
      setEditableSections(sectionsData);
      
      // Marcamos el layout como listo para quitar el loader global si existiera
      setIsLayoutReady(true);

      // Fase 2: Cargar Galería (Página 1) en paralelo
      await loadGalleryPage(1);

      // Fase 3: Cargar Tejedoras en segundo plano
      const teamData = await db.getTejedoras();
      setTejedoras(teamData);

    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
      // Aseguramos que la UI se muestre aunque falle algo secundario
      setIsLayoutReady(true);
    }
  };

  // 🆕 Función para cargar una página específica de la galería
  const loadGalleryPage = async (page: number) => {
    try {
      setGalleryData(prev => ({ ...prev, isLoading: true }));
      
      // Llamamos a la función actualizada de db.ts que soporta paginación
      const result = await db.getGallery(page, 12);
      
      setGalleryData({
        items: page === 1 ? result.data : [...galleryData.items, ...result.data], // Acumular o reemplazar
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        isLoading: false
      });
    } catch (error) {
      console.error('Error cargando galería:', error);
      setGalleryData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 🆕 Manejador para el botón "Cargar Más"
  const loadMoreGallery = () => {
    if (galleryData.currentPage < galleryData.totalPages) {
      loadGalleryPage(galleryData.currentPage + 1);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/track?order=${trackId.trim()}`);
    }
  };

  const scrollToGallery = () => {
    const gallerySection = document.getElementById('gallery');
    if (gallerySection) {
      const headerOffset = 80;
      const elementPosition = gallerySection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Mostrar un loader breve mientras carga la configuración inicial (Hero)
  if (!isLayoutReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-pink-500" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      
      {/* HERO SECTION ANIMADO */}
<AnimatedHero 
  heroImage1={homeConfig.heroImage1}
  heroImage2={homeConfig.heroImage2}
  cardImage3={homeConfig.cardImage3}
  cardImage4={homeConfig.cardImage4}
  cardImage5={homeConfig.cardImage5}
  cardImage6={homeConfig.cardImage6}  // 🆕
  cardImage7={homeConfig.cardImage7}  // 🆕
  cardImage8={homeConfig.cardImage8}  // 🆕
  cardPrice1={homeConfig.cardPrice1}
  cardPrice2={homeConfig.cardPrice2}
  cardPrice3={homeConfig.cardPrice3}
  cardPrice4={homeConfig.cardPrice4}
  cardPrice5={homeConfig.cardPrice5}  // 🆕
  cardPrice6={homeConfig.cardPrice6}  // 🆕
  cardPrice7={homeConfig.cardPrice7}  // 🆕
  onScrollToGallery={scrollToGallery}
/>

      {/* Order Tracker */}
      <section className="max-w-4xl mx-auto w-full px-4 -mt-24 z-20 relative">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Rastrea tu Pedido</h2>
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Ingresa tu número de 6 dígitos (Ej: 123456)"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
            </div>
            <button type="submit" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition">
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* PROCESO TIMELINE */}
      <section id="how-it-works">
        <ProcessTimeline />
      </section>

      {/* Value Props */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{editableSections.valuePropsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {[
            { icon: <Heart className="text-pink-500" />, title: "100% Personalizado" },
            { icon: <Gift className="text-purple-500" />, title: "Hecho con Amor" },
            { icon: <Gift className="text-blue-500" />, title: "Regalo Perfecto" },
            { icon: <Truck className="text-green-500" />, title: "Envíos Seguros" },
            { icon: <Clock className="text-orange-500" />, title: "Seguimiento Real" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition text-center flex flex-col items-center gap-4 border border-gray-100">
              <div className="p-4 bg-gray-50 rounded-full">{item.icon}</div>
              <h3 className="font-semibold text-gray-800">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CONTADOR DE ESTADÍSTICAS */}
      <StatsSection 
        stats={siteStats}
        title={editableSections.statsTitle}
        subtitle={editableSections.statsSubtitle}
      />

      {/* Knitters Team Section */}
      {tejedoras.length > 0 && (
        <section className="bg-pink-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Conoce a nuestras Tejedoras</h2>
                <p className="text-gray-600 mt-2">Las manos mágicas detrás de cada creación</p>
             </div>
             <div className="flex flex-wrap justify-center gap-10">
                {tejedoras.map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center max-w-xs w-full transition transform hover:scale-105">
                     <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-pink-200">
                        <img src={t.imageUrl} alt={t.nombre} className="w-full h-full object-cover"/>
                     </div>
                     <h3 className="font-bold text-xl text-gray-800">{t.nombre}</h3>
                     <p className="text-pink-600 font-medium">{t.especialidad}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* TESTIMONIOS CON LAZY LOADING */}
      <section className="testimonials-section">
        <Suspense fallback={<div className="py-10 text-center">Cargando testimonios...</div>}>
          <TestimonialsCarousel 
            title={editableSections.testimonialsTitle}
            subtitle={editableSections.testimonialsSubtitle}
          />
        </Suspense>
      </section>

      {/* GALERÍA INTERACTIVA CON PAGINACIÓN Y LAZY LOADING */}
      <div id="gallery" className="gallery-section">
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <Loader className="animate-spin text-pink-500" size={40} />
          </div>
        }>
          {galleryData.items.length > 0 && (
            <>
              <InteractiveGallery items={galleryData.items} />
              
              {/* 🆕 BOTÓN CARGAR MÁS */}
              {galleryData.currentPage < galleryData.totalPages && (
                <div className="text-center mt-12 mb-8">
                  <button
                    onClick={loadMoreGallery}
                    disabled={galleryData.isLoading}
                    className="px-8 py-3 bg-pink-500 text-white rounded-full font-bold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
                  >
                    {galleryData.isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="animate-spin" size={20} /> Cargando...
                      </span>
                    ) : (
                      'Cargar Más Amigurumis'
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Página {galleryData.currentPage} de {galleryData.totalPages}
                  </p>
                </div>
              )}
            </>
          )}
          
          {galleryData.items.length === 0 && !galleryData.isLoading && (
             <div className="text-center py-20 text-gray-500">
               No hay productos en la galería por el momento.
             </div>
          )}
        </Suspense>
      </div>

    </div>
  );
};

export default Home;