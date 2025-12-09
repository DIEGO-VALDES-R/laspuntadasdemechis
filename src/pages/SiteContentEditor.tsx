import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Save } from 'lucide-react';

interface EditableSections {
  valuePropsTitle: string;
  statsTitle: string;
  statsSubtitle: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
}

interface SiteStats {
  amigurumiCount: number;
  clientCount: number;
  rating: number;
  yearsExperience: number;
}

export default function SiteContentEditor() {
  const [initialSections, setInitialSections] = useState<EditableSections>({
    valuePropsTitle: '',
    statsTitle: '',
    statsSubtitle: '',
    testimonialsTitle: '',
    testimonialsSubtitle: ''
  });

  const [initialStats, setInitialStats] = useState<SiteStats>({
    amigurumiCount: 0,
    clientCount: 0,
    rating: 0,
    yearsExperience: 0
  });

  const valuePropsRef = useRef<HTMLInputElement>(null);
  const statsTitleRef = useRef<HTMLInputElement>(null);
  const statsSubtitleRef = useRef<HTMLInputElement>(null);
  const testimonialsTitleRef = useRef<HTMLInputElement>(null);
  const testimonialsSubtitleRef = useRef<HTMLInputElement>(null);

  const amigurumiCountRef = useRef<HTMLInputElement>(null);
  const clientCountRef = useRef<HTMLInputElement>(null);
  const ratingRef = useRef<HTMLInputElement>(null);
  const yearsExperienceRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sectionsData, statsData] = await Promise.all([
        db.getEditableSections(),
        db.getSiteStats()
      ]);
      
      if (sectionsData) {
        setInitialSections(sectionsData);
        if (valuePropsRef.current) valuePropsRef.current.value = sectionsData.valuePropsTitle;
        if (statsTitleRef.current) statsTitleRef.current.value = sectionsData.statsTitle;
        if (statsSubtitleRef.current) statsSubtitleRef.current.value = sectionsData.statsSubtitle;
        if (testimonialsTitleRef.current) testimonialsTitleRef.current.value = sectionsData.testimonialsTitle;
        if (testimonialsSubtitleRef.current) testimonialsSubtitleRef.current.value = sectionsData.testimonialsSubtitle;
      }
      
      if (statsData) {
        setInitialStats(statsData);
        if (amigurumiCountRef.current) amigurumiCountRef.current.value = String(statsData.amigurumiCount);
        if (clientCountRef.current) clientCountRef.current.value = String(statsData.clientCount);
        if (ratingRef.current) ratingRef.current.value = String(statsData.rating);
        if (yearsExperienceRef.current) yearsExperienceRef.current.value = String(statsData.yearsExperience);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveTitles = async () => {
    setLoading(true);
    setMessage('');
    try {
      const sections: EditableSections = {
        valuePropsTitle: valuePropsRef.current?.value || '',
        statsTitle: statsTitleRef.current?.value || '',
        statsSubtitle: statsSubtitleRef.current?.value || '',
        testimonialsTitle: testimonialsTitleRef.current?.value || '',
        testimonialsSubtitle: testimonialsSubtitleRef.current?.value || ''
      };
      
      await db.updateEditableSections(sections);
      setMessage('✅ Títulos guardados correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving titles:', error);
      setMessage('❌ Error al guardar títulos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStats = async () => {
    setLoading(true);
    setMessage('');
    try {
      const stats: SiteStats = {
        amigurumiCount: parseInt(amigurumiCountRef.current?.value || '0'),
        clientCount: parseInt(clientCountRef.current?.value || '0'),
        rating: parseFloat(ratingRef.current?.value || '0'),
        yearsExperience: parseInt(yearsExperienceRef.current?.value || '0')
      };
      
      await db.updateSiteStats(stats);
      setMessage('✅ Estadísticas guardadas correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving stats:', error);
      setMessage('❌ Error al guardar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const messageClasses = message.includes('✅') 
    ? 'p-4 rounded-lg bg-green-50 text-green-800' 
    : 'p-4 rounded-lg bg-red-50 text-red-800';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">📝 Editor de Contenido del Sitio</h2>

      {message && (
        <div className={messageClasses}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-purple-600 mb-4">📝 Títulos de Secciones</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título "¿Por Qué Elegirnos?"
            </label>
            <input
              ref={valuePropsRef}
              type="text"
              defaultValue={initialSections.valuePropsTitle}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: ¿Por Qué Elegirnos?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título "Nuestro Impacto"
            </label>
            <input
              ref={statsTitleRef}
              type="text"
              defaultValue={initialSections.statsTitle}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Nuestro Impacto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Estadísticas
            </label>
            <input
              ref={statsSubtitleRef}
              type="text"
              defaultValue={initialSections.statsSubtitle}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Números que hablan por nosotros"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título Testimonios
            </label>
            <input
              ref={testimonialsTitleRef}
              type="text"
              defaultValue={initialSections.testimonialsTitle}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Lo Que Dicen Nuestros Clientes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Testimonios
            </label>
            <input
              ref={testimonialsSubtitleRef}
              type="text"
              defaultValue={initialSections.testimonialsSubtitle}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Más de 450 clientes satisfechos"
            />
          </div>

          <button
            onClick={handleSaveTitles}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar Títulos'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">📊 Estadísticas del Sitio</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amigurumis Creados
            </label>
            <input
              ref={amigurumiCountRef}
              type="number"
              defaultValue={initialStats.amigurumiCount}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clientes Felices
            </label>
            <input
              ref={clientCountRef}
              type="number"
              defaultValue={initialStats.clientCount}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Promedio (1.0 - 5.0)
            </label>
            <input
              ref={ratingRef}
              type="number"
              defaultValue={initialStats.rating}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="5"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Años de Experiencia
            </label>
            <input
              ref={yearsExperienceRef}
              type="number"
              defaultValue={initialStats.yearsExperience}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        <button
          onClick={handleSaveStats}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {loading ? 'Guardando...' : 'Guardar Estadísticas'}
        </button>
      </div>
    </div>
  );
}
