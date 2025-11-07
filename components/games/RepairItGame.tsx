import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RepairableItem } from '../../types';

interface RepairItGameProps {
    items: RepairableItem[];
    timePerItem: number;
    onComplete: (score: number) => void;
    userHighScore: number;
}

const RepairItGame: React.FC<RepairItGameProps> = ({ items, timePerItem, onComplete, userHighScore }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameItems, setGameItems] = useState<RepairableItem[]>([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(timePerItem);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [flyingTool, setFlyingTool] = useState<{ tool: string; from: DOMRect } | null>(null);
    const toolRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const nextItem = useCallback(() => {
        setFeedback(null);
        setFlyingTool(null);
        if (currentItemIndex < gameItems.length - 1) {
            setCurrentItemIndex(i => i + 1);
            setTimeLeft(timePerItem);
        } else {
            setIsFinished(true);
            onComplete(score);
        }
    }, [currentItemIndex, gameItems.length, timePerItem, onComplete, score]);
    
    useEffect(() => {
        setGameItems([...items].sort(() => Math.random() - 0.5));
    }, [items]);

    useEffect(() => {
        if (isFinished || flyingTool || !gameStarted) return;
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setFeedback('incorrect');
            setTimeout(nextItem, 1200);
        }
    }, [timeLeft, isFinished, flyingTool, nextItem, gameStarted]);

    const handleToolSelection = (tool: string, index: number) => {
        if (feedback) return;

        if (tool === gameItems[currentItemIndex].correctTool) {
            setScore(s => s + 10);
            setFeedback('correct');
            const buttonRect = toolRefs.current[index]?.getBoundingClientRect();
            if(buttonRect) setFlyingTool({ tool, from: buttonRect });
        } else {
            setFeedback('incorrect');
        }
        setTimeout(nextItem, 1200);
    };
    
    const currentItem = gameItems[currentItemIndex];
    const progress = (timeLeft / timePerItem) * 100;
    const isNewHighScore = score > userHighScore;

    if (!gameStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col animate-fade-in-up">
                <div className="text-7xl mb-4">🛠️</div>
                <h2 className="text-3xl font-bold font-display text-text-main">¡Repáralo!</h2>
                <p className="text-text-secondary mt-4 max-w-md">¡No lo tires, repáralo! Elige la herramienta correcta para arreglar cada objeto antes de que se acabe el tiempo. Reutilizar es clave.</p>
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
                <p className="text-text-secondary mt-2 text-lg">Reparaste {score / 10} objetos y tu puntaje es <strong className="text-primary text-2xl">{score}</strong>.</p>
                 <p className="text-text-secondary text-sm">Tu récord anterior: {userHighScore}</p>
            </div>
        );
    }
    
    if (!currentItem) return <div className="text-text-main">Cargando...</div>;

    return (
        <div className="w-full h-full flex flex-col items-center justify-between text-text-main relative overflow-hidden">
            {flyingTool && (
                 <div
                    className="absolute text-5xl z-10 transition-all duration-300 ease-in-out"
                    style={{
                        left: flyingTool.from.left + flyingTool.from.width / 2,
                        top: flyingTool.from.top + flyingTool.from.height / 2,
                        transform: 'translate(-50%, -50%) scale(1.5)',
                        animation: 'fly-to-center 0.5s ease-in-out forwards',
                    }}
                 >{flyingTool.tool}</div>
            )}
            <style>{`
                @keyframes fly-to-center {
                    0% {
                        transform: translate(-50%, -50%) scale(1.5);
                        left: ${flyingTool?.from.left + flyingTool.from.width / 2}px;
                        top: ${flyingTool?.from.top + flyingTool.from.height / 2}px;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        left: 50%;
                        top: 50%;
                        opacity: 0;
                    }
                }
            `}</style>
            <header className="w-full flex justify-between items-center text-lg sm:text-xl font-bold px-2">
                <div>Puntaje: <span className="text-primary">{score}</span></div>
                <div>Objetos: {currentItemIndex + 1}/{gameItems.length}</div>
            </header>
            
            <div className="w-full max-w-sm mx-auto my-4">
                <div className="h-4 w-full bg-background rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000 linear" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-lg mb-4 text-text-secondary">¿Qué herramienta usas para arreglar esto?</p>
                <div
                    className={`relative w-48 h-48 bg-background rounded-full shadow-lg flex flex-col items-center justify-center p-4 border-8 transition-colors duration-300
                        ${
                        feedback === 'correct' ? 'border-emerald-500' :
                        feedback === 'incorrect' ? 'border-red-500 animate-game-shake' : 'border-slate-700'
                    }`}
                >
                    <span className="text-7xl">{currentItem.image}</span>
                    <span className="font-bold text-center mt-2 text-text-main">{currentItem.name}</span>
                    {feedback === 'correct' && <div className="absolute text-5xl" style={{ animation: 'game-sparkle 0.6s ease-out forwards' }}>✨</div>}
                </div>
            </div>

            <footer className="w-full grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto mt-4">
                {currentItem.toolOptions.map((tool, index) => (
                    <button
                        key={index}
                        ref={el => { toolRefs.current[index] = el; }}
                        onClick={() => handleToolSelection(tool, index)}
                        disabled={!!feedback}
                        className="p-4 bg-background rounded-lg shadow-md text-5xl flex items-center justify-center transition-transform duration-200 hover:scale-110 disabled:scale-100 disabled:opacity-50"
                    >
                        {tool}
                    </button>
                ))}
            </footer>
        </div>
    );
};

export default RepairItGame;