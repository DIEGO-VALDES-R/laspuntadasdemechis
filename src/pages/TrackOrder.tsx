import React, { useState } from 'react';
import { db } from '../services/db';
import { Order } from '../types';
import { Package, Search, AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrackOrder: React.FC = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !email.trim()) {
      setError('Por favor ingresa el número de pedido y tu email');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearched(true);
    
    try {
      // 🔒 SEGURO: Solo busca el pedido si coincide el número Y el email
      const foundOrder = await db.getOrderByNumberAndEmail(orderNumber.trim(), email.trim());
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('No se encontró un pedido con ese número y email. Verifica los datos e intenta nuevamente.');
        setOrder(null);
      }
    } catch (err) {
      console.error('Error searching for order:', err);
      setError('Ocurrió un error al buscar tu pedido. Por favor intenta más tarde.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'En proceso': 'bg-blue-100 text-blue-800',
      'Enviado': 'bg-purple-100 text-purple-800',
      'Entregado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregado':
        return <CheckCircle className="w-5 h-5" />;
      case 'En proceso':
      case 'Enviado':
        return <Clock className="w-5 h-5" />;
      case 'Pendiente':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Rastrear tu Pedido</h1>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pedido
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Ej: PM-12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email del Pedido
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Buscando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" />
                  Buscar Pedido
                </span>
              )}
            </button>
          </form>
        </div>
        
        {error && searched && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {order && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Detalles del Pedido</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.estado)}`}>
                  {getStatusIcon(order.estado)}
                  {order.estado}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{order.nombre_producto}</h3>
                  <p className="text-gray-600 mb-4">{order.descripcion || 'Sin descripción'}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Número de seguimiento:</span>
                      <span className="font-medium">{order.numero_seguimiento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha del pedido:</span>
                      <span className="font-medium">{new Date(order.fecha_pedido).toLocaleDateString('es-CO')}</span>
                    </div>
                    {order.fecha_entrega && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha de entrega:</span>
                        <span className="font-medium">{new Date(order.fecha_entrega).toLocaleDateString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Resumen del Pago</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">${order.total_final.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pagado:</span>
                        <span className="font-medium text-green-600">${order.monto_pagado.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-medium text-gray-900">Saldo pendiente:</span>
                        <span className={`font-bold ${order.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${order.saldo_pendiente.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {order.guia_transportadora && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-blue-900">Guía de envío</h4>
                      <p className="text-blue-800">{order.guia_transportadora}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;