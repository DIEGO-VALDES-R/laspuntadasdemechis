import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import RequestForm from './pages/RequestForm';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackOrder from './pages/TrackOrder';
import Community from './pages/Community';
import Challenges from './pages/Challenges';
import Accounting from './pages/Accounting';

const ADMIN_EMAIL = 'puntadasdemechis@gmail.com';

// Helper component to scroll to top on route change
const ScrollToTopHelper = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// 🔒 Protected Route Component with Supabase Auth
interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false, 
  requireAdmin = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setIsAuthenticated(true);
      setIsAdmin(session.user.email === ADMIN_EMAIL);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión de Supabase al cargar
    checkSession();
    
    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        setIsAdmin(session.user.email === ADMIN_EMAIL);
        
        // Mantener sincronizado con localStorage para Layout
        localStorage.setItem('puntadas_user', session.user.email || '');
        localStorage.setItem('puntadas_role', session.user.email === ADMIN_EMAIL ? 'admin' : 'client');
      } else {
        setUserEmail(null);
        setIsAdmin(false);
        localStorage.removeItem('puntadas_user');
        localStorage.removeItem('puntadas_role');
      }
      
      window.dispatchEvent(new Event('storage'));
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUserEmail(session.user.email || null);
      setIsAdmin(session.user.email === ADMIN_EMAIL);
      
      // Sincronizar con localStorage
      localStorage.setItem('puntadas_user', session.user.email || '');
      localStorage.setItem('puntadas_role', session.user.email === ADMIN_EMAIL ? 'admin' : 'client');
    }
    
    setLoading(false);
  };

  // En App.tsx, reemplaza la función handleLogout (línea ~90):
const handleLogout = async () => {
  try {
    // 1. Cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    // 2. Limpiar localStorage
    localStorage.removeItem('puntadas_user');
    localStorage.removeItem('puntadas_role');
    localStorage.removeItem('puntadas_user_id');
    
    // 3. Actualizar estado local
    setUserEmail(null);
    setIsAdmin(false);
    
    // 4. Redirigir ANTES de disparar el evento storage
    window.location.href = '/#/login';
    
    // 5. Solo después de redirigir, disparar evento
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 100);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Forzar redirección incluso si hay error
    window.location.href = '/#/login';
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTopHelper />
      <Layout>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/request" element={<RequestForm />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/community" element={<Community />} />
          <Route path="/challenges" element={<Challenges />} />
          
          {/* Rutas de Autenticación */}
          <Route 
            path="/login" 
            element={
              userEmail ? (
                <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              userEmail ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            } 
          />
          
          {/* 🔒 Ruta Protegida - Dashboard Cliente */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireAuth={true}>
                <ClientDashboard clientEmail={userEmail || ''} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          {/* 🔒 Rutas Protegidas - Admin */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/accounting" 
            element={
              <ProtectedRoute requireAuth={true} requireAdmin={true}>
                <Accounting />
              </ProtectedRoute>
            } 
          />
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
