// pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient'; // Oñemboguejypa upe .ts


// El email del administrador es crucial para la validación RLS y la redirección
const ADMIN_EMAIL = 'puntadasdemechis@gmail.com';

// Define el tipo para la tabla 'clients'


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Función auxiliar para registrar o actualizar el cliente en la tabla 'clients'
  const ensureClientInDb = async (userEmail: string) => {
    // 1. Verificar si el cliente ya existe
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, name')
      .eq('email', userEmail)
      .limit(1)
      .single();

    if (!existingClient) {
      // 2. Si no existe, crearlo (Solo para clientes, no para el admin)
      if (userEmail !== ADMIN_EMAIL) {
        const { error: insertError } = await supabase
          .from('clients')
          .insert([{ 
              email: userEmail,
              name: userEmail.split('@')[0], // Nombre básico por defecto
              is_admin: false,
              created_at: new Date().toISOString()
           }]);

        if (insertError) {
          console.error("Error al insertar cliente:", insertError);
        }
      }
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Autenticación real con Supabase
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setLoading(false);

    if (authError) {
      // 1.1 Si hay error, mostrar mensaje
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      return;
    } 

    // 2. Éxito en la autenticación: Gestionar el rol y el almacenamiento local
    await ensureClientInDb(email);

    const role = (email === ADMIN_EMAIL) ? 'admin' : 'client';
    
    // Almacenamiento local (Temporal, para que el Layout sepa quién es)
    // Nota: Aunque ya no es la fuente de verdad, es necesario para el flujo de tu aplicación.
    localStorage.setItem('puntadas_user', email);
    localStorage.setItem('puntadas_role', role);
    window.dispatchEvent(new Event('storage'));

    // 3. Redirección
    if (role === 'admin') {
      navigate('/admin');
    } else {
      // Nota: Redirecciono a /client-dashboard según el código anterior,
      // pero tu código original usaba '/dashboard'. Usaré '/client-dashboard' si existe.
      // Si solo tienes '/dashboard', por favor ajústalo después.
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
          <p className="text-gray-500">Ingresa a tu cuenta para ver tus pedidos</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Verificando...' : (
              <>
                Ingresar <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            ¿No tienes cuenta? <a href="#/register" className="text-pink-600 font-bold hover:underline">Regístrate aquí</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
