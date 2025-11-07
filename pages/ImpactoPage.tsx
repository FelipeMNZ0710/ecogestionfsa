import React from 'react';
import RecyclingDonutChart from '../components/RecyclingDonutChart';

const ImpactoPage: React.FC = () => {
    const chartData = [
        { name: 'Recicladores Activos', value: 35, color: '#10B981' },
        { name: 'Quieren, pero no saben cómo', value: 40, color: '#f59e0b' },
        { name: 'Aún no convencidos', value: 25, color: '#4b5563' }
    ];

    return (
        <div className="bg-background pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h1 className="text-4xl font-extrabold font-display text-text-main sm:text-5xl">Impacto Comunitario</h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">Visualiza cómo nuestras acciones colectivas están transformando el panorama del reciclaje en Formosa. ¡Cada pequeño esfuerzo suma a un gran cambio!</p>
                </div>
                
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <RecyclingDonutChart data={chartData} />
                </div>

                {/* Future sections for more stats can be added here */}
                
            </div>
        </div>
    );
};

export default ImpactoPage;