import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Gift, Truck, Clock, Loader } from 'lucide-react';
import { db } from '../services/db';
import { GalleryItem, HomeConfig, Tejedora } from '../types';

// 🆕 IMPORTAR COMPONENTES NUEVOS
import AnimatedHero from '../components/AnimatedHero';
import InteractiveGallery from '../components/InteractiveGallery';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import StatsSection from '../components/StatsSection';
import ProcessTimeline from '../components/ProcessTimeline';

const Home: React.FC = () => {
  const [trackId, setTrackId] = useState('');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>({ heroImage1: '', heroImage2: '' });
  const [tejedoras, setTejedoras] = useState<Tejedora[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        galleryData, 
        homeData, 
        teamData,
        statsData,        // 🆕 AGREGAR
        sectionsData      // 🆕 AGREGAR
      ] = await Promise.all([
        db.getGallery(),
        db.getHomeConfig(),
        db.getTejedoras(),
        db.getSiteStats(),        // 🆕 AGREGAR
        db.getEditableSections()  // 🆕 AGREGAR
      ]);
      
      setGalleryItems(galleryData);
      setHomeConfig(homeData);
      setTejedoras(teamData);
      setSiteStats(statsData);           // 🆕 AGREGAR
      setEditableSections(sectionsData); // 🆕 AGREGAR
    } catch (error) {
      console.error("Failed to load home data", error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (trackId.trim()) {
      navigate(`/track?order=${trackId.trim()}`);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-pink-500" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      
      {/* 🆕 HERO SECTION ANIMADO - Reemplaza el hero anterior */}
      <AnimatedHero 
        heroImage1={homeConfig.heroImage1}
        heroImage2={homeConfig.heroImage2}
        onScrollToGallery={scrollToGallery}
      />

      {/* Order Tracker - MANTIENE EL CÓDIGO ORIGINAL */}
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

      {/* 🆕 PROCESO TIMELINE - NUEVO */}
      <ProcessTimeline />

      {/* Value Props - MANTIENE EL CÓDIGO ORIGINAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">¿Por Qué Elegirnos?</h2>
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

      {/* 🆕 CONTADOR DE ESTADÍSTICAS - NUEVO */}
     <StatsSection 
  stats={siteStats}
  title={editableSections.statsTitle}
  subtitle={editableSections.statsSubtitle}
/>

      {/* Knitters Team Section - MANTIENE EL CÓDIGO ORIGINAL */}
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

      {/* 🆕 TESTIMONIOS - NUEVO */}
     <TestimonialsCarousel 
  title={editableSections.testimonialsTitle}
  subtitle={editableSections.testimonialsSubtitle}
/>
      {/* 🆕 GALERÍA INTERACTIVA - Reemplaza la galería anterior */}
      <div id="gallery">
        <InteractiveGallery items={galleryItems} />
      </div>

    </div>
  );
};

export default Home;