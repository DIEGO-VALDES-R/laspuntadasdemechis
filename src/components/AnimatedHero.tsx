import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import logo from '../assets/logo.png';

const COLORS = {
  coral: '#FF69B4',
  sageGreen: '#A9B4A1',
};

interface AnimatedHeroProps {
  heroImage1?: string;
  heroImage2?: string;
  cardImage3?: string;
  cardImage4?: string;
  cardImage5?: string;
  cardImage6?: string;  // 🆕 Nueva
  cardImage7?: string;  // 🆕 Nueva
  cardImage8?: string;  // 🆕 Nueva
  cardPrice1?: string;
  cardPrice2?: string;
  cardPrice3?: string;
  cardPrice4?: string;
  cardPrice5?: string;  // 🆕 Nuevo
  cardPrice6?: string;  // 🆕 Nuevo
  cardPrice7?: string;  // 🆕 Nuevo
  onScrollToGallery?: () => void;
}

const AnimatedHero: React.FC<AnimatedHeroProps> = ({ 
  heroImage1, 
  heroImage2,
  cardImage3,
  cardImage4,
  cardImage5,
  cardImage6,  // 🆕
  cardImage7,  // 🆕
  cardImage8,  // 🆕
  cardPrice1 = '$30.00',
  cardPrice2 = '$27.00', 
  cardPrice3 = '$26.00',
  cardPrice4 = '$25.00',
  cardPrice5 = '$24.00',  // 🆕
  cardPrice6 = '$23.00',  // 🆕
  cardPrice7 = '$22.00',  // 🆕
  onScrollToGallery 
}) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // 🆕 ARRAY EXTENDIDO CON 8 TARJETAS - Solo se agregan si tienen imagen
  const allPossibleCards = [
    { id: 2, price: cardPrice1, image: heroImage2, bgColor: 'bg-green-200' },
    { id: 3, price: cardPrice2, image: cardImage3, bgColor: 'bg-purple-200' },
    { id: 4, price: cardPrice3, image: cardImage4, bgColor: 'bg-yellow-200' },
    { id: 5, price: cardPrice4, image: cardImage5, bgColor: 'bg-pink-200' },
    { id: 6, price: cardPrice5, image: cardImage6, bgColor: 'bg-blue-200' },
    { id: 7, price: cardPrice6, image: cardImage7, bgColor: 'bg-orange-200' },
    { id: 8, price: cardPrice7, image: cardImage8, bgColor: 'bg-red-200' },
  ];

  // ✅ FILTRAR: Solo mostrar tarjetas que tengan imagen Y precio configurados
  const floatingCards = allPossibleCards.filter(card => 
    card.image && card.image.trim() !== '' && card.price && card.price.trim() !== ''
  );

  return (
    <section className="relative bg-gradient-to-br from-pink-100 via-purple-50 to-orange-50 overflow-hidden min-h-screen flex items-center">
      {/* Decorative circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-orange-200 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* COLUMNA IZQUIERDA: Logo + Texto */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: 0 
              }}
              transition={{ 
                duration: 0.8, 
                type: "spring", 
                stiffness: 100 
              }}
              className="flex justify-center md:justify-start mb-8"
            >
              <motion.img 
                src={logo} 
                alt="Puntadas de Mechis - Logo" 
                className="w-72 h-72 object-contain drop-shadow-2xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-8"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                <span className="block text-gray-900">Amigurumis</span>
                <span className="block text-gray-900">hechos</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                  con amor ❤️
                </span>
                <span className="block text-gray-900">y dedicación</span>
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-lg text-gray-600 max-w-lg leading-relaxed"
              >
                Cada pieza es única y tejida a mano con materiales de alta calidad.
                Perfectos para regalar o decorar tu espacio con ternura.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="flex gap-6 items-center"
              >
                <Link
                  to="/request"
                  style={{ backgroundColor: COLORS.coral }}
                  className="text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-105"
                >
                  Solicitar Amigurumi
                </Link>
                {onScrollToGallery && (
                  <button
                    onClick={onScrollToGallery}
                    style={{ color: COLORS.coral }}
                    className="font-bold hover:underline flex items-center gap-2 transition"
                  >
                    Cómo funciona
                    <ChevronRight size={20} />
                  </button>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* COLUMNA DERECHA: Tarjetas Apiladas en Cascada 3D */}
          <div className="relative h-[500px] flex items-center justify-center">
            {floatingCards.length > 0 ? (
              floatingCards.map((card, index) => {
                const colors = ['bg-green-200', 'bg-purple-200', 'bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-orange-200', 'bg-red-200'];
                
                // 🆕 CÁLCULO DINÁMICO según cantidad de tarjetas visibles
                const totalCards = floatingCards.length;
                const horizontalOffset = index * (70 / Math.max(totalCards - 1, 1));
                const verticalOffset = index * (56 / Math.max(totalCards - 1, 1));
                
                // Rotación gradual ajustada dinámicamente
                const maxRotation = 21;
                const rotation = totalCards > 1 
                  ? (index * (maxRotation * 2 / (totalCards - 1))) - maxRotation
                  : 0;
                
                // zIndex decreciente
                const baseZIndex = 15 - index;
                
                let imageSrc = card.image;
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ 
                      opacity: 0, 
                      scale: 0.8,
                      rotate: rotation - 20,
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: hoveredCard === card.id ? 1.05 : 1,
                      rotate: hoveredCard === card.id ? 0 : rotation,
                      y: [-10, 0, -10],
                    }}
                    transition={{ 
                      opacity: { duration: 0.8, delay: 0.8 + index * 0.1 },
                      scale: { type: "spring", stiffness: 300, damping: 20, duration: 0.3 },
                      rotate: { type: "spring", stiffness: 300, damping: 20, duration: 0.3 },
                      y: { 
                        duration: 3 + index * 0.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }
                    }}
                    whileHover={{
                      scale: 1.05,
                      rotate: 0,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        duration: 0.3
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: `${horizontalOffset}%`,
                      top: `${verticalOffset}%`,
                      zIndex: hoveredCard === card.id ? 50 : baseZIndex,
                    }}
                    onHoverStart={() => setHoveredCard(card.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                    onClick={() => setHoveredCard(prevId => (prevId === card.id ? null : card.id))}
                    className={`w-64 h-80 rounded-3xl shadow-2xl overflow-hidden ${colors[index % colors.length]} border-8 border-white cursor-pointer`}
                  >
                    <div className="w-full h-full flex items-center justify-center p-6">
                      <img 
                        src={imageSrc} 
                        alt={`Producto ${card.id}`} 
                        className="w-full h-full object-contain drop-shadow-2xl"
                      />
                    </div>
                    <div className="absolute top-4 right-4 bg-white text-gray-900 text-lg font-bold px-4 py-2 rounded-full shadow-lg">
                      {card.price}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center text-gray-400 italic">
                No hay tarjetas configuradas aún
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;