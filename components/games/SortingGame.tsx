import React, { useState, useEffect } from 'react';
import type { SortableItemData, BinType } from '../../types';

interface SortingGameProps {
    items: SortableItemData[];
    bins: BinType[];
    duration: number;
    onComplete: (score: number) => void;
    userHighScore: number;
}

const binInfo: Record<BinType, { name: string; color: string, icon: string, dropColor: string }> = {
    plastico: { name: 'Plásticos', color: 'bg-yellow-500', icon: '🍾', dropColor: 'border-yellow-500' },
    papel: { name: 'Papel', color: 'bg-blue-500', icon: '📦', dropColor: 'border-blue-500' },
    vidrio: { name: 'Vidrio', color: 'bg-green-500', icon: '🫙', dropColor: 'border-green-500' },
    metales: { name: 'Metales', color: 'bg-red-500', icon: '🥫', dropColor: 'border-red-500' },
    organico: { name: 'Orgánico', color: 'bg-orange-500', icon: '🍎', dropColor: 'border-orange-500' }
}

const SortingGame: React.FC<SortingGameProps> = ({ items, bins, duration, onComplete, userHighScore }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameItems, setGameItems] = useState<SortableItemData[]>([]);
    const [currentItem, setCurrentItem] = useState<SortableItemData | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [dragOverBin, setDragOverBin] = useState<BinType | null>(null);

    useEffect(() => {
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        setGameItems(shuffled);
        setCurrentItem(shuffled[0]);
    }, [items]);

    useEffect(() => {
        if (gameStarted && timeLeft > 0 && !isFinished) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameStarted && timeLeft <= 0 && !isFinished) {
            setIsFinished(true);
            onComplete(score);
        }
    }, [timeLeft, isFinished, onComplete, score, gameStarted]);

    const nextItem = () => {
        setFeedback(null);
        const currentIndex = gameItems.findIndex(i => i.id === currentItem?.id);
        if (currentIndex < gameItems.length - 1) {
            setCurrentItem(gameItems[currentIndex + 1]);
        } else {
            setIsFinished(true);
            onComplete(score);
        }
    };
    
    const handleDrop = (bin: BinType) => {
        if (!currentItem || feedback) return;
        
        if (currentItem.correctBin === bin) {
            setScore(s => s + 10);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }
        setDragOverBin(null);
        setTimeout(nextItem, 800);
    };
    
    const isNewHighScore = score > userHighScore;

    if (!gameStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col animate-fade-in-up">
                <div className="text-7xl mb-4">♻️</div>
                <h2 className="text-3xl font-bold text-text-main">Clasificación Rápida</h2>
                <p className="text-text-secondary mt-4 max-w-md">Arrastra cada objeto que aparezca en el centro hacia su contenedor correcto en la parte inferior. ¡Hazlo rápido, el tiempo corre!</p>
                <button onClick={() => setGameStarted(true)} className="cta-button mt-8">
                    Empezar a Jugar
                </button>
            </div>
        );
    }

    if (isFinished) {
         return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col" style={{ animation: 'game-pop-in 0.5s' }}>
                <div className="text-7xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-text-main">¡Juego Terminado!</h2>
                {isNewHighScore && <p className="font-bold text-amber-400 text-xl mt-4 animate-bounce">¡Nuevo Récord!</p>}
                <p className="text-text-secondary mt-2 text-lg">Tu puntaje final: <strong className="text-primary text-2xl">{score}</strong>.</p>
                <p className="text-text-secondary text-sm">Tu récord anterior: {userHighScore}</p>
            </div>
        );
    }
    
    if (!currentItem) {
        return <div className="text-text-main">Cargando juego...</div>;
    }
    
    let itemAnimationClass = '';
    if (feedback === 'correct') itemAnimationClass = 'game-swoosh-out';
    if (feedback === 'incorrect') itemAnimationClass = 'animate-game-shake';
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-between text-text-main relative">
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="text-9xl" style={{ animation: 'feedback-pop 0.5s ease-out forwards' }}>
                        {feedback === 'correct' ? '✅' : '❌'}
                    </div>
                </div>
            )}
            <header className="w-full flex justify-between items-center text-lg sm:text-xl font-bold px-2">
                <div>Puntaje: <span className="text-primary">{score}</span></div>
                <div>Tiempo: <span className={`transition-colors ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>{timeLeft}s</span></div>
            </header>

            <div className="flex-1 flex items-center justify-center">
                <div 
                    draggable 
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; }}
                    className={`w-40 h-40 bg-background border-4 border-slate-600 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 my-4 cursor-grab active:cursor-grabbing ${itemAnimationClass}`}
                >
                    <span className="text-7xl pointer-events-none">{currentItem.image}</span>
                    <span className="font-bold text-center mt-1 text-sm pointer-events-none">{currentItem.name}</span>
                </div>
            </div>

            <footer className={`w-full grid grid-cols-2 md:grid-cols-${Math.min(bins.length, 5)} gap-2 sm:gap-4`}>
                {bins.map(bin => {
                    const info = binInfo[bin];
                    return (
                        <div 
                            key={bin} 
                            onDragOver={(e) => { e.preventDefault(); setDragOverBin(bin); }}
                            onDragLeave={() => setDragOverBin(null)}
                            onDrop={() => handleDrop(bin)}
                            className={`p-2 py-4 sm:p-4 rounded-lg text-white font-bold flex flex-col items-center justify-end h-32 sm:h-40 transition-all duration-200 border-4 ${dragOverBin === bin ? info.dropColor : 'border-transparent'} ${info.color}`}
                        >
                            <span className="text-4xl sm:text-5xl">{info.icon}</span>
                            <span className="text-sm sm:text-base mt-2">{info.name}</span>
                        </div>
                    );
                })}
            </footer>
        </div>
    );
};

export default SortingGame;