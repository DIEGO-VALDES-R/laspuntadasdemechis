import React, { useEffect } from 'react';
import { db } from '../services/db';
import { Save } from 'lucide-react';

export default function SiteContentEditor() {
  console.log('🔄 SiteContentEditor renderizado');

  useEffect(() => {
    console.log('📥 Cargando datos iniciales...');
    loadInitialData();
  }, []); // ⬅️ Array vacío = solo se ejecuta UNA vez

  const loadInitialData = async () => {
    try {
      const [sectionsData, statsData] = await Promise.all([
        db.getEditableSections(),
        db.getSiteStats()
      ]);

      console.log('✅ Datos cargados:', { sectionsData, statsData });

      // Cargar valores en los inputs usando querySelector (SIN refs, SIN state)
      if (sectionsData) {
        const input1 = document.getElementById('valuePropsTitle') as HTMLInputElement;
        const input2 = document.getElementById('statsTitle') as HTMLInputElement;
        const input3 = document.getElementById('statsSubtitle') as HTMLInputElement;
        const input4 = document.getElementById('testimonialsTitle') as HTMLInputElement;
        const input5 = document.getElementById('testimonialsSubtitle') as HTMLInputElement;

        if (input1) input1.value = sectionsData.valuePropsTitle || '';
        if (input2) input2.value = sectionsData.statsTitle || '';
        if (input3) input3.value = sectionsData.statsSubtitle || '';
        if (input4) input4.value = sectionsData.testimonialsTitle || '';
        if (input5) input5.value = sectionsData.testimonialsSubtitle || '';
      }

      if (statsData) {
        const stat1 = document.getElementById('amigurumiCount') as HTMLInputElement;
        const stat2 = document.getElementById('clientCount') as HTMLInputElement;
        const stat3 = document.getElementById('rating') as HTMLInputElement;
        const stat4 = document.getElementById('yearsExperience') as HTMLInputElement;

        if (stat1) stat1.value = String(statsData.amigurumiCount || 0);
        if (stat2) stat2.value = String(statsData.clientCount || 0);
        if (stat3) stat3.value = String(statsData.rating || 0);
        if (stat4) stat4.value = String(statsData.yearsExperience || 0);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  };

  const handleSaveTitles = async () => {
    console.log('💾 Guardando títulos...');
    
    try {
      const sections = {
        valuePropsTitle: (document.getElementById('valuePropsTitle') as HTMLInputElement)?.value || '',
        statsTitle: (document.getElementById('statsTitle') as HTMLInputElement)?.value || '',
        statsSubtitle: (document.getElementById('statsSubtitle') as HTMLInputElement)?.value || '',
        testimonialsTitle: (document.getElementById('testimonialsTitle') as HTMLInputElement)?.value || '',
        testimonialsSubtitle: (document.getElementById('testimonialsSubtitle') as HTMLInputElement)?.value || ''
      };

      await db.updateEditableSections(sections);
      
      // Mostrar mensaje temporal
      const msgDiv = document.getElementById('message');
      if (msgDiv) {
        msgDiv.textContent = '✅ Títulos guardados correctamente';
        msgDiv.className = 'p-4 rounded-lg bg-green-50 text-green-800 mb-6';
        msgDiv.style.display = 'block';
        setTimeout(() => {
          msgDiv.style.display = 'none';
        }, 3000);
      }

      console.log('✅ Títulos guardados');
    } catch (error) {
      console.error('❌ Error guardando títulos:', error);
      
      const msgDiv = document.getElementById('message');
      if (msgDiv) {
        msgDiv.textContent = '❌ Error al guardar títulos';
        msgDiv.className = 'p-4 rounded-lg bg-red-50 text-red-800 mb-6';
        msgDiv.style.display = 'block';
      }
    }
  };

  const handleSaveStats = async () => {
    console.log('💾 Guardando estadísticas...');
    
    try {
      const stats = {
        amigurumiCount: parseInt((document.getElementById('amigurumiCount') as HTMLInputElement)?.value || '0'),
        clientCount: parseInt((document.getElementById('clientCount') as HTMLInputElement)?.value || '0'),
        rating: parseFloat((document.getElementById('rating') as HTMLInputElement)?.value || '0'),
        yearsExperience: parseInt((document.getElementById('yearsExperience') as HTMLInputElement)?.value || '0')
      };

      await db.updateSiteStats(stats);
      
      const msgDiv = document.getElementById('message');
      if (msgDiv) {
        msgDiv.textContent = '✅ Estadísticas guardadas correctamente';
        msgDiv.className = 'p-4 rounded-lg bg-green-50 text-green-800 mb-6';
        msgDiv.style.display = 'block';
        setTimeout(() => {
          msgDiv.style.display = 'none';
        }, 3000);
      }

      console.log('✅ Estadísticas guardadas');
    } catch (error) {
      console.error('❌ Error guardando estadísticas:', error);
      
      const msgDiv = document.getElementById('message');
      if (msgDiv) {
        msgDiv.textContent = '❌ Error al guardar estadísticas';
        msgDiv.className = 'p-4 rounded-lg bg-red-50 text-red-800 mb-6';
        msgDiv.style.display = 'block';
      }
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
