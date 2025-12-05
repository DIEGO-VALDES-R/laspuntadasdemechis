
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Order, Expense, ReturnRecord } from '../types';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  ArrowLeft, Download, Filter, Calendar, DollarSign, TrendingUp, TrendingDown, 
  AlertTriangle, Users, Package, FileText, ChevronRight, Plus, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ViewState = 'OVERVIEW' | 'INCOME' | 'EXPENSES' | 'RECEIVABLES' | 'RETURNS' | 'TOP_PRODUCTS' | 'TOP_CLIENTS';
type DateFilter = 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

const Accounting: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewState>('OVERVIEW');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  
  // Data - Initialize with empty arrays to prevent .filter errors on initial render
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);

  // Modal for adding Expense
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'materiales',
    amount: 0,
    description: '',
    provider: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch data asynchronously
      const [fetchedOrders, fetchedExpenses, fetchedReturns] = await Promise.all([
        db.getOrders(),
        db.getExpenses(),
        db.getReturns()
      ]);
      
      setOrders(fetchedOrders || []);
      setExpenses(fetchedExpenses || []);
      setReturns(fetchedReturns || []);
    } catch (error) {
      console.error("Error loading accounting data:", error);
      setOrders([]);
      setExpenses([]);
      setReturns([]);
    }
  };

  const handleExport = (data: any[], filename: string) => {
      if (!data || data.length === 0) {
          alert("No hay datos para exportar");
          return;
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map(obj => 
        Object.values(obj).map(val => 
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(",")
      );
      
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newExpense.description && newExpense.amount) {
          await db.addExpense({
              id: `ex-${Date.now()}`,
              ...newExpense as Expense
          });
          setIsExpenseModalOpen(false);
          loadData();
          setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'materiales', amount: 0, description: '', provider: ''});
      }
  };

  // --- HELPERS ---
  const filterByDate = (dateStr: string) => {
      if (dateFilter === 'ALL') return true;
      const date = new Date(dateStr);
      const now = new Date();
      if (dateFilter === 'WEEK') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= oneWeekAgo;
      }
      if (dateFilter === 'MONTH') {
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'YEAR') {
          return date.getFullYear() === now.getFullYear();
      }
      return true;
  };

  // --- VIEWS ---

  const Overview = () => {
      const income = orders.filter(o => o.estado !== 'Cancelado' && filterByDate(o.fecha_solicitud)).reduce((acc, o) => acc + o.monto_pagado, 0);
      const expenseTotal = expenses.filter(e => filterByDate(e.date)).reduce((acc, e) => acc + e.amount, 0);
      const receivables = orders.reduce((acc, o) => acc + o.saldo_pendiente, 0);
      const netProfit = income - expenseTotal;

      // Chart Data: Income vs Expenses by Month
      const chartData = orders.reduce((acc: any[], order) => {
          const month = order.fecha_solicitud.substring(0, 7); // YYYY-MM
          const existing = acc.find(i => i.name === month);
          if (existing) {
              existing.ingresos += order.monto_pagado;
          } else {
              acc.push({ name: month, ingresos: order.monto_pagado, egresos: 0 });
          }
          return acc;
      }, []);

      expenses.forEach(exp => {
          const month = exp.date.substring(0, 7);
          const existing = chartData.find(i => i.name === month);
          if (existing) {
              existing.egresos += exp.amount;
          } else {
              chartData.push({ name: month, ingresos: 0, egresos: exp.amount });
          }
      });

      // Sort by date
      chartData.sort((a, b) => a.name.localeCompare(b.name));

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div onClick={() => setCurrentView('INCOME')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-gray-500 text-sm font-medium">Ingresos Totales</p>
                              <h3 className="text-2xl font-bold text-gray-900 mt-1">${income.toLocaleString()}</h3>
                          </div>
                          <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20}/></div>
                      </div>
                  </div>
                  <div onClick={() => setCurrentView('EXPENSES')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                       <div className="flex justify-between items-start">
                          <div>
                              <p className="text-gray-500 text-sm font-medium">Egresos Totales</p>
                              <h3 className="text-2xl font-bold text-gray-900 mt-1">${expenseTotal.toLocaleString()}</h3>
                          </div>
                          <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendingDown size={20}/></div>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <div className="flex justify-between items-start">
                          <div>
                              <p className="text-gray-500 text-sm font-medium">Ganancia Neta</p>
                              <h3 className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>${netProfit.toLocaleString()}</h3>
                          </div>
                          <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><DollarSign size={20}/></div>
                      </div>
                  </div>
                  <div onClick={() => setCurrentView('RECEIVABLES')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
                       <div className="flex justify-between items-start">
                          <div>
                              <p className="text-gray-500 text-sm font-medium">Por Cobrar</p>
                              <h3 className="text-2xl font-bold text-orange-600 mt-1">${receivables.toLocaleString()}</h3>
                          </div>
                          <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><AlertTriangle size={20}/></div>
                      </div>
                  </div>
              </div>

              {/* Main Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-6">Balance General (Ingresos vs Egresos)</h3>
                  <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[4,4,0,0]} />
                              <Bar dataKey="egresos" name="Egresos" fill="#EF4444" radius={[4,4,0,0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => setCurrentView('TOP_PRODUCTS')} className="bg-white p-4 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded text-purple-600"><Package size={20}/></div>
                          <span className="font-bold text-gray-700">Top Productos</span>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-purple-600 transition"/>
                  </button>
                  <button onClick={() => setCurrentView('TOP_CLIENTS')} className="bg-white p-4 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded text-blue-600"><Users size={20}/></div>
                          <span className="font-bold text-gray-700">Mejores Clientes</span>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition"/>
                  </button>
                  <button onClick={() => setCurrentView('RETURNS')} className="bg-white p-4 rounded-xl border border-gray-100 hover:bg-gray-50 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                          <div className="bg-pink-100 p-2 rounded text-pink-600"><FileText size={20}/></div>
                          <span className="font-bold text-gray-700">Devoluciones</span>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-pink-600 transition"/>
                  </button>
              </div>
          </div>
      );
  };

  const IncomeView = () => {
      const filteredOrders = orders.filter(o => o.estado !== 'Cancelado' && filterByDate(o.fecha_solicitud));
      const totalIncome = filteredOrders.reduce((acc, o) => acc + o.monto_pagado, 0);

      // Line Chart Data
      const lineData = filteredOrders.reduce((acc: any[], order) => {
          const date = order.fecha_solicitud;
          const existing = acc.find(i => i.name === date);
          if (existing) existing.value += order.monto_pagado;
          else acc.push({ name: date, value: order.monto_pagado });
          return acc;
      }, []).sort((a,b) => a.name.localeCompare(b.name));

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="text-green-600"/> Ingresos</h2>
                   <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
              </div>

              {/* Charts */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4">Evolución de Ingresos</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lineData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip formatter={(val: number) => `$${val.toLocaleString()}`}/>
                              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="p-4">Fecha</th>
                              <th className="p-4">Cliente</th>
                              <th className="p-4">Producto</th>
                              <th className="p-4 text-right">Monto</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredOrders.map(order => (
                              <tr key={order.id} className="border-t hover:bg-gray-50">
                                  <td className="p-4">{order.fecha_solicitud}</td>
                                  <td className="p-4">{order.clientEmail}</td>
                                  <td className="p-4">{order.nombre_producto}</td>
                                  <td className="p-4 text-right font-bold text-gray-800">${order.monto_pagado.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              
              <div className="flex justify-end gap-2">
                  <button onClick={() => handleExport(filteredOrders, 'ingresos')} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
                      <Download size={16}/> Exportar Excel
                  </button>
                  <button onClick={handlePrint} className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                      <FileText size={16}/> Imprimir / PDF
                  </button>
              </div>
          </div>
      );
  };

  const ExpensesView = () => {
      const filteredExpenses = expenses.filter(e => filterByDate(e.date));
      const total = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

      // Pie Chart Data
      const pieData = filteredExpenses.reduce((acc: any[], exp) => {
          const existing = acc.find(i => i.name === exp.category);
          if (existing) existing.value += exp.amount;
          else acc.push({ name: exp.category, value: exp.amount });
          return acc;
      }, []);

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TrendingDown className="text-red-600"/> Egresos</h2>
                   <div className="flex items-center gap-4">
                       <div className="text-2xl font-bold text-red-600">${total.toLocaleString()}</div>
                       <button onClick={() => setIsExpenseModalOpen(true)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow"><Plus size={20}/></button>
                   </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <h3 className="font-bold mb-4">Distribución de Gastos</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                                      {pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <RechartsTooltip formatter={(val: number) => `$${val.toLocaleString()}`}/>
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* List */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="p-3">Fecha</th>
                                  <th className="p-3">Categoría</th>
                                  <th className="p-3">Descripción</th>
                                  <th className="p-3 text-right">Monto</th>
                              </tr>
                          </thead>
                          <tbody>
                              {filteredExpenses.map(exp => (
                                  <tr key={exp.id} className="border-t hover:bg-gray-50">
                                      <td className="p-3">{exp.date}</td>
                                      <td className="p-3 capitalize">{exp.category}</td>
                                      <td className="p-3">
                                          <div className="font-medium">{exp.description}</div>
                                          <div className="text-xs text-gray-500">{exp.provider}</div>
                                      </td>
                                      <td className="p-3 text-right font-bold">${exp.amount.toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
              <div className="flex justify-end gap-2">
                  <button onClick={() => handleExport(filteredExpenses, 'egresos')} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
                      <Download size={16}/> Exportar Excel
                  </button>
              </div>

              {/* Modal */}
              {isExpenseModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-lg">Registrar Gasto</h3>
                              <button onClick={() => setIsExpenseModalOpen(false)}><X size={24}/></button>
                          </div>
                          <form onSubmit={handleAddExpense} className="space-y-4">
                              <div><label className="text-sm font-bold">Fecha</label><input type="date" className="w-full border p-2 rounded" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} required/></div>
                              <div>
                                  <label className="text-sm font-bold">Categoría</label>
                                  <select className="w-full border p-2 rounded" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}>
                                      <option value="materiales">Materiales</option>
                                      <option value="empaques">Empaques</option>
                                      <option value="servicios">Servicios</option>
                                      <option value="otros">Otros</option>
                                  </select>
                              </div>
                              <div><label className="text-sm font-bold">Monto</label><input type="number" className="w-full border p-2 rounded" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} required/></div>
                              <div><label className="text-sm font-bold">Descripción</label><input type="text" className="w-full border p-2 rounded" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} required/></div>
                              <div><label className="text-sm font-bold">Proveedor</label><input type="text" className="w-full border p-2 rounded" value={newExpense.provider} onChange={e => setNewExpense({...newExpense, provider: e.target.value})} /></div>
                              <button type="submit" className="w-full bg-red-600 text-white py-2 rounded font-bold">Guardar</button>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const ReceivablesView = () => {
      const debtors = orders.filter(o => o.saldo_pendiente > 0);
      const totalDebt = debtors.reduce((acc, o) => acc + o.saldo_pendiente, 0);

      const barData = debtors.map(o => ({
          name: o.clientEmail?.split('@')[0] || 'Cliente',
          deuda: o.saldo_pendiente
      }));

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><AlertTriangle className="text-orange-600"/> Cuentas por Cobrar</h2>
                   <div className="text-2xl font-bold text-orange-600">${totalDebt.toLocaleString()}</div>
              </div>

              {/* Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4">Deuda por Cliente</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip formatter={(val: number) => `$${val.toLocaleString()}`}/>
                              <Bar dataKey="deuda" fill="#EA580C" radius={[4,4,0,0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="p-4">Cliente</th>
                              <th className="p-4">Pedido</th>
                              <th className="p-4">Fecha</th>
                              <th className="p-4">Total</th>
                              <th className="p-4 text-right">Saldo Pendiente</th>
                          </tr>
                      </thead>
                      <tbody>
                          {debtors.map(order => (
                              <tr key={order.id} className="border-t hover:bg-gray-50">
                                  <td className="p-4">{order.clientEmail}</td>
                                  <td className="p-4">#{order.numero_seguimiento}</td>
                                  <td className="p-4">{order.fecha_solicitud}</td>
                                  <td className="p-4">${order.total_final.toLocaleString()}</td>
                                  <td className="p-4 text-right font-bold text-orange-600">${order.saldo_pendiente.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="flex justify-end gap-2">
                  <button onClick={() => handleExport(debtors, 'por_cobrar')} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
                      <Download size={16}/> Exportar Excel
                  </button>
              </div>
          </div>
      );
  };

  const TopProductsView = () => {
      // Aggregate Products
      const productStats: Record<string, { count: number, revenue: number }> = {};
      
      orders.forEach(o => {
          if(!productStats[o.nombre_producto]) {
              productStats[o.nombre_producto] = { count: 0, revenue: 0 };
          }
          productStats[o.nombre_producto].count += 1;
          productStats[o.nombre_producto].revenue += o.total_final;
      });

      const sortedProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 10);

      return (
          <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-purple-600"/> Amigurumis Más Vendidos</h2>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4">Top 10 Productos</h3>
                  <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={sortedProducts}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                              <RechartsTooltip />
                              <Bar dataKey="count" name="Cantidad" fill="#8B5CF6" radius={[0,4,4,0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="p-4">Producto</th>
                              <th className="p-4 text-center">Unidades Vendidas</th>
                              <th className="p-4 text-right">Ingresos Generados</th>
                          </tr>
                      </thead>
                      <tbody>
                          {sortedProducts.map((p, i) => (
                              <tr key={i} className="border-t hover:bg-gray-50">
                                  <td className="p-4 font-bold">{p.name}</td>
                                  <td className="p-4 text-center">{p.count}</td>
                                  <td className="p-4 text-right">${p.revenue.toLocaleString()}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="flex justify-end gap-2">
                  <button onClick={() => handleExport(sortedProducts, 'top_productos')} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
                      <Download size={16}/> Exportar Excel
                  </button>
              </div>
          </div>
      );
  };

  const renderContent = () => {
      switch(currentView) {
          case 'OVERVIEW': return <Overview />;
          case 'INCOME': return <IncomeView />;
          case 'EXPENSES': return <ExpensesView />;
          case 'RECEIVABLES': return <ReceivablesView />;
          case 'RETURNS': return (
              <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">Devoluciones</h2>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="p-3">Fecha</th>
                                  <th className="p-3">Cliente</th>
                                  <th className="p-3">Motivo</th>
                                  <th className="p-3">Estado</th>
                                  <th className="p-3 text-right">Monto</th>
                              </tr>
                          </thead>
                          <tbody>
                              {returns.map(r => (
                                  <tr key={r.id} className="border-t">
                                      <td className="p-3">{r.date}</td>
                                      <td className="p-3">{r.clientName}</td>
                                      <td className="p-3">{r.reason}</td>
                                      <td className="p-3">{r.status}</td>
                                      <td className="p-3 text-right font-bold text-red-500">${r.amount.toLocaleString()}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          );
          case 'TOP_CLIENTS': return (
              <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">Mejores Clientes</h2>
                  {/* Reuse orders logic to aggregate by clientEmail, similar to Top Products */}
                  <div className="p-6 bg-white rounded-xl shadow-sm text-center text-gray-500">
                      Funcionalidad de listado de clientes por volumen de compra disponible pronto.
                  </div>
              </div>
          );
          case 'TOP_PRODUCTS': return <TopProductsView />;
          default: return <Overview />;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Header */}
       <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
           <div className="flex items-center gap-4">
    {currentView !== 'OVERVIEW' ? (
        <button onClick={() => setCurrentView('OVERVIEW')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20}/>
        </button>
    ) : (
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20}/>
        </button>
    )}
    <h1 className="text-xl font-bold text-gray-800">Módulo Contable</h1>
</div>
           <div className="flex gap-2">
               <select 
                className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
               >
                   <option value="ALL">Todo el Historial</option>
                   <option value="WEEK">Última Semana</option>
                   <option value="MONTH">Este Mes</option>
                   <option value="YEAR">Este Año</option>
               </select>
           </div>
       </header>

       <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
           {renderContent()}
       </main>
    </div>
  );
};

export default Accounting;
