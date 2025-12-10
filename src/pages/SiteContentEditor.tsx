import React, { Component } from 'react';
import { db } from '../services/db';
import { Save } from 'lucide-react';

interface State {
  message: string;
  messageType: 'success' | 'error' | '';
}

export default class SiteContentEditor extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      message: '',
      messageType: ''
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    try {
      const [sectionsData, statsData] = await Promise.all([
        db.getEditableSections(),
        db.getSiteStats()
      ]);

      if (sectionsData) {
        (document.getElementById('valuePropsTitle') as HTMLInputElement).value = sectionsData.valuePropsTitle || sectionsData.value_props_title || '';
        (document.getElementById('statsTitle') as HTMLInputElement).value = sectionsData.statsTitle || sectionsData.stats_title || '';
        (document.getElementById('statsSubtitle') as HTMLInputElement).value = sectionsData.statsSubtitle || sectionsData.stats_subtitle || '';
        (document.getElementById('testimonialsTitle') as HTMLInputElement).value = sectionsData.testimonialsTitle || sectionsData.testimonials_title || '';
        (document.getElementById('testimonialsSubtitle') as HTMLInputElement).value = sectionsData.testimonialsSubtitle || sectionsData.testimonials_subtitle || '';
      }

      if (statsData) {
        (document.getElementById('amigurumiCount') as HTMLInputElement).value = String(statsData.amigurumiCount || statsData.amigurumi_count || 0);
        (document.getElementById('clientCount') as HTMLInputElement).value = String(statsData.clientCount || statsData.client_count || 0);
        (document.getElementById('rating') as HTMLInputElement).value = String(statsData.rating || 0);
        (document.getElementById('yearsExperience') as HTMLInputElement).value = String(statsData.yearsExperience || statsData.years_experience || 0);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  showMessage = (text: string, type: 'success' | 'error') => {
    this.setState({ message: text, messageType: type });
    setTimeout(() => {
      this.setState({ message: '', messageType: '' });
    }, 3000);
  }

  handleSaveTitles = async () => {
    try {
      const sections = {
        valuePropsTitle: (document.getElementById('valuePropsTitle') as HTMLInputElement).value,
        statsTitle: (document.getElementById('statsTitle') as HTMLInputElement).value,
        statsSubtitle: (document.getElementById('statsSubtitle') as HTMLInputElement).value,
        testimonialsTitle: (document.getElementById('testimonialsTitle') as HTMLInputElement).value,
        testimonialsSubtitle: (document.getElementById('testimonialsSubtitle') as HTMLInputElement).value
      };

      await db.updateEditableSections(sections);
      this.showMessage('✅ Títulos guardados correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('❌ Error al guardar títulos', 'error');
    }
  }

  handleSaveStats = async () => {
    try {
      const stats = {
        amigurumiCount: parseInt((document.getElementById('amigurumiCount') as HTMLInputElement).value || '0'),
        clientCount: parseInt((document.getElementById('clientCount') as HTMLInputElement).value || '0'),
        rating: parseFloat((document.getElementById('rating') as HTMLInputElement).value || '0'),
        yearsExperience: parseInt((document.getElementById('yearsExperience') as HTMLInputElement).value || '0')
      };

      await db.updateSiteStats(stats);
      this.showMessage('✅ Estadísticas guardadas correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('❌ Error al guardar estadísticas', 'error');
    }
  }

  render() {
    const { message, messageType } = this.state;

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">📝 Editor de Contenido del Sitio</h2>

        {message && (
          <div className={messageType === 'success' ? 'p-4 rounded-lg bg-green-50 text-green-800' : 'p-4 rounded-lg bg-red-50 text-red-800'}>
            {message}
          </div>
        )}

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
              onClick={this.handleSaveTitles}
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
            onClick={this.handleSaveStats}
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
}
