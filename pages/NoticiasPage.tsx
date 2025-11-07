import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { User, NewsArticle, ContentBlock } from '../types';
import NewsDetailModal from '../components/NewsDetailModal';
import FeaturedNewsCarousel from '../components/FeaturedNewsCarousel';

const NewsCard: React.FC<{ 
    article: NewsArticle; 
    isAdminMode: boolean;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ article, isAdminMode, onClick, onEdit, onDelete }) => {
    const { image, category, title, date, excerpt } = article;

    const formattedDate = useMemo(() => {
        const dateObj = new Date(`${date}T00:00:00`);
        return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);
    }, [date]);

    return (
        <div className="modern-card group fade-in-section relative flex flex-col h-full cursor-pointer" onClick={onClick}>
            {isAdminMode && (
                <div className="card-admin-controls">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="admin-action-button" title="Editar noticia"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="admin-action-button delete" title="Eliminar noticia"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            )}
            <div className="overflow-hidden rounded-t-lg">
                <img src={image} alt={title} className="w-full h-48 object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"/>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-center text-xs text-text-secondary mb-2">
                    <span className="font-bold uppercase text-primary tracking-wider">{category}</span>
                    <span>{formattedDate}</span>
                </div>
                <h3 className="font-bold text-lg text-text-main mb-3 group-hover:text-primary transition-colors flex-grow">{title}</h3>
                <p className="text-text-secondary text-sm mb-4 leading-relaxed">{excerpt}</p>
                <span className="font-semibold text-sm text-primary mt-auto self-start group-hover:underline">Leer más &rarr;</span>
            </div>
        </div>
    );
};


const SidebarWidget: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div className="modern-card p-4 fade-in-section">
        <h3 className="font-bold font-display text-lg text-text-main border-b-2 border-white/10 pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

