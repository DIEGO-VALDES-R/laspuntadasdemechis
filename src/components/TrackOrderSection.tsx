import React, { useState } from 'react';
import { db } from '../services/db';
import { Order } from '../types';
import { Search } from 'lucide-react';

const TrackOrderSection: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearchOrder = async () => {
    if (!orderNumber.trim()) return;
    
    setLoading(true);
    try {
      // Buscar el pedido por número
      const foundOrder = await db.getOrderByNumber(orderNumber);
      
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        alert('Pedido no encontrado');
      }
    } catch (error) {
      console.error('Error al buscar pedido:', error);
      alert('Error al buscar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Rastrea tu Pedido</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Ingresa el número de tu pedido"
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearchOrder}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {order && (
        <div className="border rounded-lg p-4">
          <h3 className="text-xl font-bold mb-4">Pedido #{order.numero_seguimiento}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Producto</p>
              <p className="font-medium">{order.nombre_producto}</p>
            </div>
            <div>
              <p className="text-gray-600">Descripción</p>
              <p className="font-medium">{order.descripcion || 'Sin descripción'}</p>
            </div>
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-medium">${order.total_final.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Pagado</p>
              <p className="font-medium">${order.monto_pagado.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Saldo Pendiente</p>
              <p className="font-medium text-red-600">${order.saldo_pendiente.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Estado</p>
              <p className="font-medium">{order.estado}</p>
            </div>
          </div>
          
          {order.saldo_pendiente > 0 && (
            <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Completar Pago
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackOrderSection;
