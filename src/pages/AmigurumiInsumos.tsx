import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import { db } from '../services/db';

interface Insumo {
  id: string;
  tipo: string;
  marca: string;
  referencia: string;
  color: string;
  cantidad: string;
  unidad: string;
}

interface AmigurumiRecord {
  id: string;
  nombre: string;
  insumos: Insumo[];
  fechaActualizacion: string;
}

export default function AmigurumiInsumos() {
  const [amigurumis, setAmigurumis] = useState<AmigurumiRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    insumos: [] as Insumo[]
  });
  const [currentInsumo, setCurrentInsumo] = useState<Insumo>({
    id: '',
    tipo: 'lana',
    marca: '',
    referencia: '',
    color: '',
    cantidad: '',
    unidad: 'gramos'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos...');
      
      const { data, error } = await db.getAmigurumiRecords();
      
      if (error) {
        console.error('❌ Error:', error);
        throw error;
      }
      
      console.log('✅ Datos cargados:', data);
      setAmigurumis(data || []);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      alert('Error al cargar los datos: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (nombre: string, insumos: Insumo[]) => {
    try {
      setLoading(true);
      console.log('💾 Guardando...', { nombre, insumos, editingId });
      
      const amigurumiData: AmigurumiRecord = {
        id: editingId || crypto.randomUUID(),
        nombre,
        insumos,
        fechaActualizacion: new Date().toISOString()
      };
      
      if (editingId) {
        console.log('📝 Actualizando amigurumi ID:', editingId);
        const { error } = await db.updateAmigurumiRecord(editingId, amigurumiData);
        
        if (error) {
          console.error('❌ Error al actualizar:', error);
          throw error;
        }
        
        alert('✅ Amigurumi actualizado exitosamente');
      } else {
        console.log('🆕 Creando nuevo amigurumi');
        const { error } = await db.createAmigurumiRecord(amigurumiData);
        
        if (error) {
          console.error('❌ Error al crear:', error);
          throw error;
        }
        
        alert('✅ Amigurumi guardado exitosamente');
      }
      
      await loadData();
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      alert('Error al guardar los datos: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAmigurumi = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este amigurumi?')) {
      try {
        setLoading(true);
        console.log('🗑️ Eliminando amigurumi ID:', id);
        
        const { error } = await db.deleteAmigurumiRecord(id);
        
        if (error) {
          console.error('❌ Error al eliminar:', error);
          throw error;
        }
        
        await loadData();
        alert('✅ Amigurumi eliminado exitosamente');
      } catch (error) {
        console.error('❌ Error al eliminar:', error);
        alert('Error al eliminar: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddInsumo = () => {
    if (!currentInsumo.marca || !currentInsumo.color) {
      alert('Por favor completa al menos marca y color');
      return;
    }
    setFormData({
      ...formData,
      insumos: [...formData.insumos, { ...currentInsumo, id: Date.now().toString() }]
    });
    setCurrentInsumo({
      id: '',
      tipo: 'lana',
      marca: '',
      referencia: '',
      color: '',
      cantidad: '',
      unidad: 'gramos'
    });
  };

  const handleRemoveInsumo = (id: string) => {
    setFormData({
      ...formData,
      insumos: formData.insumos.filter(i => i.id !== id)
    });
  };

  const handleSaveAmigurumi = async () => {
    if (!formData.nombre) {
      alert('Por favor ingresa el nombre del amigurumi');
      return;
    }
    if (formData.insumos.length === 0) {
      alert('Por favor agrega al menos un insumo');
      return;
    }

    await saveData(formData.nombre, formData.insumos);
    handleCancel();
  };

  const handleEdit = (amigurumi: AmigurumiRecord) => {
    setFormData({
      nombre: amigurumi.nombre,
      insumos: amigurumi.insumos || []
    });
    setEditingId(amigurumi.id);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ nombre: '', insumos: [] });
    setCurrentInsumo({
      id: '',
      tipo: 'lana',
      marca: '',
      referencia: '',
      color: '',
      cantidad: '',
      unidad: 'gramos'
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const filteredAmigurumis = amigurumis.filter(a =>
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            Gestión de Insumos por Amigurumi
          </h1>
          <p className="text-gray-600 mb-4">
            Registra los materiales específicos para cada diseño
          </p>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              <Plus size={20} />
              Nuevo Amigurumi
            </button>
          ) : (
            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
              <h2 className="text-xl font-bold text-purple-800 mb-4">
                {editingId ? 'Editar Amigurumi' : 'Nuevo Amigurumi'}
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Amigurumi *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Osito Teddy, Conejito Rosa, etc."
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="bg-white rounded-lg p-4 mb-4 border-2 border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Agregar Insumo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tipo de Material
                    </label>
                    <select
                      value={currentInsumo.tipo}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    >
                      <option value="lana">Lana</option>
                      <option value="hilo">Hilo</option>
                      <option value="relleno">Relleno</option>
                      <option value="ojos">Ojos de Seguridad</option>
                      <option value="fieltro">Fieltro</option>
                      <option value="botones">Botones</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={currentInsumo.marca}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, marca: e.target.value })}
                      placeholder="Ej: Copito, Lanasol"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Referencia/Código
                    </label>
                    <input
                      type="text"
                      value={currentInsumo.referencia}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, referencia: e.target.value })}
                      placeholder="Ej: REF-1234"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Color *
                    </label>
                    <input
                      type="text"
                      value={currentInsumo.color}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, color: e.target.value })}
                      placeholder="Ej: Blanco hueso, Rosa pastel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="text"
                      value={currentInsumo.cantidad}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, cantidad: e.target.value })}
                      placeholder="Ej: 50, 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unidad
                    </label>
                    <select
                      value={currentInsumo.unidad}
                      onChange={(e) => setCurrentInsumo({ ...currentInsumo, unidad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    >
                      <option value="gramos">Gramos</option>
                      <option value="metros">Metros</option>
                      <option value="unidades">Unidades</option>
                      <option value="pares">Pares</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddInsumo}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Agregar Insumo
                </button>
              </div>

              {formData.insumos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Insumos Agregados ({formData.insumos.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.insumos.map((insumo) => (
                      <div
                        key={insumo.id}
                        className="bg-white border-2 border-gray-200 rounded-lg p-3 flex justify-between items-start hover:border-purple-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">
                              {insumo.tipo}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {insumo.marca}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Color:</span> {insumo.color}
                            {insumo.referencia && (
                              <span className="ml-3">
                                <span className="font-medium">Ref:</span> {insumo.referencia}
                              </span>
                            )}
                            {insumo.cantidad && (
                              <span className="ml-3">
                                <span className="font-medium">Cantidad:</span> {insumo.cantidad} {insumo.unidad}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInsumo(insumo.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveAmigurumi}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? 'Guardando...' : 'Guardar Amigurumi'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
                >
                  <X size={20} />
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-purple-800">
              Mis Amigurumis ({filteredAmigurumis.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar amigurumi..."
                className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Cargando...
            </div>
          ) : filteredAmigurumis.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No se encontraron amigurumis' : 'No hay amigurumis registrados aún'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAmigurumis.map((amigurumi) => (
                <div
                  key={amigurumi.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-purple-800">
                        {amigurumi.nombre}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Actualizado: {new Date(amigurumi.fechaActualizacion).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(amigurumi)}
                        disabled={loading}
                        className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteAmigurumi(amigurumi.id)}
                        disabled={loading}
                        className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                      Lista de Insumos:
                    </h4>
                    <div className="space-y-2">
                      {(amigurumi.insumos || []).map((insumo) => (
                        <div key={insumo.id} className="bg-white rounded-lg p-2 border border-gray-200">
                          <div className="flex items-start gap-2">
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded shrink-0">
                              {insumo.tipo}
                            </span>
                            <div className="text-sm flex-1">
                              <div className="font-semibold text-gray-800">{insumo.marca}</div>
                              <div className="text-gray-600">
                                <span className="font-medium">Color:</span> {insumo.color}
                              </div>
                              {insumo.referencia && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Referencia:</span> {insumo.referencia}
                                </div>
                              )}
                              {insumo.cantidad && (
                                <div className="text-gray-600">
                                  <span className="font-medium">Cantidad:</span> {insumo.cantidad} {insumo.unidad}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}