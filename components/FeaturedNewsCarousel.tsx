import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { NewsArticle } from '../types';

interface FeaturedNewsCarouselProps {
    articles: NewsArticle[];
    onArticleClick: (article: NewsArticle) => void;
    onEdit: (article: NewsArticle) => void;
    onDelete: (articleId: number) => void;
    isAdminMode: boolean;
}

const FeaturedNewsCarousel: React.FC<FeaturedNewsCarouselProps> = ({ articles, onArticleClick, onEdit, onDelete, isAdminMode }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % articles.length);
    }, [articles.length]);

    const prevSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex - 1 + articles.length) % articles.length);
    };

    useEffect(() => {
        if (!isHovering) {
            const slideInterval = setInterval(nextSlide, 7000); // A bit longer for news
            return () => clearInterval(slideInterval);
        }
    }, [nextSlide, isHovering]);
    
    const getFormattedDate = (date: string) => {
        if (!date) return '';
        try {
            const dateObj = new Date(`${date}T00:00:00`);
            if (isNaN(dateObj.getTime())) return '';
            return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
        } catch (e) {
            return '';
        }
    };

    return (
        <div 
            className="relative overflow-hidden rounded-xl modern-card"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="testimonial-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {articles.map((article) => (
                    <div key={article.id} className="testimonial-slide w-full cursor-pointer" onClick={() => onArticleClick(article)}>
                        <div className="relative">
                             {isAdminMode && (
                                <div className="card-admin-controls" style={{zIndex: 20}}>
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(article); }} className="admin-action-button" title="Editar noticia"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(article.id); }} className="admin-action-button delete" title="Eliminar noticia"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            )}
                            <img src={article.image} alt={article.title} className="w-full h-[50vh] object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-semibold bg-primary px-3 py-1 rounded-full">{article.category}</span>
                                    <span className="text-sm text-slate-300">{getFormattedDate(article.date)}</span>
                                </div>
                                <h2 className="text-3xl lg:text-5xl font-bold font-display mt-4 leading-tight">{article.title}</h2>
                                <p className="mt-2 text-slate-300 max-w-2xl hidden md:block">{article.excerpt}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <button onClick={prevSlide} className="carousel-arrow left-0" aria-label="Anterior noticia">
                &lt;
            </button>
            <button onClick={nextSlide} className="carousel-arrow right-0" aria-label="Siguiente noticia">
                &gt;
            </button>

            <div className="carousel-dots" style={{ bottom: '20px' }}>
                {articles.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`dot ${currentIndex === index ? 'active' : ''}`}
                        aria-label={`Ir a la noticia ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default FeaturedNewsCarousel;