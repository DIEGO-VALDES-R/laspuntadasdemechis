import { supabase } from './supabaseClient';

export const uploadImage = async (
  file: File,
  folder: 'supplies' | 'gallery' | 'tejedoras' | 'posts' | 'challenges' = 'supplies'
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

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from('supplies-images')
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
      .from('supplies-images')
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
    const urlParts = imageUrl.split('/supplies-images/');
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('supplies-images')
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