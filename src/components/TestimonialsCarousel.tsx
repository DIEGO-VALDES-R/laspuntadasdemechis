import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  imageUrl?: string;
}

interface TestimonialsCarouselProps {
  title?: string;
  subtitle?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'María González',
    rating: 5,
    comment: '¡El amigurumi de mi perro quedó idéntico! Súper recomendado, el detalle y calidad es increíble.',
    imageUrl: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: '2',
    name: 'Carlos Ramírez',
    rating: 5,
    comment: 'Pedí un personaje de anime y quedó perfecto. La atención fue excelente y la entrega rápida.',
    imageUrl: 'https://i.pravatar.cc/150?img=2'
  },
  {
    id: '3',
    name: 'Ana Martínez',
    rating: 5,
    comment: 'El mejor regalo que pude dar. Mi hija está feliz con su unicornio personalizado.',
    imageUrl: 'https://i.pravatar.cc/150?img=3'
  },
];

const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({ 
  title = 'Lo Que Dicen Nuestros Clientes',
  subtitle = 'Más de 450 clientes satisfechos'
}) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 }
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
                  <img
                    src={testimonial.imageUrl}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
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