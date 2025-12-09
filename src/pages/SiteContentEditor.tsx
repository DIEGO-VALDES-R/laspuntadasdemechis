import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';

const SiteContentEditor: React.FC = () => {
  const [stats, setStats] = useState({
    amigurumiCount: 17,
    clientCount: 17,
    rating: 4.9,
    yearsExperience: 5
  });
  
  const [sections, setSections] = useState({
    valuePropsTitle: '',
    statsTitle: '',
    statsSubtitle: '',
    testimonialsTitle: '',
    testimonialsSubtitle: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, sectionsData] = await Promise.all([
        db.getSiteStats(),
        db.getEditableSections()
      ]);
      setStats(statsData);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveStats = async () => {
    setSaving(true);
    try {
      await db.updateSiteStats(stats);
      setMessage('✅ Estadísticas guardadas');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSections = async () => {
    setSaving(true);
    try {
      await db.updateEditableSections(sections);
      setMessage('✅ Títulos guardados');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Editor de Contenido del Sitio</h1>
      
      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
          {message}
        </div>
      )}

      {/* TÍTULOS DE SECCIONES */}
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Edit2 className="text-purple-500" />
          Títulos de Secciones
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título "¿Por Qué Elegirnos?"
            </label>
            <input
              type="text"
              value={sections.valuePropsTitle}
              onChange={(e) => setSections({...sections, valuePropsTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título "Nuestro Impacto"
            </label>
            <input
              type="text"
              value={sections.statsTitle}
              onChange={(e) => setSections({...sections, statsTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Estadísticas
            </label>
            <input
              type="text"
              value={sections.statsSubtitle}
              onChange={(e) => setSections({...sections, statsSubtitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título Testimonios
            </label>
            <input
              type="text"
              value={sections.testimonialsTitle}
              onChange={(e) => setSections({...sections, testimonialsTitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtítulo Testimonios
            </label>
            <input
              type="text"
              value={sections.testimonialsSubtitle}
              onChange={(e) => setSections({...sections, testimonialsSubtitle: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={handleSaveSections}
            disabled={saving}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={20} />
            Guardar Títulos
          </button>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          📊 Estadísticas del Sitio
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amigurumis Creados
            </label>
            <input
              type="number"
              value={stats.amigurumiCount}
              onChange={(e) => setStats({...stats, amigurumiCount: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clientes Felices
            </label>
            <input
              type="number"
              value={stats.clientCount}
              onChange={(e) => setStats({...stats, clientCount: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Promedio (1.0 - 5.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={stats.rating}
              onChange={(e) => setStats({...stats, rating: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Años de Experiencia
            </label>
            <input
              type="number"
              value={stats.yearsExperience}
              onChange={(e) => setStats({...stats, yearsExperience: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleSaveStats}
          disabled={saving}
          className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={20} />
          Guardar Estadísticas
        </button>
      </section>
    </div>
  );
};

export default SiteContentEditor;