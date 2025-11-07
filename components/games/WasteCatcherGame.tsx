import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CatcherItem } from '../../types';

interface WasteCatcherGameProps {
    items: CatcherItem[];
    lives: number;
    onComplete: (score: number) => void;
    userHighScore: number;
}

const WasteCatcherGame: React.FC<WasteCatcherGameProps> = ({ items, lives: initialLives, onComplete, userHighScore }) => {
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const cartRef = useRef<HTMLDivElement>(null);
    
    const [gameStarted, setGameStarted] = useState(false);
    const [fallingItems, setFallingItems] = useState<{ item: CatcherItem; id: number; x: number; y: number, rotation: number }[]>([]);
    const [feedback, setFeedback] = useState<{ id: number, text: string, x: number, y: number, color: string }[]>([]);
    const [cartX, setCartX] = useState(50); // in percentage
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(initialLives);
    const [isFinished, setIsFinished] = useState(false);
    const [flash, setFlash] = useState(false);
    const nextItemId = useRef(0);
    const nextFeedbackId = useRef(0);

    const spawnItem = useCallback(() => {
        if (isFinished) return;
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const newItem = {
            item: randomItem,
            id: nextItemId.current++,
            x: Math.random() * 90 + 5,
            y: -50,
            rotation: Math.random() * 360 - 180,
        };
        setFallingItems(prev => [...prev, newItem]);
    }, [items, isFinished]);

    useEffect(() => {
        if (gameStarted) {
            const spawnInterval = setInterval(spawnItem, 1500 - (score / 10)); // Faster spawn with score
            return () => clearInterval(spawnInterval);
        }
    }, [spawnItem, score, gameStarted]);

    const addFeedback = (text: string, x: number, y: number, color: string) => {
        const newFeedback = { id: nextFeedbackId.current++, text, x, y, color };
        setFeedback(prev => [...prev, newFeedback]);
        setTimeout(() => {
            setFeedback(prev => prev.filter(f => f.id !== newFeedback.id));
        }, 1000);
    };

    useEffect(() => {
        if (isFinished || !gameStarted) return;
        const gameLoop = setInterval(() => {
            const gameAreaHeight = gameAreaRef.current?.offsetHeight || 600;
            setFallingItems(prev => {
                const speed = 2 + (score / 150);
                const updatedItems = prev.map(i => ({ ...i, y: i.y + speed }));
                
                const cartRect = cartRef.current?.getBoundingClientRect();
                const gameAreaRect = gameAreaRef.current?.getBoundingClientRect();
                
                if (!cartRect || !gameAreaRect) return updatedItems;

                const remainingItems = updatedItems.filter(item => {
                    const itemElement = document.getElementById(`item-${item.id}`);
                    const itemRect = itemElement?.getBoundingClientRect();
                    
                    if (!itemRect) return true;

                    if (itemRect.bottom > cartRect.top && itemRect.right > cartRect.left && itemRect.left < cartRect.right && itemRect.bottom < cartRect.bottom + 20) {
                        const feedbackX = (itemRect.left + itemRect.width / 2) - gameAreaRect.left;
                        const feedbackY = itemRect.top - gameAreaRect.top;
                        if (item.item.type === 'recyclable') {
                            setScore(s => s + item.item.points);
                            addFeedback(`+${item.item.points}`, feedbackX, feedbackY, 'text-primary');
                        } else {
                            setLives(l => l - 1);
                            setFlash(true); setTimeout(() => setFlash(false), 200);
                            addFeedback(`-1 Vida`, feedbackX, feedbackY, 'text-red-500');
                        }
                        return false;
                    }
                    
                    if (itemRect.top > gameAreaRect.bottom) {
                        if (item.item.type === 'recyclable') {
                             setLives(l => l - 1);
                             setFlash(true); setTimeout(() => setFlash(false), 200);
                        }
                        return false;
                    }
                    return true;
                });
                return remainingItems;
            });
        }, 16);

        return () => clearInterval(gameLoop);
    }, [isFinished, score, gameStarted]);

    useEffect(() => {
        if (lives <= 0 && !isFinished) {
            setIsFinished(true);
            onComplete(score);
        }
    }, [lives, isFinished, onComplete, score]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let newCartX = (x / rect.width) * 100;
        newCartX = Math.max(5, Math.min(95, newCartX));
        setCartX(newCartX);
    };
    
    const isNewHighScore = score > userHighScore;

    if (!gameStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col animate-fade-in-up">
                <div className="text-7xl mb-4">🗑️</div>
                <h2 className="text-3xl font-bold text-text-main">Atrapa el Reciclable</h2>
                <p className="text-text-secondary mt-4 max-w-md">Mueve el mouse para desplazar el contenedor. Atrapa todos los objetos reciclables que caen y esquiva la basura. ¡Pierdes una vida si un reciclable toca el suelo o si atrapas basura!</p>
                <button onClick={() => setGameStarted(true)} className="cta-button mt-8">
                    Empezar a Jugar
                </button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col" style={{ animation: 'game-pop-in 0.5s' }}>
                <div className="text-7xl mb-4">♻️</div>
                <h2 className="text-3xl font-bold text-text-main">¡Juego Terminado!</h2>
                {isNewHighScore && <p className="font-bold text-amber-400 text-xl mt-4 animate-bounce">¡Nuevo Récord!</p>}
                <p className="text-text-secondary mt-2 text-lg">Tu puntaje final: <strong className="text-primary text-2xl">{score}</strong>.</p>
                <p className="text-text-secondary text-sm">Tu récord anterior: {userHighScore}</p>
            </div>
        );
    }
    
    return (
        <div className={`w-full h-full flex flex-col items-center relative text-text-main overflow-hidden ${flash ? 'animate-pulse' : ''}`} onMouseMove={handleMouseMove} ref={gameAreaRef} style={{ animation: flash ? 'game-screen-flash 0.2s' : 'none' }}>
             <header className="w-full flex justify-between items-center text-lg sm:text-xl font-bold z-10 p-2">
                <div>Puntaje: <span className="text-primary">{score}</span></div>
                <div className="flex gap-2 items-center">Vidas: {'❤️'.repeat(lives)}<span className="text-red-500/50">{'❤️'.repeat(Math.max(0, initialLives - lives))}</span></div>
            </header>

            {fallingItems.map(item => (
                <div
                    key={item.id}
                    id={`item-${item.id}`}
                    className="absolute text-4xl"
                    style={{ left: `${item.x}%`, top: `${item.y}px`, transform: `translateX(-50%) rotate(${item.rotation}deg)` }}
                >
                    {item.item.image}
                </div>
            ))}
            
             <div className="absolute inset-0 pointer-events-none">
                {feedback.map(f => (
                    <div
                        key={f.id}
                        className={`absolute text-2xl font-bold ${f.color}`}
                        style={{ left: f.x, top: f.y, animation: 'float-up 1s ease-out forwards' }}
                    >
                        {f.text}
                    </div>
                ))}
            </div>

            <div
                ref={cartRef}
                className="absolute bottom-5 w-24 h-16 bg-primary rounded-t-lg border-4 border-primary-dark shadow-lg flex items-center justify-center text-4xl"
                style={{ left: `${cartX}%`, transform: 'translateX(-50%)' }}
            >
                ♻️
            </div>
        </div>
    );
};

export default WasteCatcherGame;