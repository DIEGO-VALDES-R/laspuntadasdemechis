import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { Star, Plus, Edit2, Trash2, Eye, X, Save, Upload, User as UserIcon } from 'lucide-react';

/**
 * Componente para gestionar testimonios de clientes
 * Permite crear, editar, eliminar y activar/desactivar testimonios
 */
const TestimonialsView: React.FC = () => {
  // Estados del componente
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    image_url: '',
    active: true
  });

  /**
   * Verificar autenticación y cargar testimonios al montar el componente
   */
  useEffect(() => {
    const user = localStorage.getItem('puntadas_user');
    const role = localStorage.getItem('puntadas_role');
    if (!user || role !== 'admin') {
      navigate('/login');
      return;
    }
    loadTestimonials();
  }, [navigate]);

  /**
   * Cargar todos los testimonios desde la base de datos
   */
  const loadTestimonials = async () => {
    try {
      console.log('🔄 Cargando testimonios...');
      const data = await db.getAllTestimonials();
      console.log('✅ Testimonios cargados:', data.length);
      setTestimonials(data);
    } catch (error) {
      console.error('❌ Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar la subida de imágenes
   * @param e Evento de cambio del input de archivo
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('📤 Iniciando subida de imagen:', file.name);
    setUploadingImage(true);
    
    try {
      // Aquí necesitarás tener una función para subir imágenes
      // Por ahora, solo creamos una URL temporal
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('✅ Imagen procesada correctamente');
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Manejar el envío del formulario (crear o actualizar testimonio)
   * @param e Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 Enviando formulario:', {
      editingTestimonial,
      formData
    });
    
    if (!formData.name || !formData.comment) {
      alert('Por favor completa el nombre y el comentario');
      return;
    }

    try {
      if (editingTestimonial) {
        console.log('🔄 Actualizando testimonio existente...');
        const result = await db.updateTestimonial(editingTestimonial.id, formData);
        console.log('✅ Testimonio actualizado:', result);
        alert('Testimonio actualizado correctamente');
      } else {
        console.log('➕ Creando nuevo testimonio...');
        const result = await db.createTestimonial({
          ...formData,
          created_at: new Date().toISOString()
        });
        console.log('✅ Testimonio creado:', result);
        alert('Testimonio creado correctamente');
      }
      
      // Resetear formulario y cerrar modal
      setIsModalOpen(false);
      setEditingTestimonial(null);
      setFormData({
        name: '',
        email: '',
        rating: 5,
        comment: '',
        image_url: '',
        active: true
      });
      
      // Recargar lista de testimonios
      await loadTestimonials();
    } catch (error) {
      console.error('❌ Error saving testimonial:', error);
      alert(`Error al guardar el testimonio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  /**
   * Preparar formulario para editar un testimonio existente
   * @param testimonial Testimonio a editar
   */
  const handleEdit = (testimonial: any) => {
    console.log('📝 Editando testimonio:', testimonial);
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      email: testimonial.email || '',
      rating: testimonial.rating,
      comment: testimonial.comment,
      image_url: testimonial.image_url || '',
      active: testimonial.active
    });
    setIsModalOpen(true);
  };

  /**
   * Eliminar un testimonio
   * @param id ID del testimonio a eliminar
   */
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este testimonio?')) return;
    
    console.log('🗑️ Eliminando testimonio:', id);
    try {
      await db.deleteTestimonial(id);
      console.log('✅ Testimonio eliminado correctamente');
      alert('Testimonio eliminado correctamente');
      await loadTestimonials();
    } catch (error) {
      console.error('❌ Error deleting testimonial:', error);
      alert(`Error al eliminar el testimonio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  /**
   * Activar o desactivar un testimonio
   * @param id ID del testimonio
   * @param active Nuevo estado de activación
   */
  const handleToggleActive = async (id: string, active: boolean) => {
    console.log('🔄 Actualizando estado de testimonio:', { id, active });
    try {
      const result = await db.updateTestimonial(id, { active });
      console.log('✅ Testimonio actualizado:', result);
      await loadTestimonials();
      alert(`Testimonio ${active ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('❌ Error updating testimonial:', error);
      alert(`Error al actualizar el testimonio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  /**
   * Abrir modal para crear un nuevo testimonio
   */
  const openNewTestimonial = () => {
    console.log('➕ Abriendo modal para nuevo testimonio');
    setEditingTestimonial(null);
    setFormData({
      name: '',
      email: '',
      rating: 5,
      comment: '',
      image_url: '',
      active: true
    });
    setIsModalOpen(true);
  };

  /**
   * Renderizar estrellas de calificación
   * @param rating Calificación actual
   */
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
              Volver al Panel
            </button>
            
            <button
              onClick={openNewTestimonial}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Nuevo Testimonio
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl">
              <Star className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gestión de Testimonios</h1>
              <p className="text-gray-600">Administra los testimonios de tus clientes</p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {testimonials.length === 0 ? (
            // Estado vacío
            <div className="text-center py-12">
              <Star size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay testimonios aún</h3>
              <p className="text-gray-500 mb-6">Comienza agregando el primer testimonio de un cliente satisfecho</p>
              <button
                onClick={openNewTestimonial}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Agregar Primer Testimonio
              </button>
            </div>
          ) : (
            // Lista de testimonios
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                    testimonial.active 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Cabecera del testimonio */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {testimonial.image_url ? (
                        <img
                          src={testimonial.image_url}
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800">{testimonial.name}</h3>
                        {testimonial.email && (
                          <p className="text-sm text-gray-500">{testimonial.email}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(testimonial)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Editar testimonio"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(testimonial.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Eliminar testimonio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Calificación */}
                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(testimonial.rating)}
                    <span className="text-sm text-gray-600 ml-2">({testimonial.rating}.0)</span>
                  </div>

                  {/* Comentario */}
                  <p className="text-gray-700 mb-4 line-clamp-4">{testimonial.comment}</p>

                  {/* Pie del testimonio */}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      testimonial.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {testimonial.active ? 'Activo' : 'Inactivo'}
                    </span>
                    
                    {/* Botón de activación/desactivación */}
                    <button
                      onClick={() => handleToggleActive(testimonial.id, !testimonial.active)}
                      className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
                        testimonial.active
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={testimonial.active ? 'Desactivar testimonio' : 'Activar testimonio'}
                    >
                      {testimonial.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar/editar testimonio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Cabecera del modal */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTestimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campos de nombre y email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              {/* Campo de calificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="transition-colors"
                    >
                      <Star
                        size={32}
                        className={star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-gray-600">({formData.rating}.0)</span>
                </div>
              </div>

              {/* Campo de comentario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario *
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={4}
                  placeholder="Excelente servicio, muy profesional..."
                  required
                />
              </div>

              {/* Campo de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto del Cliente (opcional)
                </label>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-gray-200"
                  />
                )}
                <div className="flex items-center gap-3">
                  <label className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                    <Upload size={16} />
                    {uploadingImage ? 'Subiendo...' : 'Subir Imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Eliminar imagen
                    </button>
                  )}
                </div>
              </div>

              {/* Campo de activación */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Mostrar testimonio en la página principal
                </label>
              </div>

              {/* Botones del formulario */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} className="inline mr-2" />
                  {editingTestimonial ? 'Actualizar Testimonio' : 'Guardar Testimonio'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsView;