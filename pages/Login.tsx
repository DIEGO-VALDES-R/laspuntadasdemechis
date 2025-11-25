import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin Authentication Check
    if (email === 'puntadasdemechis@gmail.com' && password === 'Lashijasdemechis') {
      localStorage.setItem('puntadas_user', email);
      localStorage.setItem('puntadas_role', 'admin');
      // Trigger storage event for Layout update
      window.dispatchEvent(new Event('storage'));
      navigate('/admin');
      return;
    }

    // Default Client Login (Demo purposes: allows any email)
    if (email) {
      if (email === 'puntadasdemechis@gmail.com') {
         // Prevent admin email from logging in as client if password was wrong
         setError('Contraseña incorrecta para cuenta administrativa');
         return;
      }

      localStorage.setItem('puntadas_user', email);
      localStorage.setItem('puntadas_role', 'client');
      // Trigger storage event for Layout update
      window.dispatchEvent(new Event('storage'));
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
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            Ingresar <ArrowRight size={20} />
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