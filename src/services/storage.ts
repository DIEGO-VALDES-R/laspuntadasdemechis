import { supabase } from '../lib/supabase';

export const uploadImage = async (
  file: File,
  folder: 'supplies' | 'gallery' | 'tejedoras' | 'posts' | 'challenges' | 'orders' = 'gallery'
): Promise<string | null> => {
  try {
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB.');
      return null;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen.');
      return null;
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Subir archivo al bucket 'gallery' que es el que se usa en el resto del proyecto
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      alert('Error al subir la imagen: ' + uploadError.message);
      return null;
    }

    // Obtener URL pública
    const { data } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    alert('Error inesperado al subir la imagen');
    return null;
  }
};

export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraer el path del URL
    // Intentar con el bucket 'gallery' primero
    let filePath = '';
    if (imageUrl.includes('/gallery/')) {
      filePath = imageUrl.split('/gallery/')[1];
    } else if (imageUrl.includes('/supplies-images/')) {
      filePath = imageUrl.split('/supplies-images/')[1];
    }

    if (!filePath) return false;

    const bucket = imageUrl.includes('/supplies-images/') ? 'supplies-images' : 'gallery';

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};