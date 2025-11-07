import React, { useState, useEffect, useCallback } from 'react';
import { testimonialsData } from '../data/testimonialsData';

const TestimonialsCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % testimonialsData.length);
    }, []);

    const prevSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex - 1 + testimonialsData.length) % testimonialsData.length);
    };

    useEffect(() => {
        if (!isHovering) {
            const slideInterval = setInterval(nextSlide, 5000);
            return () => clearInterval(slideInterval);
        }
    }, [nextSlide, isHovering]);

    return (
        <section className="py-20 bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="mb-12 fade-in-section">
                    <h2 className="text-4xl font-display text-text-main">Lo que dice nuestra comunidad</h2>
                    <p className="mt-4 text-lg text-text-secondary">Opiniones de personas que ya son parte del cambio.</p>
                </div>

                <div 
                    className="relative overflow-hidden testimonial-carousel"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <div className="testimonial-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {testimonialsData.map((testimonial, index) => (
                            <div key={index} className="testimonial-slide">
                                <div className="modern-card p-8 md:p-12 h-full flex flex-col justify-center">
                                    <svg className="w-16 h-16 text-primary/30 mx-auto mb-4" viewBox="0 0 448 512" fill="currentColor"><path d="M0 216C0 149.7 53.7 96 120 96h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V216zm256 0c0-66.3 53.7-120 120-120h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H320c-35.3 0-64-28.7-64-64V216z"/></svg>
                                    <p className="text-lg md:text-xl text-text-main italic mb-6">"{testimonial.quote}"</p>
                                    <div className="flex items-center justify-center">
                                        <div>
                                            <p className="font-bold text-text-main">{testimonial.name}</p>
                                            <p className="text-sm text-text-secondary">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={prevSlide} className="carousel-arrow left-0" aria-label="Anterior testimonio">
                        &lt;
                    </button>
                    <button onClick={nextSlide} className="carousel-arrow right-0" aria-label="Siguiente testimonio">
                        &gt;
                    </button>

                    <div className="carousel-dots">
                        {testimonialsData.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`dot ${currentIndex === index ? 'active' : ''}`}
                                aria-label={`Ir al testimonio ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialsCarousel;