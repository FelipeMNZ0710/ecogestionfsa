
import React, { useState, useEffect } from 'react';
import type { NewsArticle, ContentBlock } from '../types';

interface NewsDetailModalProps {
    article: NewsArticle;
    onClose: () => void;
}

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ article, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        if (isExiting) return;
        setIsExiting(true);
        setTimeout(onClose, 300); // Match animation duration
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    
    const renderContentBlock = (block: ContentBlock, index: number) => {
        switch (block.type) {
            case 'text':
                return <p key={index}>{block.text}</p>;
            case 'list':
                return <ul key={index} className="list-disc pl-5 space-y-2">
                    {block.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>;
            case 'image':
                 const src = block.base64Data || block.imageUrl;
                 if (!src) return null;
                 return <img key={index} src={src} alt={`Imagen de la noticia ${index}`} className="my-4 rounded-lg w-full" />;
            default:
                return null;
        }
    };

    const formattedDate = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(`${article.date}T00:00:00`));
    
    return (
        <div className={`news-detail-modal-backdrop ${isExiting ? 'exiting' : ''}`} onClick={handleClose}>
            <div className={`news-detail-content ${isExiting ? 'exiting' : ''}`} onClick={e => e.stopPropagation()}>
                <header className="relative">
                    <img src={article.image} alt={article.title} className="w-full h-64 object-cover rounded-t-lg" />
                    <button onClick={handleClose} className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-1.5 hover:bg-black/75 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-3xl mx-auto">
                        <span className="text-sm font-semibold bg-primary text-white px-3 py-1 rounded-full">{article.category}</span>
                        <h1 className="text-3xl md:text-4xl font-bold font-display text-text-main mt-4">{article.title}</h1>
                        <p className="text-sm text-text-secondary mt-2 mb-6">{formattedDate}</p>
                        
                        <div className="prose-custom">
                            {article.content.map(renderContentBlock)}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                            <span className="font-semibold text-text-secondary">Compartir:</span>
                            <div className="flex gap-2">
                                <a href="#" className="social-share-btn"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.11 4.91A9.81 9.81 0 0 0 12.008.02C6.077.02 1.252 4.92 1.252 11.12c0 1.99.51 3.86 1.45 5.54L1.2 22.99l6.53-1.74c1.61.88 3.39 1.36 5.26 1.36 5.93 0 10.75-4.9 10.75-11.11a9.78 9.78 0 0 0-5.63-9.58zM12 20.45c-1.73 0-3.39-.45-4.83-1.25l-.35-.2-3.58.95.97-3.48-.22-.37c-.85-1.48-1.3-3.15-1.3-4.94 0-5.18 4.11-9.4 9.17-9.4s9.17 4.22 9.17 9.4c0 5.18-4.1 9.4-9.17 9.4zm5.5-7.3c-.28-.14-1.63-.8-1.88-.89-.25-.09-.43-.14-.61.14-.18.28-.71.89-.87 1.08-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.25-1.38-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.12-.68.12-.12.28-.32.41-.48.14-.17.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.61-1.45-.83-1.98-.23-.53-.47-.45-.65-.45h-.58c-.18 0-.47.07-.7.35-.23.28-.87.84-.87 2.05 0 1.21.89 2.37 1.01 2.55.12.18 1.75 2.63 4.24 3.73 2.49 1.1 2.49.73 2.93.7.44-.02 1.63-.67 1.86-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.2-.53-.34z"/></svg></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetailModal;