const newsCategories = [
    'Iniciativas Locales',
    'Consejos',
    'Eventos',
    'Guías',
    'Novedades',
    'Tecnología',
    'Comunidad',
    'Opinión'
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const NewsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (article: Omit<NewsArticle, 'id' | 'date'> & { id?: number }) => void;
    article: NewsArticle | null;
}> = ({ isOpen, onClose, onSave, article }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(newsCategories[0]);
    const [image, setImage] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState<ContentBlock[]>([]);
    const [featured, setFeatured] = useState(false);

    useEffect(() => {
        if (article) {
            setTitle(article.title);
            setCategory(article.category);
            setImage(article.image);
            setExcerpt(article.excerpt);
            setContent(article.content.map(b => ({...b, id: b.id || String(Date.now() + Math.random())})));
            setFeatured(article.featured);
        } else {
            setTitle('');
            setCategory(newsCategories[0]);
            setImage('');
            setExcerpt('');
            setContent([{ id: String(Date.now()), type: 'text', text: 'Escribe aquí el contenido del artículo.' }]);
            setFeatured(false);
        }
    }, [article, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: article?.id, title, category, image, excerpt, content, featured });
    };

    const handleContentChange = (id: string, newBlock: ContentBlock) => {
        setContent(prev => prev.map(b => (b.id === id ? newBlock : b)));
    };

    const addBlock = (type: 'text' | 'list' | 'image') => {
        let newBlock: ContentBlock;
        const newId = String(Date.now() + Math.random());
        if (type === 'text') newBlock = { id: newId, type: 'text', text: '' };
        else if (type === 'list') newBlock = { id: newId, type: 'list', items: [''] };
        else newBlock = { id: newId, type: 'image', mimeType: 'image/jpeg' };
        setContent(prev => [...prev, newBlock]);
    };
    
    const removeBlock = (id: string) => {
        setContent(prev => prev.filter(b => b.id !== id));
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === content.length - 1)) return;
        const newContent = [...content];
        const item = newContent.splice(index, 1)[0];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        newContent.splice(newIndex, 0, item);
        setContent(newContent);
    };

    const renderBlock = (block: ContentBlock, index: number) => {
        return (
            <div key={block.id} className="p-3 bg-background rounded-md border border-slate-700 relative group">
                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="w-6 h-6 bg-slate-600 rounded-full disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === content.length - 1} className="w-6 h-6 bg-slate-600 rounded-full disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => removeBlock(block.id)} className="w-6 h-6 bg-red-600 rounded-full">×</button>
                </div>
                {block.type === 'text' && (
                    <textarea value={block.text} onChange={e => handleContentChange(block.id, { ...block, text: e.target.value })} rows={5} className="form-input w-full" placeholder="Escribe un párrafo..." />
                )}
                {block.type === 'image' && (
                    <div className="space-y-2">
                        <p className="text-xs text-text-secondary">Carga una imagen desde tu PC o pega una URL.</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={block.imageUrl || (block.base64Data ? 'Archivo local cargado' : '')}
                                onChange={e => handleContentChange(block.id, { ...block, type: 'image', imageUrl: e.target.value, mimeType: 'image/jpeg', base64Data: undefined })}
                                className="form-input flex-1"
                                placeholder="Pega una URL de imagen..."
                                disabled={!!block.base64Data}
                            />
                            <label className="px-3 py-2 text-sm bg-slate-600 rounded-md cursor-pointer hover:bg-slate-500 whitespace-nowrap">
                                Cargar
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const base64 = await fileToBase64(file);
                                            handleContentChange(block.id, { ...block, type: 'image', base64Data: base64, mimeType: file.type, imageUrl: undefined });
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        {(block.base64Data || block.imageUrl) && (
                            <div className="relative mt-2">
                                <img src={block.base64Data || block.imageUrl} alt="Previsualización de contenido" className="rounded-md max-h-40" />
                                <button type="button" onClick={() => handleContentChange(block.id, { ...block, type: 'image', mimeType: 'image/jpeg', base64Data: undefined, imageUrl: undefined })} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg">×</button>
                            </div>
                        )}
                    </div>
                )}
                {block.type === 'list' && (
                    <div className="space-y-2">
                        {block.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2">
                                <span className="text-slate-500"> • </span>
                                <input type="text" value={item} onChange={e => {
                                    const newItems = [...block.items];
                                    newItems[itemIndex] = e.target.value;
                                    handleContentChange(block.id, { ...block, items: newItems });
                                }} className="form-input flex-1" placeholder="Elemento de la lista" />
                                <button type="button" onClick={() => {
                                    const newItems = block.items.filter((_, i) => i !== itemIndex);
                                    handleContentChange(block.id, { ...block, items: newItems });
                                }} className="text-red-500">×</button>
                            </div>
                        ))}
                         <button type="button" onClick={() => handleContentChange(block.id, { ...block, items: [...block.items, ''] })} className="text-sm text-primary">+ Añadir elemento</button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-3xl" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 z-20 text-text-secondary hover:text-text-main transition-colors" aria-label="Cerrar modal">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-xl font-bold font-display text-text-main mb-4">{article ? 'Editar Noticia' : 'Crear Nueva Noticia'}</h2>
                    <div className="space-y-4 modal-form">
                        <div><label>Título</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label>Categoría</label><select value={category} onChange={e => setCategory(e.target.value)} required className="form-input"><option value="" disabled>Selecciona una categoría</option>{newsCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                            <div className="flex-1">
                                <label>Imagen Principal</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        value={image.startsWith('data:') ? '[Imagen Local Cargada]' : image}
                                        onChange={e => setImage(e.target.value)}
                                        className="form-input flex-1"
                                        placeholder="Pega una URL o carga un archivo"
                                        disabled={image.startsWith('data:')}
                                    />
                                    <label className="px-3 py-2 text-sm bg-slate-600 rounded-md cursor-pointer hover:bg-slate-500 whitespace-nowrap">
                                        Cargar
                                        <input
                                            type="file"
                                            onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (file) setImage(await fileToBase64(file));
                                            }}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {image && (
                                    <div className="relative mt-2">
                                        <img src={image} alt="Previsualización principal" className="rounded-md max-h-40 object-cover" />
                                        <button type="button" onClick={() => setImage('')} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">X</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div><label>Extracto (Resumen corto)</label><textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} required></textarea></div>
                        
                        <div>
                            <label>Contenido del Artículo</label>
                            <div className="space-y-3 p-3 bg-surface rounded-lg border border-slate-700">
                                {content.map((block, index) => renderBlock(block, index))}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button type="button" onClick={() => addBlock('text')} className="text-sm px-3 py-1 bg-slate-600 rounded-md"> + Texto</button>
                                <button type="button" onClick={() => addBlock('list')} className="text-sm px-3 py-1 bg-slate-600 rounded-md"> + Lista</button>
                                <button type="button" onClick={() => addBlock('image')} className="text-sm px-3 py-1 bg-slate-600 rounded-md"> + Imagen</button>
                            </div>
                        </div>

                        <div><label className="custom-toggle-label"><input type="checkbox" className="custom-toggle-input" checked={featured} onChange={e => setFeatured(e.target.checked)} /><div className="custom-toggle-track"><div className="custom-toggle-thumb"></div></div><span className="ml-3 text-sm text-text-secondary">¿Es una noticia destacada?</span></label></div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NoticiasPage: React.FC<{user: User | null, isAdminMode: boolean}> = ({user, isAdminMode}) => {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');

    const fetchNews = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/news');
            if (!response.ok) throw new Error('Failed to fetch news');
            const data = await response.json();
            setNews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const categories = useMemo(() => ['Todas', ...Array.from(new Set(news.map(n => n.category)))], [news]);
    
    const categoryCounts = useMemo(() => {
        return news.reduce((acc, article) => {
            if (!acc[article.category]) {
                acc[article.category] = 0;
            }
            acc[article.category]++;
            return acc;
        }, {} as Record<string, number>);
    }, [news]);


    const filteredArticles = useMemo(() => {
        return news
            .filter(article => {
                const matchesCategory = activeCategory === 'Todas' || article.category === activeCategory;
                const matchesSearch = searchTerm === '' || article.title.toLowerCase().includes(searchTerm.toLowerCase()) || article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
            });
    }, [news, activeCategory, searchTerm]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('.fade-in-section');
        elements.forEach((el) => {
            el.classList.remove('is-visible');
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, [filteredArticles]);
    
    const featuredArticles = useMemo(() => filteredArticles.filter(a => a.featured), [filteredArticles]);
    const regularArticles = useMemo(() => filteredArticles.filter(a => !a.featured), [filteredArticles]);
    
    const handleOpenEditModal = (article: NewsArticle | null = null) => {
        setEditingArticle(article);
        setIsEditModalOpen(true);
    };

    const handleSaveArticle = async (articleData: Omit<NewsArticle, 'id' | 'date'> & { id?: number }) => {
        if (!user || !isAdminMode) {
            alert("No tienes permiso para realizar esta acción.");
            return;
        }

        const isCreating = !articleData.id;
        const url = isCreating ? 'http://localhost:3001/api/news' : `http://localhost:3001/api/news/${articleData.id}`;
        const method = isCreating ? 'POST' : 'PUT';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...articleData, adminUserId: user.id }),
            });

            if (!response.ok) throw new Error('Failed to save article');
            setIsEditModalOpen(false);
            fetchNews(); // Refresh data from server
        } catch (error) {
            console.error("Error saving article:", error);
            alert("No se pudo guardar la noticia.");
        }
    };

    const handleDeleteArticle = async (articleId: number) => {
        if (!user || !isAdminMode) {
            alert("No tienes permiso para realizar esta acción.");
            return;
        }
        if (window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
            try {
                const response = await fetch(`http://localhost:3001/api/news/${articleId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete article');
                fetchNews(); // Refresh data
            } catch (error) {
                console.error("Error deleting article:", error);
                alert("No se pudo eliminar la noticia.");
            }
        }
    };
    
    return (
        <div className="bg-background pt-20">
            <NewsModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveArticle} article={editingArticle} />
            {selectedArticle && <NewsDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {isLoading && (
                    <div className="text-center py-20">
                        <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Cargando noticias...
                    </div>
                )}

                {!isLoading && (
                    <>
                        {featuredArticles.length > 0 && (
                            <section className="mb-12">
                                <h2 className="text-3xl font-display text-text-main mb-6">Destacadas</h2>
                                {featuredArticles.length === 1 && (
                                    <div className="relative rounded-xl overflow-hidden modern-card cursor-pointer" onClick={() => setSelectedArticle(featuredArticles[0])}>
                                        {isAdminMode && (
                                            <div className="card-admin-controls">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(featuredArticles[0]); }} className="admin-action-button" title="Editar noticia"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteArticle(featuredArticles[0].id); }} className="admin-action-button delete" title="Eliminar noticia"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        )}
                                        <img src={featuredArticles[0].image} alt={featuredArticles[0].title} className="w-full h-[50vh] object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 p-8 text-white">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-semibold bg-primary px-3 py-1 rounded-full">{featuredArticles[0].category}</span>
                                                <span className="text-sm text-slate-300">{ new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${featuredArticles[0].date}T00:00:00`)) }</span>
                                            </div>
                                            <h1 className="text-3xl lg:text-5xl font-bold font-display mt-4 leading-tight">{featuredArticles[0].title}</h1>
                                            <p className="mt-2 text-slate-300 max-w-2xl hidden md:block">{featuredArticles[0].excerpt}</p>
                                        </div>
                                    </div>
                                )}
                                {featuredArticles.length > 1 && (
                                    <FeaturedNewsCarousel 
                                        articles={featuredArticles}
                                        onArticleClick={setSelectedArticle}
                                        onEdit={handleOpenEditModal}
                                        onDelete={handleDeleteArticle}
                                        isAdminMode={isAdminMode}
                                    />
                                )}
                            </section>
                        )}

                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                {regularArticles.length > 0 && (
                                     <h2 className="text-3xl font-display text-text-main mb-6">Todas las Noticias</h2>
                                )}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {regularArticles.map(article => 
                                        <NewsCard key={article.id} article={article} isAdminMode={isAdminMode} 
                                            onClick={() => setSelectedArticle(article)}
                                            onEdit={() => handleOpenEditModal(article)} 
                                            onDelete={() => handleDeleteArticle(article.id)} />
                                    )}
                                </div>
                            </div>

                            <aside className="space-y-6 lg:sticky top-24 h-fit">
                                {isAdminMode && (
                                    <button onClick={() => handleOpenEditModal()} className="w-full cta-button">
                                        + Crear Nueva Noticia
                                    </button>
                                )}
                                <SidebarWidget title="Buscar">
                                    <input type="search" placeholder="Buscar noticias..." className="form-input w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </SidebarWidget>
                                <SidebarWidget title="Categorías">
                                <ul className="space-y-1 text-text-secondary">
                                        {categories.map(category => (
                                            <li key={category}>
                                                <a href="#" 
                                                onClick={(e) => { e.preventDefault(); setActiveCategory(category); }} 
                                                className={`news-category-link hover:text-primary transition-colors ${activeCategory === category ? 'active' : ''}`}>
                                                    <span>{category}</span>
                                                    <span className="category-count">
                                                        {category === 'Todas' ? news.length : categoryCounts[category] || 0}
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                </ul>
                                </SidebarWidget>
                            </aside>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NoticiasPage;