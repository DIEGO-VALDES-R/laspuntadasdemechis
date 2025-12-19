import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Star } from 'lucide-react';
import { db } from '../services/db';

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  image_url?: string;
  is_active?: boolean;
  display_order?: number;
}

interface TestimonialsCarouselProps {
  title?: string;
  subtitle?: string;
}

const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({ 
  title = 'Lo Que Dicen Nuestros Clientes',
  subtitle = 'Más de 450 clientes satisfechos'
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const data = await db.getActiveTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">Cargando testimonios...</p>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // No mostrar la sección si no hay testimonios
  }

  const settings = {
    dots: true,
    infinite: testimonials.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, testimonials.length),
    slidesToScroll: 1,
    autoplay: testimonials.length > 3,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: Math.min(2, testimonials.length) }
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 }
      }
    ]
  };

  return (
    <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>
        <Slider {...settings}>
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="px-3">
              <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
                <div className="flex items-center gap-4 mb-4">
                  {testimonial.image_url ? (
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="#FCD34D" stroke="#FCD34D" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.comment}"</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;