// services/imageHelpers.ts
import { supabase } from './supabaseClient';

/**
 * Convierte un path de imagen a URL pública de Supabase Storage
 * Si ya es una URL completa, la devuelve tal cual
 * Si es Base64, la devuelve tal cual (para retrocompatibilidad)
 */
export function getPublicImageUrl(imagePath: string | undefined | null, bucket: string = 'gallery'): string {
  // Si no hay imagen, devolver placeholder
  if (!imagePath) {
    return 'https://placehold.co/400x400/e8e8e8/666666?text=Sin+Imagen';
  }

  // Si ya es una URL completa (http/https), devolverla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Si es Base64, devolverla tal cual (para retrocompatibilidad)
  if (imagePath.startsWith('data:image')) {
    return imagePath;
  }

  // Si es un path de Storage, construir la URL pública
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

/**
 * Extrae el path limpio de una URL de Supabase Storage
 */
export function extractStoragePath(url: string): string {
  try {
    if (!url) return '';
    
    // Si ya es un path simple (sin http), devolverlo tal cual
    if (!url.includes('http')) {
      return url;
    }
    
    // Extraer después de /storage/v1/object/public/gallery/
    const match = url.match(/\/storage\/v1\/object\/public\/gallery\/(.+)$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    
    // Fallback: último segmento
    const segments = url.split('/');
    return decodeURIComponent(segments[segments.length - 1]);
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return url;
  }
}

/**
 * Procesa un array de items de galería para agregar URLs públicas
 */
export function processGalleryItems<T extends { image_url?: string }>(items: T[]): T[] {
  return items.map(item => ({
    ...item,
    image_url: getPublicImageUrl(item.image_url)
  }));
}

/**
 * Procesa la configuración del home para convertir todos los paths de imágenes
 */
export function processHomeConfig(config: any): any {
  if (!config) return config;

  const imageFields = [
    'hero_image1',
    'hero_image2', 
    'hero_image3',
    'card_image3',
    'card_image4',
    'card_image5',
    'card_image6',
    'card_image7',
    'card_image8'
  ];

  const processed = { ...config };

  imageFields.forEach(field => {
    if (processed[field]) {
      processed[field] = getPublicImageUrl(processed[field]);
    }
  });

  return processed;
}