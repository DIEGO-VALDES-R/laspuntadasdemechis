import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface MigrationStatus {
  id: string;
  title: string;
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

const GalleryMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [items, setItems] = useState<MigrationStatus[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });

  const startMigration = async () => {
    if (!confirm('⚠️ ¿Estás seguro? Esta acción modificará los registros en la base de datos.\n\nAsegúrate de que el bucket "gallery" existe y es público.')) {
      return;
    }
    
    setIsRunning(true);
    setStats({ total: 0, success: 0, error: 0 });
    setItems([]);
    
    try {
      console.log('🚀 Iniciando migración de galería...');
      
      // 1. Obtener todos los items de galería
      const { data: galleryItems, error: fetchError } = await supabase
        .from('gallery_items')
        .select('*');
      
      if (fetchError) {
        console.error('❌ Error al obtener items:', fetchError);
        alert('Error al obtener items de galería: ' + fetchError.message);
        setIsRunning(false);
        return;
      }

      if (!galleryItems || galleryItems.length === 0) {
        alert('ℹ️ No hay items en la galería');
        setIsRunning(false);
        return;
      }

      console.log(`📦 Se encontraron ${galleryItems.length} items`);

      // 2. Filtrar solo los que tienen base64
      const base64Items = galleryItems.filter((item: any) => 
        item.image_url && item.image_url.startsWith('data:image')
      );

      console.log(`🖼️ Items con base64: ${base64Items.length}`);

      if (base64Items.length === 0) {
        alert('✅ ¡Excelente! No hay imágenes base64 para migrar.\n\nTodas las imágenes ya están en Storage.');
        setIsRunning(false);
        return;
      }

      setStats({ total: base64Items.length, success: 0, error: 0 });
      setItems(base64Items.map((item: any) => ({
        id: item.id,
        title: item.title,
        status: 'pending'
      })));

      // 3. Procesar cada item
      for (let i = 0; i < base64Items.length; i++) {
        const item = base64Items[i];
        console.log(`[${i + 1}/${base64Items.length}] Procesando: ${item.title}`);
        
        setItems(prev => prev.map(it => 
          it.id === item.id ? { ...it, status: 'uploading' } : it
        ));

        try {
          // Generar nombre de archivo único
          const timestamp = Date.now();
          const extension = item.image_url.includes('png') ? 'png' : 'jpg';
          const filename = `gallery-${item.id}-${timestamp}.${extension}`;

          // Convertir base64 a File
          const file = base64ToFile(item.image_url, filename);
          console.log(`  📤 Subiendo ${filename} (${(file.size / 1024).toFixed(2)} KB)`);

          // Subir a Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('gallery')
            .upload(filename, file, {
              contentType: file.type,
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Error al subir: ${uploadError.message}`);
          }

          console.log(`  ✅ Subido exitosamente`);

          // Actualizar el registro en la BD (guardamos solo el path)
          const { error: updateError } = await supabase
            .from('gallery_items')
            .update({ image_url: filename })
            .eq('id', item.id);

          if (updateError) {
            throw new Error(`Error al actualizar BD: ${updateError.message}`);
          }

          console.log(`  ✅ Actualizado en BD`);

          // Obtener URL pública para mostrar
          const { data: urlData } = supabase.storage
            .from('gallery')
            .getPublicUrl(filename);

          setItems(prev => prev.map(it => 
            it.id === item.id 
              ? { ...it, status: 'success', newUrl: urlData.publicUrl } 
              : it
          ));

          setStats(prev => ({ ...prev, success: prev.success + 1 }));

        } catch (error: any) {
          console.error(`  ❌ Error:`, error);
          setItems(prev => prev.map(it => 
            it.id === item.id 
              ? { ...it, status: 'error', error: error.message } 
              : it
          ));
          setStats(prev => ({ ...prev, error: prev.error + 1 }));
        }

        // Esperar entre uploads para no saturar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('🎉 Migración completada');
      alert(`🎉 ¡Migración completada!\n\n✅ Exitosos: ${stats.success + 1}\n❌ Errores: ${stats.error}`);
      
    } catch (error: any) {
      console.error('❌ Error general en migración:', error);
      alert('❌ Error durante la migración: ' + error.message);
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
          <h2 className="text-2xl font-bold text-gray-800">Migración de Galería</h2>
          <p className="text-gray-600">Migrar imágenes Base64 a Supabase Storage</p>
        </div>
      </div>

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

      {/* Botón de inicio */}
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
            Iniciar Migración
          </span>
        )}
      </button>

      {/* Lista de items */}
      {items.length > 0 && (
        <div className="mt-6 space-y-2 max-h-96 overflow-y-auto pr-2">
          <h3 className="font-bold text-gray-700 mb-3">Progreso de Migración:</h3>
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
                <p className="font-medium text-gray-800 truncate">{item.title}</p>
                {item.error && (
                  <p className="text-sm text-red-600 mt-1">{item.error}</p>
                )}
                {item.newUrl && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.newUrl}</p>
                )}
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

      {/* Instrucciones */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ Importante - Lee antes de continuar</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Esta acción <strong>modificará</strong> los registros en tu base de datos</li>
              <li>• Las imágenes se subirán al bucket <strong>"gallery"</strong> en Supabase Storage</li>
              <li>• Asegúrate de que el bucket "gallery" existe y es <strong>público</strong></li>
              <li>• Se recomienda hacer un <strong>backup</strong> de la tabla gallery_items primero</li>
              <li>• El proceso puede tardar varios minutos dependiendo del número de imágenes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Nota técnica */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Nota técnica:</strong> Las imágenes Base64 almacenadas en la BD inflaban el tamaño de tu base de datos 
          y ralentizaban las consultas. Al migrarlas a Storage, obtendrás mejor rendimiento, 
          thumbnails automáticos, y URLs optimizadas con CDN.
        </p>
      </div>
    </div>
  );
};

export default GalleryMigration;