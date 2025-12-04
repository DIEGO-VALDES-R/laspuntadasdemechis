import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const ADMIN_EMAIL = 'puntadasdemechis@gmail.com';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Autenticación con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        
        // Mensajes de error más específicos
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Debes confirmar tu correo electrónico antes de iniciar sesión.');
        } else {
          setError('Error al iniciar sesión. Inténtalo de nuevo.');
        }
        
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      console.log('✅ Usuario autenticado:', authData.user.email);

      // 2. Obtener el rol desde la tabla profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      // Si no existe el perfil, crear uno por defecto
      let userRole = 'client';
      
      if (profileError) {
        console.log('⚠️ Perfil no encontrado, creando uno nuevo...');
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              role: authData.user.email === ADMIN_EMAIL ? 'admin' : 'client',
            }
          ]);

        if (insertError) {
          console.error('❌ Error al crear perfil:', insertError);
        }
        
        userRole = authData.user.email === ADMIN_EMAIL ? 'admin' : 'client';
      } else {
        userRole = profile?.role || 'client';
      }

      console.log('👤 Rol del usuario:', userRole);

      // 3. Guardar en localStorage (para compatibilidad con Layout)
      localStorage.setItem('puntadas_user', authData.user.email || '');
      localStorage.setItem('puntadas_role', userRole);
      localStorage.setItem('puntadas_user_id', authData.user.id);
      
      // Disparar evento para que Layout se actualice
      window.dispatchEvent(new Event('storage'));

      setLoading(false);

      // 4. Redirigir según el rol
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <User className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido de nuevo!</h1>
            <p className="text-gray-600">Ingresa para ver tus pedidos y proyectos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Campo de Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="email" 
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white transition-all"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de submit */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 ${
                loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar Sesión <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Enlace a registro */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              ¿No tienes una cuenta?{' '}
              <Link 
                to="/register" 
                className="text-pink-600 font-bold hover:underline hover:text-pink-700 transition"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Enlace para recuperar contraseña (opcional) */}
          <div className="mt-3 text-center">
            <Link 
              to="/forgot-password" 
              className="text-gray-500 text-xs hover:text-gray-700 hover:underline transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Info adicional */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Al iniciar sesión, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
};

export default Login;