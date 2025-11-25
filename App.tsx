

import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import RequestForm from './pages/RequestForm';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Community from './pages/Community';
import Challenges from './pages/Challenges';
import Accounting from './pages/Accounting'; // New Import

// Helper component to scroll to top on route change
const ScrollToTopHelper = () => {
    const { pathname } = useLocation();
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTopHelper />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/request" element={<RequestForm />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/accounting" element={<Accounting />} /> {/* New Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/community" element={<Community />} />
          <Route path="/challenges" element={<Challenges />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;