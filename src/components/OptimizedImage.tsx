import React from 'react';
import { supabase } from '../services/supabaseClient';

interface OptimizedImageProps {
  bucket: string;
  path: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'medium' | 'full';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  bucket, 
  path, 
  alt, 
  className = '',
  size = 'medium'
}) => {
  const getOptimizedUrl = (imageSize: 'thumbnail' | 'medium' | 'full') => {
    const transforms = {
      thumbnail: { width: 400, height: 300, quality: 70 },
      medium: { width: 800, height: 600, quality: 80 },
      full: { width: 1920, height: 1080, quality: 85 }
    };

    const transform = transforms[imageSize];

    return supabase.storage
      .from(bucket)
      .getPublicUrl(path, {
        transform: {
          width: transform.width,
          height: transform.height,
          quality: transform.quality,
          format: 'webp'
        }
      }).data.publicUrl;
  };

  const thumbnail = getOptimizedUrl('thumbnail');
  const medium = getOptimizedUrl('medium');
  const full = getOptimizedUrl('full');

  return (
    <img
      src={medium}
      srcSet={`
        ${thumbnail} 400w,
        ${medium} 800w,
        ${full} 1920w
      `}
      sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1920px"
      loading="lazy"
      alt={alt}
      className={className}
    />
  );
};

export default OptimizedImage;