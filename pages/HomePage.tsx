
import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Page, User } from '../types';
import TestimonialsCarousel from '../components/TestimonialsCarousel';

interface ImpactStats {
    recycledKg: number;
    participants: number;
    points: number;
}

const useIntersectionObserver = (options: IntersectionObserverInit) => {
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver((observedEntries) => {
      observedEntries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, options);

    return () => observer.current?.disconnect();
  }, [options]);

  const observe = (element: Element) => {
    observer.current?.observe(element);
  };

  return { observe };
};

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const start = count;
        const end = value;
        if (start === end) return;

        const duration = 800; // Faster animation
        const range = end - start;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);

            const newCount = Math.floor(start + range * easeOutProgress);
            setCount(newCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        const animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [value]); // Depend only on value to avoid re-triggering on count change

    const formattedCount = count.toLocaleString('es-AR');

    return <p className="text-5xl font-display text-white">{value > 1000 ? '+' : ''}{formattedCount}</p>;
}


// FIX: Changed icon type from JSX.Element to React.ReactNode to resolve namespace error.
const FeatureCard = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
  <div className="modern-card p-6 text-center fade-in-section">
    <div className="flex justify-center items-center mb-4 h-12 w-12 rounded-full bg-secondary/10 text-secondary mx-auto">{icon}</div>
    <h3 className="text-xl font-display mb-2 text-text-main">{title}</h3>
    <p className="text-text-secondary">{text}</p>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => (
    <details className="border-b border-white/10 py-4 group fade-in-section">
        <summary className="flex justify-between items-center font-semibold cursor-pointer text-text-main list-none">
            <span className="text-lg">{question}</span>
            <span className="text-secondary transition-transform duration-300 group-open:rotate-45">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </span>
        </summary>
        <div className="pt-3 text-text-secondary">
            <p>{answer}</p>
        </div>
    </details>
);

const StatsEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    stats: ImpactStats;
    onSave: (newStats: ImpactStats) => void;
    user: User | null;
}> = ({ isOpen, onClose, stats, onSave, user }) => {
    const [currentStats, setCurrentStats] = useState(stats);

    useEffect(() => {
        setCurrentStats(stats);
    }, [stats, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(currentStats);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-xl font-bold font-display text-text-main mb-4">Editar Estadísticas de Impacto</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 modal-form">
                        <div>
                            <label htmlFor="recycledKg">KGs de material reciclado</label>
                            <input type="number" id="recycledKg" value={currentStats.recycledKg} onChange={e => setCurrentStats({...currentStats, recycledKg: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label htmlFor="participants">Participantes activos</label>
                            <input type="number" id="participants" value={currentStats.participants} onChange={e => setCurrentStats({...currentStats, participants: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label htmlFor="points">Puntos Verdes distribuidos</label>
                            <input type="number" id="points" value={currentStats.points} onChange={e => setCurrentStats({...currentStats, points: Number(e.target.value)})}/>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const HomePage: React.FC<{setCurrentPage: (page: Page) => void, user: User | null, isAdminMode: boolean}> = ({setCurrentPage, user, isAdminMode}) => {
  const { observe } = useIntersectionObserver({ threshold: 0.1 });
  const [impactStats, setImpactStats] = useState<ImpactStats>({ recycledKg: 0, participants: 0, points: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in-section');
    elements.forEach(el => observe(el));
  }, [observe, impactStats]);
  
  const fetchStats = useCallback(async () => {
    const maxRetries = 5;
    let currentDelay = 1000; // Start with a 1-second delay between retries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('http://localhost:3001/api/impact-stats');
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        const data = await response.json();
        setImpactStats(data);
        return; 
      } catch (error) {
        console.warn(`[fetchStats] Attempt ${attempt}/${maxRetries} failed. Retrying in ${currentDelay / 1000}s...`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= 1.5;
        } else {
          console.error("Error fetching impact stats after all retries. Using fallback data.", error);
          setImpactStats({ recycledKg: 10000, participants: 5000, points: 45 });
        }
      }
    }
  }, []);

  useEffect(() => {
      fetchStats();
  }, [fetchStats]);
  
  const handleSaveStats = async (newStats: ImpactStats) => {
      if (!user || !isAdminMode) {
          alert("No tienes permiso para editar esto.");
          return;
      }
      
      const oldStats = impactStats; // Save old state for potential rollback
      setImpactStats(newStats); // Optimistic update for instant feedback
      setIsModalOpen(false);

      try {
          const response = await fetch('http://localhost:3001/api/impact-stats', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ...newStats,
                  adminUserId: user.id, // FIX: The backend expects 'adminUserId' for authentication.
              })
          });
          if (!response.ok) {
            throw new Error('Failed to save stats to the server');
          }
          // On success, do nothing. The UI is already updated.
      } catch (error) {
          console.error("Error saving stats:", error);
          alert("No se pudieron guardar las estadísticas. Revirtiendo los cambios.");
          setImpactStats(oldStats); // Rollback on error
      }
  }

  return (
    <div className="w-full">
      <StatsEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} stats={impactStats} onSave={handleSaveStats} user={user} />
      {/* Hero Section */}
      <section className="relative h-screen text-white overflow-hidden">
        <div className="absolute inset-0 bg-black">
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop')" }}></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-5xl md:text-8xl font-display mb-4 drop-shadow-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Juntos por una Formosa más Limpia</h1>
          <p className="text-lg md:text-xl max-w-3xl mb-8 drop-shadow-md animate-fade-in-up" style={{ animationDelay: '0.4s' }}>Descubrí cómo, dónde y por qué reciclar. Sumate al cambio y transformá tu comunidad con nosotros.</p>
          <button onClick={() => setCurrentPage('puntos-verdes')} className="cta-button animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            Buscar Puntos Verdes
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in-section">
            <h2 className="text-4xl font-display text-text-main">Todo lo que necesitás para reciclar</h2>
            <p className="mt-4 text-lg text-text-secondary">Herramientas y guías para hacer del reciclaje un hábito simple.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                title="Guía de Reciclaje"
                text="Aprendé a separar tus residuos correctamente con nuestra guía detallada."
            />
            <FeatureCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                title="Mapa de Puntos Verdes"
                text="Encontrá el centro de acopio más cercano a tu ubicación en segundos."
            />
            <FeatureCard 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2" /></svg>}
                title="Comunidad Activa"
                text="Unite a la conversación, compartí ideas y resolvé dudas con otros miembros."
            />
          </div>
        </div>
      </section>

        {/* Impact Section */}
        <section className="py-20 bg-surface text-white relative">
            {isAdminMode && (
                <button onClick={() => setIsModalOpen(true)} className="absolute top-4 right-4 px-3 py-2 text-sm font-semibold rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10">
                    Editar
                </button>
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="fade-in-section">
                    <h2 className="text-4xl font-display mb-10">Nuestro Impacto Colectivo</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="fade-in-section" style={{ animationDelay: '0.2s' }}>
                        <AnimatedNumber value={impactStats.recycledKg} />
                        <p className="mt-2 text-lg text-text-secondary">de KGs de material reciclado al mes</p>
                    </div>
                    <div className="fade-in-section" style={{ animationDelay: '0.4s' }}>
                         <AnimatedNumber value={impactStats.participants} />
                        <p className="mt-2 text-lg text-text-secondary">participando activamente</p>
                    </div>
                    <div className="fade-in-section" style={{ animationDelay: '0.6s' }}>
                        <AnimatedNumber value={impactStats.points} />
                        <p className="mt-2 text-lg text-text-secondary">Puntos Verdes distribuidos</p>
                    </div>
                </div>
            </div>
        </section>

      {/* Testimonials Section */}
      <TestimonialsCarousel />

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 fade-in-section">
            <h2 className="text-4xl font-display text-text-main">Preguntas Frecuentes</h2>
            <p className="mt-4 text-lg text-text-secondary">Respuestas rápidas a las dudas más comunes.</p>
          </div>
          <div className="space-y-2">
            <FAQItem question="¿Por qué es importante enjuagar los envases?" answer="Enjuagar los envases de plástico, vidrio o metal ayuda a prevenir malos olores y la contaminación de otros materiales reciclables, asegurando que el lote completo pueda ser procesado correctamente." />
            <FAQItem question="¿Qué hago con las pilas y baterías?" answer="Las pilas y baterías no deben arrojarse a la basura común. Contienen materiales tóxicos. Buscá un punto de recolección especial en nuestra sección de Puntos Verdes para desecharlas de forma segura." />
            <FAQItem question="¿El cartón de pizza se puede reciclar?" answer="Depende. Si la caja está manchada con grasa o restos de comida, esa parte no se puede reciclar y debe ir a la basura. Si hay partes limpias, podés cortarlas y reciclarlas con el papel y cartón." />
            <FAQItem question="¿Es necesario quitar las etiquetas de las botellas?" answer="No es estrictamente necesario. Durante el proceso de reciclaje industrial, las etiquetas de papel o plástico se separan de los envases. Sin embargo, quitar las que son fáciles de remover nunca está de más." />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
