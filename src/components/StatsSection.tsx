import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { Package, Users, Star, Calendar } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface StatData {
  amigurumi_count: number;
  client_count: number;
  rating: number;
  years_experience: number;
}

const StatsSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  // Valores iniciales de seguridad para evitar que la página se rompa
  const [statsData, setStatsData] = useState<StatData>({
    amigurumi_count: 0,
    client_count: 0,
    rating: 0,
    years_experience: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('site_stats')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Error fetching stats:', error);
          // Si hay error, mantenemos los valores en 0 o podrías poner unos por defecto
          return;
        }

        if (data) {
          setStatsData({
            amigurumi_count: data.amigurumi_count || 0,
            client_count: data.client_count || 0,
            rating: data.rating || 0,
            years_experience: data.years_experience || 0
          });
        }
      } catch (err) {
        console.error('Error crítico en StatsSection:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Definimos los items de estadísticas asegurándonos de que statsData exista
  const stats = [
    { 
      icon: <Package size={40} />, 
      number: statsData?.amigurumi_count || 0, 
      suffix: '+', 
      label: 'Amigurumis creados', 
      color: 'text-pink-600' 
    },
    { 
      icon: <Users size={40} />, 
      number: statsData?.client_count || 0, 
      suffix: '+', 
      label: 'Clientes felices', 
      color: 'text-purple-600' 
    },
    { 
      icon: <Star size={40} />, 
      number: statsData?.rating || 0, 
      suffix: '', 
      label: 'Rating promedio ⭐', 
      color: 'text-yellow-600', 
      decimals: 1 
    },
    { 
      icon: <Calendar size={40} />, 
      number: statsData?.years_experience || 0, 
      suffix: '', 
      label: 'Años de experiencia', 
      color: 'text-blue-600' 
    },
  ];

  return (
    <section ref={ref} className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Nuestro Impacto</h2>
          <p className="text-gray-600 mt-2">Números que hablan por nosotros</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`${stat.color} mb-4 flex justify-center`}>
                {stat.icon}
              </div>
              <p className="text-4xl font-bold text-gray-900">
                {inView && (
                  <CountUp
                    end={stat.number}
                    duration={2.5}
                    decimals={stat.decimals || 0}
                    suffix={stat.suffix}
                  />
                )}
              </p>
              <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
