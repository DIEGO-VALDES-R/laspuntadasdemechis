import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Order, Client } from '../types';
import { TrendingUp, Gift, ShoppingBag, DollarSign, AlertTriangle, CheckCircle, Clock, Users, Copy, MessageCircle, X, ExternalLink, ArrowRight, Plus, Eye, Repeat, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientDashboardProps {
  clientEmail: string;
  onLogout: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientEmail, onLogout }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchClientData = async () => {
      if (!clientEmail) {
        console.log('⚠️ No hay clientEmail, saliendo...');
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Cargando pedidos para:', clientEmail);
        
        const fetchedOrders = await db.getOrdersByClientEmail(clientEmail);
        
        if (isMounted) {
          console.log('✅ Pedidos encontrados:', fetchedOrders.length);
          setOrders(fetchedOrders || []);
          
          const clientData = await db.getClientByEmail(clientEmail);
          setClientData(clientData);
        }
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClientData();

    return () => {
      isMounted = false;
    };
  }, [clientEmail]);

  const pendingOrders = orders.filter(o => o.saldo_pendiente > 0);
  const activeOrders = orders.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado');

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setPaymentMethod('');
  };

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleReorder = (order: Order) => {
    navigate('/request', { state: { reorderOrder: order } });
  };

  const updateOrderLocally = (orderId: string, isManual: boolean) => {
    setSimulatingPayment(true);
    setTimeout(() => {
      setSimulatingPayment(false);
      closeModals();
      alert("Comprobante enviado. Esperando verificación del admin.");
    }, 1500);
  };

  const handleModalBoldPayment = () => {
    if (selectedOrder) {
      window.open(`https://bold.co/payment?order=${selectedOrder.id}`, '_blank');
      closeModals();
      alert("Pago iniciado en Bold. El estado se actualizará cuando el administrador lo verifique.");
    }
  };

  const handleModalManualPayment = () => {
    if (!selectedOrder) return;
    const msg = `Hola, envío comprobante para completar el pago. Pedido: #${selectedOrder.numero_seguimiento} Saldo Pendiente: $${selectedOrder.saldo_pendiente.toLocaleString()}`;
    const phone = "573124915127";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    updateOrderLocally(selectedOrder.id, true);
  };

  // Referral Functions
  const handleCopyCode = () => {
    if (clientData?.codigo_referido) {
      navigator.clipboard.writeText(clientData.codigo_referido)
        .then(() => alert(`¡Código ${clientData.codigo_referido} copiado al portapapeles!`))
        .catch(() => alert("No se pudo copiar el código."));
    }
  };

  const handleShareWhatsApp = () => {
    if (clientData?.codigo_referido) {
      const text = `¡Hola! Te recomiendo *Puntadas de Mechis* para pedir tus amigurumis personalizados 🧶✨. \n\nUsa mi código de referido *${clientData.codigo_referido}* para recibir un descuento especial en tu primer pedido.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Header with Welcome and Logout */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hola, {clientData?.nombre_completo || clientEmail.split('@')[0]}
        </h1>
        <button 
          onClick={onLogout}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Benefits Summary */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-purple-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Gift className="text-pink-500" /> Tus Beneficios</h2>
            <span className="text-sm bg-white px-3 py-1 rounded-full border border-purple-100 text-purple-600 font-bold">
              Nivel {clientData?.nivel || 'Bronce'}
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">🛍️ Compras</p>
                <p className="text-2xl font-bold text-gray-900">{clientData?.compras_totales || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Descuento activo</p>
                <p className="text-2xl font-bold text-gray-900">{clientData?.descuento_activo || 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">👥 Referidos</p>
                <p className="text-2xl font-bold text-gray-900">{clientData?.cantidad_referidos || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Descuento por referidos</p>
                <p className="text-2xl font-bold text-gray-900">10%</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">💎 Ahorro total</p>
                <p className="text-xl font-bold text-green-600">${clientData?.ahorro_historico?.toLocaleString() || 0}</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progreso al siguiente nivel:</span>
                  <span className="font-bold">{clientData?.progreso_porcentaje || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gray-800 h-3 rounded-full" style={{ width: `${clientData?.progreso_porcentaje || 0}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  ({clientData?.compras_para_siguiente || 0} compras faltantes)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Section */}
      {pendingOrders.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="text-green-600"/> Pagos Pendientes
          </h2>
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border-l-4 border-yellow-400 shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-gray-900">
                    Pedido #{order.numero_seguimiento} - {order.nombre_producto}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm">
                    <div className="text-gray-500">
                      Total: <span className="text-gray-900 font-medium">${order.total_final.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-500">
                      Pagado: <span className="text-gray-900 font-medium">${order.monto_pagado.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 border-t border-gray-100 my-1 pt-1 flex justify-between items-center">
                      <span className="font-bold text-gray-800">SALDO:</span>
                      <span className="font-bold text-red-500 text-lg">${order.saldo_pendiente.toLocaleString()} ⚠️</span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>Estado: {order.estado}</span>
                    <span>Límite: Antes de entrega</span>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => openPaymentModal(order)} 
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition shadow-md flex items-center gap-2"
                  >
                    💳 Completar Pago
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Financial Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-yellow-600"/> Resumen Financiero
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="text-center pb-4 md:pb-0">
              <p className="text-gray-500 text-sm mb-1">Total invertido</p>
              <p className="text-2xl font-bold text-gray-900">${clientData?.total_invertido?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Pedidos completados: {clientData?.compras_totales || 0}</p>
            </div>
            <div className="text-center py-4 md:py-0">
              <p className="text-gray-500 text-sm mb-1">Promedio por pedido</p>
              <p className="text-2xl font-bold text-gray-900">
                ${clientData?.compras_totales ? 
                  (clientData.total_invertido / clientData.compras_totales).toLocaleString() : 0}
              </p>
            </div>
            <div className="text-center pt-4 md:pt-0">
              <p className="text-gray-500 text-sm mb-1">Ahorro por descuentos</p>
              <p className="text-2xl font-bold text-green-600">${clientData?.ahorro_descuentos?.toLocaleString() || 0}</p>
              <p className="text-xs text-green-600 mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full">
                {clientData?.porcentaje_ahorro || 0}% ahorro efectivo
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-600 text-sm">Saldos pendientes totales:</span>
            <span className="text-xl font-bold text-gray-900">${clientData?.saldos_pendientes?.toLocaleString() || 0}</span>
          </div>
        </div>
      </section>

      {/* My Orders */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-purple-600"/> Mis Pedidos
          </h2>
          <button 
            onClick={() => navigate('/request')} 
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm transform active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} /> Solicitar Nuevo Amigurumi
          </button>
        </div>
        <div className="space-y-6">
          {/* Active Orders First */}
          {activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">Pedido #{order.numero_seguimiento}</span>
                <div className="flex gap-2">
                  {order.guia_transportadora && (
                    <span className="text-xs px-2 py-1 rounded-full font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                      <Truck size={12}/> Enviado
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    order.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {order.estado}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      🧶 {order.nombre_producto}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.saldo_pendiente > 0 ? (
                        <span className="text-yellow-600 font-bold flex items-center gap-1">
                          <AlertTriangle size={14}/> Saldo: ${order.saldo_pendiente.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle size={14}/> Pagado Totalmente
                        </span>
                      )}
                    </div>
                    {order.guia_transportadora && (
                      <div className="mt-3 bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm flex items-center gap-2 max-w-md">
                        <Truck size={16}/>
                        <span className="font-bold">Guía de rastreo:</span>
                        {order.guia_transportadora}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openDetailModal(order)} 
                      className="text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Eye size={14}/> Ver
                    </button>
                    {order.saldo_pendiente > 0 && (
                      <button 
                        onClick={() => openPaymentModal(order)} 
                        className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700"
                      >
                        Completar Pago
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Completed Orders */}
          {orders.filter(o => o.estado === 'Entregado').map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 opacity-80 hover:opacity-100 transition">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">🧶 {order.nombre_producto}</h3>
                  <p className="text-xs text-gray-500">Entregado el {order.fecha_entrega}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">${order.total_final.toLocaleString()}</p>
                  <div className="flex gap-2 mt-1 justify-end">
                    <button 
                      onClick={() => handleReorder(order)} 
                      className="text-xs text-pink-600 cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <Repeat size={12}/> Reordenar
                    </button>
                    <button 
                      onClick={() => openDetailModal(order)} 
                      className="text-xs text-gray-500 cursor-pointer hover:underline flex items-center gap-1"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Referrals Detail */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="text-blue-500"/> Mis Referidos
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm font-bold text-blue-900">
                Tu código: <span className="text-lg font-mono ml-2">{clientData?.codigo_referido || 'N/A'}</span>
              </p>
              <p className="text-xs text-blue-700">Cada referido = 10% de descuento</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCopyCode} 
                className="bg-white text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 text-sm font-medium flex items-center gap-2 hover:bg-blue-100"
              >
                <Copy size={14}/> Copiar
              </button>
              <button 
                onClick={handleShareWhatsApp} 
                className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-600"
              >
                <MessageCircle size={14}/> WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Completar Pago</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            {simulatingPayment ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Procesando actualización de estado...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-1">Saldo Pendiente:</p>
                  <p className="text-3xl font-bold text-yellow-900">${selectedOrder.saldo_pendiente.toLocaleString()}</p>
                  <p className="text-xs text-yellow-700 mt-2">Pedido #{selectedOrder.numero_seguimiento}</p>
                </div>
                <h4 className="font-semibold mb-3 text-gray-700">Selecciona Método:</h4>
                <div className="space-y-3 mb-6">
                  <div 
                    onClick={() => setPaymentMethod('bold')} 
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
                      paymentMethod === 'bold' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">💳</span>
                    <div className="flex-grow">
                      <p className="font-bold text-sm text-gray-800">Bold</p>
                      <p className="text-xs text-gray-500">Pago automático</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Auto</span>
                    {paymentMethod === 'bold' && <CheckCircle size={18} className="text-pink-600"/>}
                  </div>
                  <div 
                    onClick={() => setPaymentMethod('manual')} 
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
                      paymentMethod === 'manual' ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">📱</span>
                    <div className="flex-grow">
                      <p className="font-bold text-sm text-gray-800">WhatsApp</p>
                      <p className="text-xs text-gray-500">Enviar comprobante manualmente</p>
                    </div>
                    {paymentMethod === 'manual' && <CheckCircle size={18} className="text-pink-600"/>}
                  </div>
                </div>
                {paymentMethod === 'bold' ? (
                  <button 
                    onClick={handleModalBoldPayment} 
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2"
                  >
                    <ExternalLink size={18}/> Ir a Pagar con Bold
                  </button>
                ) : paymentMethod ? (
                  <button 
                    onClick={handleModalManualPayment} 
                    className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 flex justify-center items-center gap-2"
                  >
                    <MessageCircle size={18}/> Enviar Comprobante
                  </button>
                ) : (
                  <button disabled className="w-full bg-gray-200 text-gray-400 py-3 rounded-xl font-bold">
                    Selecciona un método
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Detalles del Pedido</h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
           {/* Información del producto */}
<div className="mb-6">
  <h4 className="font-bold text-lg text-pink-600 mb-2">{selectedOrder.nombre_producto}</h4>
  <p className="text-sm text-gray-500 mb-4">{selectedOrder.descripcion}</p>
  {selectedOrder.guia_transportadora && (
    <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 mb-4">
      <Truck size={16}/> Envío: {selectedOrder.guia_transportadora}
    </div>
  )}
</div>

{/* Comparación de Imágenes */}
<div className="mb-6 bg-purple-50 p-4 rounded-xl">
  <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
    Tu Pedido
  </h5>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Imagen de Referencia */}
    <div>
      <p className="text-xs font-bold text-gray-600 mb-2">📸 Lo que pediste</p>
      <img 
        src={selectedOrder.imagen_url} 
        className="w-full h-48 rounded-lg object-cover border-2 border-gray-300 shadow-sm" 
        alt="Imagen de referencia"
      />
    </div>
    
    {/* Imagen Final */}
    <div>
      <p className="text-xs font-bold text-gray-600 mb-2">✨ Cómo quedó</p>
      {selectedOrder.final_image_url ? (
        <img 
          src={selectedOrder.final_image_url} 
          className="w-full h-48 rounded-lg object-cover border-2 border-green-400 shadow-sm" 
          alt="Producto final"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <p className="text-sm font-medium">En proceso</p>
          <p className="text-xs">Pronto verás tu amigurumi</p>
        </div>
      )}
    </div>
  </div>
</div>
            <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha Solicitud:</span>
                <span className="font-medium">{selectedOrder.fecha_solicitud}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{selectedOrder.estado}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold">${selectedOrder.total_final.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pagado:</span>
                <span className="font-bold text-green-600">${selectedOrder.monto_pagado.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-gray-800">Saldo Pendiente:</span>
                <span className="font-bold text-red-500">${selectedOrder.saldo_pendiente.toLocaleString()}</span>
              </div>
            </div>
            {selectedOrder.saldo_pendiente > 0 && (
              <button 
                onClick={() => { 
                  closeModals(); 
                  openPaymentModal(selectedOrder); 
                }} 
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 mt-6"
              >
                Pagar Saldo Pendiente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;