import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface MigrationStatus {
  id: string;
  title: string;
  type: 'gallery' | 'home';
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  newUrl?: string;
}

function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const CompleteMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [items, setItems] = useState<MigrationStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });
  const [migrationStep, setMigrationStep] = useState<'idle' | 'gallery' | 'home' | 'complete'>('idle');

  const startMigration = async () => {
    if (!confirm('⚠️ Esta acción migrará TODAS las imágenes Base64 a Storage:\n\n✅ Galería\n✅ Imágenes del Home\n\n¿Continuar?')) {
      return;
    }
    
    setIsRunning(true);
    setStats({ total: 0, success: 0, error: 0 });
    setItems([]);
    
    try {
      console.log('🚀 Iniciando migración completa...');

      // ==========================================
      // FASE 1: MIGRAR GALERÍA
      // ==========================================
      setMigrationStep('gallery');
      console.log('📸 FASE 1: Migrando galería...');

      const { data: galleryItems, error: galleryError } = await supabase
        .from('gallery_items')
        .select('*');

      if (galleryError) {
        throw new Error('Error al obtener galería: ' + galleryError.message);
      }

      const galleryBase64Items = (galleryItems || []).filter((item: any) => 
        item.image_url && item.image_url.startsWith('data:image')
      );

      console.log(`🖼️ Items de galería con base64: ${galleryBase64Items.length}`);

      // Añadir items de galería a la lista
      const galleryStatusItems: MigrationStatus[] = galleryBase64Items.map((item: any) => ({
        id: `gallery-${item.id}`,
        title: `Galería: ${item.title}`,
        type: 'gallery',
        status: 'pending'
      }));

      // ==========================================
      // FASE 2: MIGRAR HOME CONFIG
      // ==========================================
      setMigrationStep('home');
      console.log('🏠 FASE 2: Migrando imágenes del Home...');

      const { data: homeConfig, error: homeError } = await supabase
        .from('home_config')
        .select('*')
        .limit(1)
        .single();

      if (homeError) {
        throw new Error('Error al obtener home_config: ' + homeError.message);
      }

      const homeBase64Images: { key: string; value: string }[] = [];
      
      if (homeConfig) {
        const imageFields = ['heroImage1', 'heroImage2', 'cardImage1', 'cardImage2', 'cardImage3', 'cardImage4', 'cardImage5'];
        imageFields.forEach(field => {
          if (homeConfig[field] && homeConfig[field].startsWith('data:image')) {
            homeBase64Images.push({ key: field, value: homeConfig[field] });
          }
        });
      }

      console.log(`🖼️ Imágenes del Home con base64: ${homeBase64Images.length}`);

      const homeStatusItems: MigrationStatus[] = homeBase64Images.map((img) => ({
        id: `home-${img.key}`,
        title: `Home: ${img.key}`,
        type: 'home',
        status: 'pending'
      }));

      // Combinar todas las items
      const allItems = [...galleryStatusItems, ...homeStatusItems];
      
      if (allItems.length === 0) {
        alert('✅ ¡No hay imágenes Base64 para migrar!\n\nTodas las imágenes ya están en Storage.');
        setIsRunning(false);
        return;
      }

      setStats({ total: allItems.length, success: 0, error: 0 });
      setItems(allItems);

      // ==========================================
      // PROCESAR GALERÍA
      // ==========================================
      for (const item of galleryBase64Items) {
        const statusId = `gallery-${item.id}`;
        
        setItems(prev => prev.map(it => 
          it.id === statusId ? { ...it, status: 'uploading' } : it
        ));

        try {
          const timestamp = Date.now();
          const extension = item.image_url.includes('png') ? 'png' : 'jpg';
          const filename = `gallery-${item.id}-${timestamp}.${extension}`;

          const file = base64ToFile(item.image_url, filename);

          const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(filename, file, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { error: updateError } = await supabase
            .from('gallery_items')
            .update({ image_url: filename })
            .eq('id', item.id);

          if (updateError) throw updateError;

          const { data: urlData } = supabase.storage
            .from('gallery')
            .getPublicUrl(filename);

          setItems(prev => prev.map(it => 
            it.id === statusId 
              ? { ...it, status: 'success', newUrl: urlData.publicUrl } 
              : it
          ));

          setStats(prev => ({ ...prev, success: prev.success + 1 }));

        } catch (error: any) {
          console.error(`❌ Error en galería ${item.title}:`, error);
          setItems(prev => prev.map(it => 
            it.id === statusId 
              ? { ...it, status: 'error', error: error.message } 
              : it
          ));
          setStats(prev => ({ ...prev, error: prev.error + 1 }));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // ==========================================
      // PROCESAR HOME CONFIG
      // ==========================================
      const homeUpdates: any = {};

      for (const img of homeBase64Images) {
        const statusId = `home-${img.key}`;
        
        setItems(prev => prev.map(it => 
          it.id === statusId ? { ...it, status: 'uploading' } : it
        ));

        try {
          const timestamp = Date.now();
          const extension = img.value.includes('png') ? 'png' : 'jpg';
          const filename = `home-${img.key}-${timestamp}.${extension}`;

          const file = base64ToFile(img.value, filename);

          const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(filename, file, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Guardar el path para actualizar después
          homeUpdates[img.key] = filename;

          const { data: urlData } = supabase.storage
            .from('gallery')
            .getPublicUrl(filename);

          setItems(prev => prev.map(it => 
            it.id === statusId 
              ? { ...it, status: 'success', newUrl: urlData.publicUrl } 
              : it
          ));

          setStats(prev => ({ ...prev, success: prev.success + 1 }));

        } catch (error: any) {
          console.error(`❌ Error en home ${img.key}:`, error);
          setItems(prev => prev.map(it => 
            it.id === statusId 
              ? { ...it, status: 'error', error: error.message } 
              : it
          ));
          setStats(prev => ({ ...prev, error: prev.error + 1 }));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Actualizar home_config con los nuevos paths
      if (Object.keys(homeUpdates).length > 0) {
        const { error: updateHomeError } = await supabase
          .from('home_config')
          .update(homeUpdates)
          .eq('id', homeConfig.id);

        if (updateHomeError) {
          console.error('Error actualizando home_config:', updateHomeError);
        }
      }

      setMigrationStep('complete');
      console.log('🎉 Migración completada');
      alert(`🎉 ¡Migración completada!\n\n✅ Exitosos: ${stats.success + 1}\n❌ Errores: ${stats.error}\n\nRecarga la página para ver los cambios.`);
      
    } catch (error: any) {
      console.error('❌ Error general:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Upload className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Migración Completa de Imágenes</h2>
          <p className="text-gray-600">Migrar todas las imágenes Base64 a Supabase Storage</p>
        </div>
      </div>

      {/* Paso actual */}
      {migrationStep !== 'idle' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-blue-600" />
            <div>
              <p className="font-bold text-blue-800">
                {migrationStep === 'gallery' && '📸 Migrando Galería...'}
                {migrationStep === 'home' && '🏠 Migrando Imágenes del Home...'}
                {migrationStep === 'complete' && '✅ ¡Completado!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600 font-medium">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <p className="text-3xl font-bold text-green-600">{stats.success}</p>
            <p className="text-sm text-gray-600 font-medium">Exitosos</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <p className="text-3xl font-bold text-red-600">{stats.error}</p>
            <p className="text-sm text-gray-600 font-medium">Errores</p>
          </div>
        </div>
      )}

      {/* Botón */}
      <button
        onClick={startMigration}
        disabled={isRunning}
        className={`w-full py-4 rounded-lg font-bold text-white transition-all transform ${
          isRunning
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[1.02]'
        }`}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <Loader className="animate-spin" size={20} />
            Migrando... Por favor espera
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Upload size={20} />
            Iniciar Migración Completa
          </span>
        )}
      </button>

      {/* Lista */}
      {items.length > 0 && (
        <div className="mt-6 space-y-2 max-h-96 overflow-y-auto pr-2">
          <h3 className="font-bold text-gray-700 mb-3">Progreso:</h3>
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                item.status === 'success' ? 'bg-green-50 border-green-300' :
                item.status === 'error' ? 'bg-red-50 border-red-300' :
                item.status === 'uploading' ? 'bg-blue-50 border-blue-300 animate-pulse' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    item.type === 'gallery' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.type === 'gallery' ? '📸' : '🏠'}
                  </span>
                  <p className="font-medium text-gray-800 truncate">{item.title}</p>
                </div>
                {item.error && <p className="text-sm text-red-600 mt-1">{item.error}</p>}
                {item.newUrl && <p className="text-xs text-gray-500 mt-1 truncate">{item.newUrl}</p>}
              </div>
              <div className="ml-4 flex-shrink-0">
                {item.status === 'success' && <CheckCircle className="text-green-600" size={24} />}
                {item.status === 'error' && <XCircle className="text-red-600" size={24} />}
                {item.status === 'uploading' && <Loader className="text-blue-600 animate-spin" size={24} />}
                {item.status === 'pending' && <div className="w-6 h-6 rounded-full bg-gray-300" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advertencia */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ Importante</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Migrará imágenes de <strong>gallery_items</strong> y <strong>home_config</strong></li>
              <li>• Asegúrate de que el bucket "gallery" existe y es público</li>
              <li>• Después de migrar, recarga la página para ver los cambios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteMigration;