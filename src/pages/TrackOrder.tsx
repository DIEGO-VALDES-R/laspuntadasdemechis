import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Order } from '../types';
import { Package, Search, AlertCircle, CheckCircle, Clock, ArrowLeft, Truck, DollarSign } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const TrackOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // ✅ Auto-buscar si viene número en la URL
  useEffect(() => {
    const orderFromUrl = searchParams.get('order');
    if (orderFromUrl) {
      setOrderNumber(orderFromUrl);
      // Auto-buscar el pedido
      searchOrder(orderFromUrl);
    }
  }, [searchParams]);

  const searchOrder = async (number: string) => {
    if (!number.trim()) {
      setError('Por favor ingresa el número de pedido');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const foundOrder = await db.getOrderByNumber(number.trim());
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('No se encontró un pedido con ese número. Verifica el número e intenta nuevamente.');
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    searchOrder(orderNumber);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'En proceso': 'bg-blue-100 text-blue-800 border-blue-300',
      'Listo para enviar': 'bg-purple-100 text-purple-800 border-purple-300',
      'Enviado': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'Entregado': 'bg-green-100 text-green-800 border-green-300',
      'Cancelado': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return <Clock className="w-5 h-5" />;
      case 'En proceso':
        return <Package className="w-5 h-5" />;
      case 'Listo para enviar':
      case 'Enviado':
        return <Truck className="w-5 h-5" />;
      case 'Entregado':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Volver al inicio
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Rastrear Pedido
          </h1>
          <p className="text-gray-600">
            Ingresa tu número de seguimiento para ver el estado de tu pedido
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Pedido
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ej: 793760"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Buscar Pedido
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Details */}
        {searched && order && (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getStatusColor(order.estado)}`}>
                {getStatusIcon(order.estado)}
                <span className="font-semibold">{order.estado}</span>
              </div>
              <span className="text-sm text-gray-500">#{order.numero_seguimiento}</span>
            </div>

            {/* Product Images - Comparison */}
<div className="bg-purple-50 p-4 rounded-xl">
  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
    Tu Pedido
  </h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Imagen de Referencia */}
    {order.imagen_url && (
      <div>
        <p className="text-xs font-bold text-gray-600 mb-2">📸 Lo que pediste</p>
        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-300 shadow-sm">
          <img
            src={order.imagen_url}
            alt={order.nombre_producto}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )}
    
    {/* Imagen Final */}
    <div>
      <p className="text-xs font-bold text-gray-600 mb-2">✨ Cómo quedó</p>
      {order.final_image_url ? (
        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-green-400 shadow-sm">
          <img
            src={order.final_image_url}
            alt={`${order.nombre_producto} - Final`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <p className="text-sm font-medium">En proceso</p>
          <p className="text-xs">Pronto verás tu amigurumi terminado</p>
        </div>
      )}
    </div>
  </div>
</div>

            {/* Product Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {order.nombre_producto}
              </h2>
              {order.descripcion && (
                <p className="text-gray-600">{order.descripcion}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Fecha de Solicitud</p>
                <p className="font-semibold text-gray-800">
                  {new Date(order.fecha_solicitud).toLocaleDateString('es-CO')}
                </p>
              </div>
              {order.fecha_entrega && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Fecha de Entrega</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(order.fecha_entrega).toLocaleDateString('es-CO')}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="text-green-600" size={24} />
                <h3 className="text-lg font-semibold text-gray-800">Información de Pago</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">${order.total_final.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pagado:</span>
                  <span className="font-semibold text-green-600">${order.monto_pagado.toLocaleString('es-CO')}</span>
                </div>
                {order.saldo_pendiente > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Saldo Pendiente:</span>
                    <span className="font-semibold text-orange-600">${order.saldo_pendiente.toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Number */}
            {order.guia_transportadora && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="text-blue-600" size={20} />
                  <span className="font-semibold text-blue-800">Guía de Transporte</span>
                </div>
                <p className="text-blue-900 font-mono text-lg">{order.guia_transportadora}</p>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                💜 Si tienes preguntas sobre tu pedido, contáctanos por WhatsApp al +57 312 491 5127
              </p>
            </div>
          </div>
        )}

        {/* No results message */}
        {searched && !order && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontró el pedido
            </h3>
            <p className="text-gray-500">
              Verifica el número de pedido e intenta nuevamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;