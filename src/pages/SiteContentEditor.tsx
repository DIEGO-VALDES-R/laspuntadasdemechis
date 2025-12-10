import React, { useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { Save } from 'lucide-react';

export default function SiteContentEditor() {
  const loadData = useCallback(async () => {
    try {
      const [sectionsData, statsData] = await Promise.all([
        db.getEditableSections(),
        db.getSiteStats()
      ]);
      
      console.log('✅ Datos cargados');
      
      // Cargar valores directamente en el DOM
      if (sectionsData) {
        const setValue = (id: string, value: any) => {
          const el = document.getElementById(id) as HTMLInputElement;
          if (el) el.value = value || '';
        };
        
        setValue('valuePropsTitle', sectionsData.valuePropsTitle);
        setValue('statsTitle', sectionsData.statsTitle);
        setValue('statsSubtitle', sectionsData.statsSubtitle);
        setValue('testimonialsTitle', sectionsData.testimonialsTitle);
        setValue('testimonialsSubtitle', sectionsData.testimonialsSubtitle);
      }
      
      if (statsData) {
        const setValue = (id: string, value: any) => {
          const el = document.getElementById(id) as HTMLInputElement;
          if (el) el.value = String(value || 0);
        };
        
        setValue('amigurumiCount', statsData.amigurumiCount);
        setValue('clientCount', statsData.clientCount);
        setValue('rating', statsData.rating);
        setValue('yearsExperience', statsData.yearsExperience);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (text: string, success: boolean) => {
    const msgDiv = document.getElementById('message');
    if (msgDiv) {
      msgDiv.textContent = text;
      msgDiv.className = success
        ? 'p-4 rounded-lg bg-green-50 text-green-800 mb-6'
        : 'p-4 rounded-lg bg-red-50 text-red-800 mb-6';
      msgDiv.style.display = 'block';
      setTimeout(() => {
        if (msgDiv) msgDiv.style.display = 'none';
      }, 3000);
    }
  };

  const handleSaveTitles = async () => {
    try {
      const getValue = (id: string) => {
        const el = document.getElementById(id) as HTMLInputElement;
        return el?.value || '';
      };

      const sections = {
        valuePropsTitle: getValue('valuePropsTitle'),
        statsTitle: getValue('statsTitle'),
        statsSubtitle: getValue('statsSubtitle'),
        testimonialsTitle: getValue('testimonialsTitle'),
        testimonialsSubtitle: getValue('testimonialsSubtitle')
      };

      await db.updateEditableSections(sections);
      showMessage('✅ Títulos guardados correctamente', true);
    } catch (error) {
      console.error('❌ Error:', error);
      showMessage('❌ Error al guardar títulos', false);
    }
  };

  const handleSaveStats = async () => {
    try {
      const getValue = (id: string) => {
        const el = document.getElementById(id) as HTMLInputElement;
        return el?.value || '0';
      };

      const stats = {
        amigurumiCount: parseInt(getValue('amigurumiCount')),
        clientCount: parseInt(getValue('clientCount')),
        rating: parseFloat(getValue('rating')),
        yearsExperience: parseInt(getValue('yearsExperience'))
      };

      await db.updateSiteStats(stats);
      showMessage('✅ Estadísticas guardadas correctamente', true);
    } catch (error) {
      console.error('❌ Error:', error);
      showMessage('❌ Error al guardar estadísticas', false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">📝 Editor de Contenido del Sitio</h2>

      <div id="message" style={{ display: 'none' }}></div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-purple-600 mb-4">📝 Títulos de Secciones</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="valuePropsTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Título "¿Por Qué Elegirnos?"
            </label>
            <input
              id="valuePropsTitle"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: ¿Por Qué Elegirnos?"
            />
          </div>

          <div>
            <label htmlFor="statsTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Título "Nuestro Impacto"
            </label>
            <input
              id="statsTitle"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Nuestro Impacto"
            />
          </div>

          <div>
            <label htmlFor="statsSubtitle" className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Estadísticas
            </label>
            <input
              id="statsSubtitle"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Números que hablan por nosotros"
            />
          </div>

          <div>
            <label htmlFor="testimonialsTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Título Testimonios
            </label>
            <input
              id="testimonialsTitle"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Lo Que Dicen Nuestros Clientes"
            />
          </div>

          <div>
            <label htmlFor="testimonialsSubtitle" className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Testimonios
            </label>
            <input
              id="testimonialsSubtitle"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Más de 450 clientes satisfechos"
            />
          </div>

          <button
            onClick={handleSaveTitles}
            type="button"
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Guardar Títulos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-blue-600 mb-4">📊 Estadísticas del Sitio</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amigurumiCount" className="block text-sm font-medium text-gray-700 mb-2">
              Amigurumis Creados
            </label>
            <input
              id="amigurumiCount"
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="clientCount" className="block text-sm font-medium text-gray-700 mb-2">
              Clientes Felices
            </label>
            <input
              id="clientCount"
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
              Rating Promedio (1.0 - 5.0)
            </label>
            <input
              id="rating"
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="5"
              step="0.1"
            />
          </div>

          <div>
            <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
              Años de Experiencia
            </label>
            <input
              id="yearsExperience"
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        <button
          onClick={handleSaveStats}
          type="button"
          className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Save size={20} />
          Guardar Estadísticas
        </button>
      </div>
    </div>
  );
}
