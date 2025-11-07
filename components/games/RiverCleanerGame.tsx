import React, { useEffect } from 'react';

interface RiverCleanerGameProps {
    onComplete: (score: number) => void;
    userHighScore: number;
}

const RiverCleanerGame: React.FC<RiverCleanerGameProps> = ({ onComplete, userHighScore }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete(Math.floor(Math.random() * 50) + 50);
        }, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="w-full h-full flex items-center justify-center text-center flex-col">
            <div className="text-7xl mb-4">🎣</div>
            <h2 className="text-3xl font-bold text-text-main">Limpia el Río</h2>
            <p className="text-text-secondary mt-4">Este juego estará disponible próximamente. ¡Vuelve pronto!</p>
            <p className="mt-2 text-sm text-primary animate-pulse">Cargando...</p>
        </div>
    );
};

export default RiverCleanerGame;