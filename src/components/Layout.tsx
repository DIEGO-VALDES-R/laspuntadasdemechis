import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, ShoppingBag, Instagram, MessageCircle, LogOut, LayoutDashboard, Heart, Trophy } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('puntadas_user');
      const role = localStorage.getItem('puntadas_role');

      setIsLoggedIn(prev => {
        const newValue = !!user;
        return prev !== newValue ? newValue : prev;
      });

      setIsAdmin(prev => {
        const newValue = role === 'admin';
        return prev !== newValue ? newValue : prev;
      });
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'puntadas_user' || e.key === 'puntadas_role') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location]);

  // ✅ FUNCIÓN DE LOGOUT CORREGIDA - Sincronizada con Supabase
  const handleLogout = async () => {
    try {
      // 1. Cerrar sesión en Supabase primero
      await supabase.auth.signOut();
      
      // 2. Limpiar localStorage
      localStorage.removeItem('puntadas_user');
      localStorage.removeItem('puntadas_role');
      localStorage.removeItem('puntadas_user_id');
      
      // 3. Actualizar estado local
      setIsLoggedIn(false);
      setIsAdmin(false);
      setIsMenuOpen(false);
      
      // 4. Redirigir a login
      navigate('/login');
      
      // 5. Disparar evento para que otros componentes se enteren
      window.dispatchEvent(new Event('storage'));
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar limpieza aunque falle Supabase
      localStorage.removeItem('puntadas_user');
      localStorage.removeItem('puntadas_role');
      localStorage.removeItem('puntadas_user_id');
      setIsLoggedIn(false);
      setIsAdmin(false);
      navigate('/login');
    }
  };

  const dashboardLink = isAdmin ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="flex-shrink-0 flex flex-col items-start">
  <Link to="/" className="text-2xl font-bold flex items-center uppercase">
    <span className="mr-1" style={{ color: '#D43A51' }}>Puntadas</span>
    <span className="mr-1" style={{ color: '#E87A2B' }}>de</span>
    <span style={{ color: '#2E8B57' }}>Mechis</span>
  </Link>
  <span className="text-xs font-semibold uppercase mt-[-4px]" style={{ color: '#2E8B57' }}>
    HILOS QUE CONECTAN CORAZONES
  </span>
</div>


            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="text-gray-600 hover:text-pink-500 transition">Inicio</Link>
              <Link to="/request" className="text-gray-600 hover:text-pink-500 transition">Solicitar</Link>
              <Link to="/#gallery" className="text-gray-600 hover:text-pink-500 transition">Galería</Link>

              <Link to="/community" className="text-gray-600 hover:text-pink-500 transition flex items-center gap-1">
                <Heart size={16} /> Comunidad
              </Link>
              <Link to="/challenges" className="text-gray-600 hover:text-pink-500 transition flex items-center gap-1">
                <Trophy size={16} /> Retos
              </Link>

              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-pink-500 font-medium">Iniciar Sesión</Link>
                  <Link to="/register" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full hover:opacity-90 transition shadow-md">
                    Registrarse
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to={dashboardLink} className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${isAdmin ? 'bg-gray-800 text-white hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
                    {isAdmin ? <LayoutDashboard size={18} /> : <User size={18} />}
                    {isAdmin ? "Administración" : "Mi Cuenta"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition px-2"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full z-40">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-600 hover:bg-pink-50 rounded-md">Inicio</Link>
              <Link to="/request" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-600 hover:bg-pink-50 rounded-md">Solicitar Pedido</Link>
              <Link to="/community" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-600 hover:bg-pink-50 rounded-md">Comunidad</Link>
              <Link to="/challenges" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-600 hover:bg-pink-50 rounded-md">Retos</Link>

              {!isLoggedIn ? (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-600 hover:bg-pink-50 rounded-md">Iniciar Sesión</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-pink-600 hover:bg-pink-50 rounded-md font-bold">Registrarse</Link>
                </>
              ) : (
                <>
                  <Link to={dashboardLink} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-gray-600 hover:bg-pink-50 rounded-md font-medium">
                    {isAdmin ? "Panel de Administración" : "Mi Cuenta"}
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md flex items-center gap-2">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-xl font-bold mb-4 text-pink-400">Puntadas de Mechis</h3>
              <p className="text-gray-400 text-sm">
                Amigurumis personalizados hechos con amor. Damos vida a tu imaginación con cada puntada.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lila-medio">Sobre Nosotros</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Nuestra Historia</a></li>
                <li><a href="#" className="hover:text-white">Tejedoras</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lila-medio">Contacto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2"><MessageCircle size={16}/> +57 312 491 5127</li>
                <li>puntadasdemechis@gmail.com</li>
                <li>Bogotá, Colombia</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-lila-medio">Síguenos</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-pink-500 transition"><Instagram size={24} /></a>
                <a href="#" className="text-gray-400 hover:text-pink-500 transition"><ShoppingBag size={24} /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © 2025 Puntadas de Mechis. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;