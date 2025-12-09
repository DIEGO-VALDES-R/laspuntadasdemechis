import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Palette, Scissors, Truck } from 'lucide-react';

const ProcessTimeline: React.FC = () => {
  const steps = [
    {
      icon: <MessageSquare size={32} />,
      title: 'Solicita',
      description: 'Cuéntanos tu idea o envíanos una foto de referencia',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: <Palette size={32} />,
      title: 'Diseñamos',
      description: 'Creamos el boceto y seleccionamos los colores perfectos',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Scissors size={32} />,
      title: 'Tejemos',
      description: 'Nuestras tejedoras hacen la magia con cada puntada',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Truck size={32} />,
      title: 'Entregamos',
      description: 'Tu amigurumi llega seguro a la puerta de tu casa',
      color: 'from-green-500 to-green-600'
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">¿Cómo Funciona?</h2>
          <p className="text-gray-600 mt-2">Proceso simple en 4 pasos</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Línea conectora en desktop */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-green-500 opacity-20" style={{ width: '85%', marginLeft: '7.5%' }} />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg z-10 relative`}>
                {step.icon}
              </div>
              <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-gray-100 flex items-center justify-center font-bold text-gray-700 text-xl z-20">
                {index + 1}
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-2 mt-8">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessTimeline;