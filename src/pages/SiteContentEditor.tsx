import React, { Component } from 'react';
import { db } from '../services/db';
import { Save, ChevronDown, Edit2, Check, X } from 'lucide-react';

interface State {
  message: string;
  messageType: 'success' | 'error' | '';
  loading: boolean;
  sectionsData: {
    valuePropsTitle: string;
    statsTitle: string;
    statsSubtitle: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
  };
  statsData: {
    amigurumiCount: number;
    clientCount: number;
    rating: number;
    yearsExperience: number;
  };
  // Para las listas desplegables
  valuePropsOptions: string[];
  statsTitleOptions: string[];
  statsSubtitleOptions: string[];
  testimonialsTitleOptions: string[];
  testimonialsSubtitleOptions: string[];
}

export default class SiteContentEditor extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      message: '',
      messageType: '',
      loading: false,
      sectionsData: {
        valuePropsTitle: '',
        statsTitle: '',
        statsSubtitle: '',
        testimonialsTitle: '',
        testimonialsSubtitle: ''
      },
      statsData: {
        amigurumiCount: 0,
        clientCount: 0,
        rating: 0,
        yearsExperience: 0
      },
      valuePropsOptions: [
        '¿Por Qué Elegirnos?',
        '¿Por Qué Nosotros?',
        '¿Qué Nos Hace Especiales?',
        'Nuestras Ventajas',
        'Beneficios de Elegirnos',
        'Por Qué Confían en Nosotros'
      ],
      statsTitleOptions: [
        'Nuestro Impacto',
        'Nuestros Logros',
        'Nuestros Resultados',
        'Nuestras Conquistas',
        'Lo Que Hemos Logrado',
        'Nuestro Crecimiento'
      ],
      statsSubtitleOptions: [
        'Números que hablan por nosotros',
        'Estadísticas que inspiran',
        'Datos que nos respaldan',
        'Métricas de nuestro éxito',
        'Cifras que demuestran valor',
        'Resultados comprobados'
      ],
      testimonialsTitleOptions: [
        'Lo Que Dicen Nuestros Clientes',
        'Testimonios de Clientes',
        'Opiniones de Nuestros Clientes',
        'Experiencias Reales',
        'Historias de Éxito',
        'Lo Que Piensan de Nosotros',
        'Comentarios de Clientes Satisfechos'
      ],
      testimonialsSubtitleOptions: [
        'Más de 450 clientes satisfechos',
        'Más de 500 clientes felices',
        'Más de 1000 testimonios',
        'Miles de clientes contentos',
        'Decenas de reseñas positivas',
        'Cientos de experiencias únicas'
      ]
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    try {
      this.setState({ loading: true });
      
      const [sectionsData, statsData] = await Promise.all([
        db.getEditableSections(),
        db.getSiteStats()
      ]);

      this.setState({
        sectionsData: {
          valuePropsTitle: sectionsData.valuePropsTitle || sectionsData.value_props_title || '',
          statsTitle: sectionsData.statsTitle || sectionsData.stats_title || '',
          statsSubtitle: sectionsData.statsSubtitle || sectionsData.stats_subtitle || '',
          testimonialsTitle: sectionsData.testimonialsTitle || sectionsData.testimonials_title || '',
          testimonialsSubtitle: sectionsData.testimonialsSubtitle || sectionsData.testimonials_subtitle || ''
        },
        statsData: {
          amigurumiCount: statsData.amigurumiCount || statsData.amigurumi_count || 0,
          clientCount: statsData.clientCount || statsData.client_count || 0,
          rating: statsData.rating || 4.9,
          yearsExperience: statsData.yearsExperience || statsData.years_experience || 0
        },
        loading: false
      });
    } catch (error) {
      console.error('Error:', error);
      this.setState({ loading: false });
    }
  }

  showMessage = (text: string, type: 'success' | 'error') => {
    this.setState({ message: text, messageType: type });
    setTimeout(() => {
      this.setState({ message: '', messageType: '' });
    }, 3000);
  }

  handleSectionChange = (field: keyof State['sectionsData'], value: string) => {
    this.setState(prevState => ({
      sectionsData: {
        ...prevState.sectionsData,
        [field]: value
      }
    }));
  }

// Código corregido
handleStatsChange = (field: keyof State['statsData'], value: string | number) => {
  this.setState(prevState => ({
    statsData: {
      ...prevState.statsData,
      [field]: value // Ahora guarda el valor como string o number sin conversión prematura
    }
  }));
}


  handleSaveTitles = async () => {
    try {
      this.setState({ loading: true });
      await db.updateEditableSections(this.state.sectionsData);
      this.showMessage('✅ Títulos guardados correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('❌ Error al guardar títulos', 'error');
    } finally {
      this.setState({ loading: false });
    }
  }

  handleSaveStats = async () => {
    try {
      this.setState({ loading: true });
      await db.updateSiteStats(this.state.statsData);
      this.showMessage('✅ Estadísticas guardadas correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('❌ Error al guardar estadísticas', 'error');
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { message, messageType, sectionsData, statsData, loading } = this.state;

    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Edit2 className="text-white" size={24} />
          </div>
          Editor de Contenido del Sitio
        </h2>

        {message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${messageType === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} flex items-center gap-2`}>
            {messageType === 'success' ? <Check size={20} /> : <X size={20} />}
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* SECCIÓN DE TÍTULOS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold mb-6 text-purple-600 flex items-center gap-2">
            <Edit2 size={24} />
            Títulos de Secciones
          </h3>
          
          <div className="space-y-6">
            {/* Título "¿Por Qué Elegirnos?" */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Título Principal
              </label>
              <div className="relative">
                <select
                  value={sectionsData.valuePropsTitle}
                  onChange={(e) => this.handleSectionChange('valuePropsTitle', e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Selecciona una opción...</option>
                  {this.state.valuePropsOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este es el título principal de la sección de valores
              </p>
            </div>

            {/* Título "Nuestro Impacto" */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Título de Estadísticas
              </label>
              <div className="relative">
                <select
                  value={sectionsData.statsTitle}
                  onChange={(e) => this.handleSectionChange('statsTitle', e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Selecciona una opción...</option>
                  {this.state.statsTitleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Título que aparece sobre las estadísticas
              </p>
            </div>

            {/* Subtítulo de Estadísticas */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Subtítulo de Estadísticas
              </label>
              <div className="relative">
                <select
                  value={sectionsData.statsSubtitle}
                  onChange={(e) => this.handleSectionChange('statsSubtitle', e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Selecciona una opción...</option>
                  {this.state.statsSubtitleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Texto descriptivo debajo del título de estadísticas
              </p>
            </div>

            {/* Título de Testimonios */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Título de Testimonios
              </label>
              <div className="relative">
                <select
                  value={sectionsData.testimonialsTitle}
                  onChange={(e) => this.handleSectionChange('testimonialsTitle', e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Selecciona una opción...</option>
                  {this.state.testimonialsTitleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Título de la sección de testimonios
              </p>
            </div>

            {/* Subtítulo de Testimonios */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Subtítulo de Testimonios
              </label>
              <div className="relative">
                <select
                  value={sectionsData.testimonialsSubtitle}
                  onChange={(e) => this.handleSectionChange('testimonialsSubtitle', e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Selecciona una opción...</option>
                  {this.state.testimonialsSubtitleOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Texto complementario de la sección de testimonios
              </p>
            </div>

            <button
              onClick={this.handleSaveTitles}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 to-purple-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Títulos
                </>
              )}
            </button>
          </div>
        </div>

        {/* SECCIÓN DE ESTADÍSTICAS */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-bold mb-6 text-blue-600 flex items-center gap-2">
            📊 Estadísticas del Sitio
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Amigurumis Creados */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🧸 Amigurumis Creados
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={statsData.amigurumiCount}
                  onChange={(e) => this.handleStatsChange('amigurumiCount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  min="0"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🧸
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total de amigurumis creados
              </p>
            </div>

            {/* Clientes Felices */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                😊 Clientes Felices
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={statsData.clientCount}
                  onChange={(e) => this.handleStatsChange('clientCount', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  min="0"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  😊
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Clientes satisfechos
              </p>
            </div>

            {/* Rating Promedio */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ⭐ Rating Promedio
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={statsData.rating}
                  onChange={(e) => this.handleStatsChange('rating', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  min="1"
                  max="5"
                  step="0.1"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ⭐
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calificación promedio (1.0 - 5.0)
              </p>
            </div>

            {/* Años de Experiencia */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📅 Años de Experiencia
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={statsData.yearsExperience}
                  onChange={(e) => this.handleStatsChange('yearsExperience', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  min="0"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📅
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Años en el mercado
              </p>
            </div>
          </div>

          <button
            onClick={this.handleSaveStats}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Estadísticas
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
}