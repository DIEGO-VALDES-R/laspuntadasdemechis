import React from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { Link } from 'react-router-dom';

interface AnimatedHeroProps {
  heroImage1: string;
  heroImage2: string;
  onScrollToGallery: () => void;
}

const AnimatedHero: React.FC<AnimatedHeroProps> = ({ heroImage1, heroImage2, onScrollToGallery }) => {
  return (
    <section className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-white overflow-hidden">
      {/* Partículas flotantes de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-300 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Texto animado */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              <TypeAnimation
                sequence={[
                  '¡Dale vida a tu',
                  1000,
                  '¡Dale vida a tu imaginación! 🧶',
                ]}
                wrapper="span"
                speed={50}
                style={{ display: 'inline-block' }}
              />
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                imaginación! 🧶
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg text-gray-600 max-w-lg"
            >
              Amigurumis 100% personalizados hechos con amor. Desde tu personaje favorito hasta tu mascota, lo tejemos para ti.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex gap-4"
            >
              <Link
                to="/request"
                className="group bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-105"
              >
                Solicitar Pedido
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <button
                onClick={onScrollToGallery}
                className="bg-white text-gray-800 px-8 py-4 rounded-full font-bold shadow-md hover:bg-gray-50 transition border border-gray-100 hover:scale-105 transform"
              >
                Ver Galería
              </button>
            </motion.div>
          </motion.div>

          {/* Imágenes con animación parallax */}
          <div className="grid grid-cols-2 gap-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="transform translate-y-8"
            >
              {heroImage1 && (
                <img
                  src={heroImage1}
                  alt="Colección Amigurumis"
                  className="rounded-2xl shadow-2xl object-cover h-64 w-full"
                />
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="transform -translate-y-8"
            >
              {heroImage2 && (
                <img
                  src={heroImage2}
                  alt="Conejito Crochet"
                  className="rounded-2xl shadow-2xl object-cover h-64 w-full"
                />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;