import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Challenge } from '../types';
import { Trophy, Calendar, Users, Gift, CheckCircle, ArrowRight, Clock, Loader } from 'lucide-react';

const Challenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        const data = await db.getChallenges();
        setChallenges(data);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const pastChallenges = challenges.filter(c => c.status === 'completed');
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming' || c.status === 'starting');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-pink-500" size={40}/></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
       {/* Header */}
       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Trophy size={32} />
                </div>
                <h1 className="text-4xl font-bold">Retos Creativos</h1>
            </div>
            <p className="text-lg opacity-90 max-w-2xl">Participa en nuestros desafíos mensuales, mejora tus habilidades y gana premios exclusivos.</p>
          </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 -mt-8">
           
           {/* Active Challenges */}
           <section className="mb-12">
               <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                   <span className="w-3 h-8 bg-green-500 rounded-full block"></span>
                   Disponibles Ahora
               </h2>
               
               {activeChallenges.length === 0 ? (
                 <p className="text-gray-500">No hay retos activos en este momento.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {activeChallenges.map(ch => (
                       <div key={ch.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row h-full transform transition hover:-translate-y-1">
                           <div className="md:w-2/5 relative">
                               <img src={ch.imageUrl} alt={ch.title} className="w-full h-full object-cover min-h-[200px]"/>
                               <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                   En Proceso
                               </div>
                           </div>
                           <div className="p-6 md:w-3/5 flex flex-col justify-between">
                               <div>
                                   <div className="flex justify-between items-start mb-2">
                                       <h3 className="text-2xl font-bold text-gray-900">{ch.title}</h3>
                                       <span className="text-xs font-bold border border-gray-200 px-2 py-1 rounded text-gray-500">{ch.difficulty}</span>
                                   </div>
                                   <p className="text-gray-600 mb-4">{ch.description}</p>
                                   
                                   <div className="grid grid-cols-2 gap-4 mb-6">
                                       <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar size={16} className="text-purple-500"/>
                                            <span>Hasta: {new Date(ch.endDate).toLocaleDateString()}</span>
                                       </div>
                                       <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users size={16} className="text-blue-500"/>
                                            <span>{ch.participants} Participantes</span>
                                       </div>
                                   </div>
                               </div>

                               <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-4">
                                   <div className="flex items-center gap-2 text-purple-700 font-bold mb-1">
                                       <Gift size={18}/> Recompensa:
                                   </div>
                                   <p className="text-sm text-purple-900">{ch.reward}</p>
                               </div>

                               <button className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2">
                                   Unirse al Reto <ArrowRight size={18}/>
                               </button>
                           </div>
                       </div>
                   ))}
                 </div>
               )}
           </section>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* Upcoming */}
               <section>
                   <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                       <Clock size={24} className="text-blue-500"/> Próximamente
                   </h2>
                   <div className="space-y-4">
                       {upcomingChallenges.map(ch => (
                           <div key={ch.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 opacity-80">
                               <img src={ch.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-200" alt="thumb"/>
                               <div>
                                   <h4 className="font-bold text-gray-900">{ch.title}</h4>
                                   <p className="text-sm text-gray-500 mb-2">Inicia: {new Date(ch.startDate).toLocaleDateString()}</p>
                                   <span className={`text-xs px-2 py-1 rounded font-bold ${ch.status === 'starting' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                       {ch.status === 'starting' ? 'Por Iniciar' : 'Próximamente'}
                                   </span>
                               </div>
                           </div>
                       ))}
                       {upcomingChallenges.length === 0 && <p className="text-gray-400">No hay retos próximos.</p>}
                   </div>
               </section>

               {/* Past Winners */}
               <section>
                   <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                       <CheckCircle size={24} className="text-gray-400"/> Retos Finalizados
                   </h2>
                   <div className="space-y-4">
                       {pastChallenges.map(ch => (
                           <div key={ch.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 opacity-60 hover:opacity-100 transition">
                               <img src={ch.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-200 grayscale" alt="thumb"/>
                               <div>
                                   <h4 className="font-bold text-gray-900">{ch.title}</h4>
                                   <p className="text-sm text-gray-500 mb-2">Finalizó: {new Date(ch.endDate).toLocaleDateString()}</p>
                                   <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                                       <Trophy size={12}/> Ganadores anunciados
                                   </div>
                               </div>
                           </div>
                       ))}
                       {pastChallenges.length === 0 && <p className="text-gray-400">No hay retos finalizados.</p>}
                   </div>
               </section>
           </div>
       </div>
    </div>
  );
};

export default Challenges;
