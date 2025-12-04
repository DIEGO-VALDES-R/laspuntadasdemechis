import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Phone, MapPin, Mail, CreditCard, ArrowRight } from 'lucide-react';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    direccion: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.values(formData).some(val => val === '')) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Registrar en Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Registrar en la tabla clients
      await db.registerClient({
  email: formData.email,
  nombre_completo: formData.nombre,  // ✅ CORREGIDO (antes era solo "nombre")
  telefono: formData.telefono,
  direccion: formData.direccion,
  cedula: formData.cedula,
  password: formData.password
});

      alert('Cuenta creada exitosamente. Revisa tu email para confirmar.');
      navigate('/login');
    } catch (error: any) {
      setLoading(false);
      if (error.code === '23505') {
        setError('Este correo ya está registrado. Intenta con otro o inicia sesión.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo.');
      }
      console.error('Error al registrar:', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
          <p className="text-gray-500">Regístrate para solicitar tus amigurumis personalizados</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres Completos</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                name="nombre"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula de Ciudadanía</label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                name="cedula"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                placeholder="1234567890"
                value={formData.cedula}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel"
                    name="telefono"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                    placeholder="300 123 4567"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Envío</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    name="direccion"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                    placeholder="Calle 123 # 45-67"
                    value={formData.direccion}
                    onChange={handleChange}
                  />
                </div>
              </div>
          </div>

          <div className="border-t border-gray-100 my-4 pt-4">
             <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Datos de Acceso</h3>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="email"
                        name="email"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                        placeholder="tu@correo.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="password"
                        name="password"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    </div>
                </div>
             </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creando cuenta...' : (
              <>
                Completar Registro <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿Ya tienes una cuenta? <a href="#/login" className="text-pink-600 font-bold hover:underline">Iniciar Sesión</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;