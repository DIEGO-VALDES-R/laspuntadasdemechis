
import React, { useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

interface ImageUploaderProps {
  currentImage?: string;
  onUpload: (url: string) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onUpload, label = "Imagen" }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImage);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen es demasiado pesada (Máx 5MB)");
      return;
    }

    setLoading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setPreview(url);
      onUpload(url);
    } catch (error) {
      console.error(error);
      alert("Error al subir la imagen. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition relative overflow-hidden group">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader className="animate-spin text-pink-500 mb-2" size={24} />
            <span className="text-xs text-gray-500">Subiendo a la nube...</span>
          </div>
        ) : preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <label className="cursor-pointer bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-bold hover:bg-gray-100 flex items-center gap-1">
                <Upload size={14} /> Cambiar
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center py-6">
            <Upload className="text-gray-400 mb-2" size={32} />
            <span className="text-sm text-gray-600">Clic para subir imagen</span>
            <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
