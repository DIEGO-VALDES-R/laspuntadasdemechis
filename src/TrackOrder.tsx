import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Order, Client } from '../types';
import { Search, Truck, Heart, Users, DollarSign, ShoppingBag } from 'lucide-react';

const TrackOrder: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  const handleSearchOrder = async () => {
    if (!orderNumber.trim()) return;
    
    setLoading(true);
    try {
      // Buscar el pedido por número
      const foundOrder = await db.getOrderByNumber(orderNumber);
      
      if (foundOrder) {
        setOrder(foundOrder);
        
        // Verificar si el email del pedido corresponde a un usuario registrado
        const registeredClient = await db.getClientByEmail(foundOrder.clientEmail);
        
        if (registeredClient) {
          setClient(registeredClient);
          setIsRegisteredUser(true);
          
          // Cargar todos los pedidos del usuario
          const allUserOrders = await db.getOrdersByEmail(registeredClient.email);
          setUserOrders(allUserOrders);
          
          // Cargar referidos del usuario
          const userReferrals = await db.getReferralsByReferrerId(registeredClient.id);
          setReferrals(userReferrals);
        } else {
          setIsRegisteredUser(false);
          setClient(null);
          setUserOrders([foundOrder]);
          setReferrals([]);
        }
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
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Rastrea tu Pedido</h1>
      
      {/* Formulario de búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
      </div>

      {order && (
        <>
          {/* Información del pedido específico */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Pedido #{order.numero_seguimiento}</h2>
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

          {/* Solo mostrar información completa si es un usuario registrado */}
          {isRegisteredUser && client && (
            <>
              {/* Beneficios del usuario */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Tus Beneficios</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Nivel</p>
                    <p className="font-bold text-lg">{client.nivel}</p>
                    <div className="flex justify-center mt-2">⭐⭐⭐</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Descuento activo</p>
                    <p className="font-bold text-lg">{client.descuento_activo}%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Descuento por referidos</p>
                    <p className="font-bold text-lg">10%</p>
                  </div>
                </div>
              </div>

              {/* Todos los pedidos del usuario */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Mis Pedidos</h2>
                <div className="space-y-4">
                  {userOrders.map((userOrder) => (
                    <div key={userOrder.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">Pedido #{userOrder.numero_seguimiento}</h3>
                          <p>{userOrder.nombre_producto}</p>
                          <p className="text-sm text-gray-600">Estado: {userOrder.estado}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${userOrder.total_final.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Saldo: ${userOrder.saldo_pendiente.toLocaleString()}</p>
                          <button className="mt-2 px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            Ver
                          </button>
                          {userOrder.saldo_pendiente > 0 && (
                            <button className="mt-2 ml-2 px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                              Completar Pago
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Referidos del usuario */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Mis Referidos</h2>
                {referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">{referral.name}</h3>
                          <p className="text-sm text-gray-600">{referral.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{referral.purchases} compras</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            referral.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {referral.status === 'active' ? '✅ Activo' : '⏳ Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No tienes referidos aún</p>
                )}
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="font-bold mb-2">Tu código de referido:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="bg-white px-3 py-1 rounded border">{client.codigo_referido || 'REF-' + client.id}</code>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Copiar
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Cada referido = 10% de descuento</p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TrackOrder;