
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, Gift, Truck, Clock, Loader } from 'lucide-react';
import { db } from '../services/db';
import { GalleryItem, HomeConfig, Tejedora } from '../types';

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
        const [galleryData, homeData, teamData] = await Promise.all([
          db.getGallery(),
          db.getHomeConfig(),
          db.getTejedoras()
        ]);
        setGalleryItems(galleryData);
        setHomeConfig(homeData);
        setTejedoras(teamData);
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

// ✅ REEMPLAZA la función handleTrack en Home.tsx (alrededor de línea 25)

const handleTrack = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (trackId.trim()) {
    // ✅ CORRECTO: Redirigir a la página de rastreo con el número
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-pink-500" size={40} /></div>;
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                ¡Dale vida a tu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  imaginación! 🧶
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Amigurumis 100% personalizados hechos con amor. Desde tu personaje favorito hasta tu mascota, lo tejemos para ti.
              </p>
              <div className="flex gap-4">
                <Link to="/request" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                  Solicitar Pedido
                </Link>
                <button 
                  onClick={scrollToGallery}
                  className="bg-white text-gray-800 px-8 py-4 rounded-full font-bold shadow-md hover:bg-gray-50 transition border border-gray-100"
                >
                  Ver Galería
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 opacity-90">
               <div className="transform translate-y-8">
                  {homeConfig.heroImage1 && (
                    <img 
                      src={homeConfig.heroImage1}
                      alt="Colección Amigurumis" 
                      className="rounded-2xl shadow-2xl object-cover h-64 w-full" 
                    />
                  )}
               </div>
               <div className="transform -translate-y-8">
                  {homeConfig.heroImage2 && (
                    <img 
                      src={homeConfig.heroImage2} 
                      alt="Conejito Crochet" 
                      className="rounded-2xl shadow-2xl object-cover h-64 w-full" 
                    />
                  )}
               </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Value Props */}
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

      {/* Knitters Team Section (Dynamic) */}
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

      {/* Gallery */}
      <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Nuestras Creaciones</h2>
          <p className="text-gray-500 mt-2">Un poco de nuestro trabajo reciente</p>
        </div>
        
        {galleryItems.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No hay items en la galería aún.</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-100">
                  <div className="aspect-square overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      />
                  </div>
                  <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      {item.price && item.price > 0 && (
                          <p className="text-pink-600 font-bold mt-2">${item.price.toLocaleString()}</p>
                      )}
                  </div>
                </div>
              ))}
            </div>
        )}
      </section>

    </div>
  );
};

export default Home;
