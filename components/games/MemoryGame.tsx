import React, { useState, useEffect } from 'react';
import type { MemoryCardData } from '../../types';

interface MemoryGameProps {
    cards: MemoryCardData[];
    onComplete: (score: number) => void;
    userHighScore: number;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ cards, onComplete, userHighScore }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameCards, setGameCards] = useState<{ id: number; content: string; type: 'icon' | 'image'; matchId: string; isFlipped: boolean; isMatched: boolean; }[]>([]);
    const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [recentlyMatched, setRecentlyMatched] = useState<string | null>(null);

    useEffect(() => {
        const setupGame = () => {
            const pairedCards = cards.flatMap((card, i) => [
                { ...card, id: i * 2, matchId: card.id },
                { ...card, id: i * 2 + 1, matchId: card.id }
            ]);
            
            const shuffled = pairedCards
                .sort(() => Math.random() - 0.5)
                .map(card => ({ ...card, isFlipped: false, isMatched: false }));
            setGameCards(shuffled);
            setFlippedIndexes([]);
            setMoves(0);
            setSeconds(0);
            setIsFinished(false);
            setGameStarted(false);
        };
        setupGame();
    }, [cards]);
    
     useEffect(() => {
        if (gameStarted && !isFinished) {
            const timer = setInterval(() => setSeconds(s => s + 1), 1000);
            return () => clearInterval(timer);
        }
    }, [isFinished, gameStarted]);
    
    useEffect(() => {
        if (flippedIndexes.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndexes;
            const firstCard = gameCards[firstIndex];
            const secondCard = gameCards[secondIndex];

            if (firstCard.matchId === secondCard.matchId) {
                setRecentlyMatched(firstCard.matchId);
                setTimeout(() => {
                    setGameCards(prev => prev.map((card, index) => 
                        index === firstIndex || index === secondIndex ? { ...card, isMatched: true } : card
                    ));
                    setFlippedIndexes([]);
                    setIsChecking(false);
                    setRecentlyMatched(null);
                }, 600);
            } else {
                setTimeout(() => {
                    setGameCards(prev => prev.map((card, index) => 
                        index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
                    ));
                    setFlippedIndexes([]);
                    setIsChecking(false);
                }, 1200);
            }
        }
    }, [flippedIndexes, gameCards]);
    
    useEffect(() => {
        if (gameCards.length > 0 && gameCards.every(card => card.isMatched)) {
            setIsFinished(true);
            const score = Math.max(0, 1000 - moves * 10 - seconds * 2);
            onComplete(score);
        }
    }, [gameCards, onComplete, moves, seconds]);

    const handleCardClick = (index: number) => {
        if (isChecking || gameCards[index].isFlipped || gameCards[index].isMatched) {
            return;
        }
        
        if(flippedIndexes.length === 0) {
            setMoves(prev => prev + 1);
        }

        setFlippedIndexes(prev => [...prev, index]);
        setGameCards(prev => prev.map((card, i) => 
            i === index ? { ...card, isFlipped: true } : card
        ));
    };

    const finalScore = Math.max(0, 1000 - moves * 10 - seconds * 2);
    const isNewHighScore = finalScore > userHighScore;
    
    if (!gameStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col animate-fade-in-up">
                <div className="text-7xl mb-4">🤔</div>
                <h2 className="text-3xl font-bold font-display text-text-main">Memoria Ecológica</h2>
                <p className="text-text-secondary mt-4 max-w-md">Encuentra todos los pares de objetos reciclables. ¡A menor cantidad de movimientos y tiempo, mayor será tu puntaje!</p>
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
                <h2 className="text-3xl font-bold text-text-main">¡Memoria Prodigiosa!</h2>
                {isNewHighScore && <p className="font-bold text-amber-400 text-xl mt-4 animate-bounce">¡Nuevo Récord!</p>}
                <p className="text-text-secondary mt-2 text-lg">Puntaje Final: <strong className="text-primary text-2xl">{finalScore}</strong></p>
                <p className="text-text-secondary text-sm">Tu récord anterior: {userHighScore}</p>
                <div className="flex gap-6 mt-4 text-lg text-text-secondary">
                    <span>Movimientos: <strong className="text-primary">{moves}</strong></span>
                    <span>Tiempo: <strong className="text-primary">{seconds}s</strong></span>
                </div>
            </div>
        )
    }

    const gridCols = gameCards.length > 12 ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-3 md:grid-cols-4';

    return (
        <div className="w-full h-full flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 text-lg font-bold text-text-main px-2">
                <span>Movimientos: {moves}</span>
                <span>Tiempo: {seconds}s</span>
            </div>
            <div className={`grid ${gridCols} gap-2 sm:gap-4 justify-center flex-1 items-center`}>
                {gameCards.map((card, index) => (
                    <div key={card.id} className="w-full aspect-square [perspective:1000px]" onClick={() => handleCardClick(index)}>
                        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''}`}>
                            {/* Card Back */}
                            <div className="absolute w-full h-full [backface-visibility:hidden] bg-primary rounded-lg cursor-pointer shadow-lg bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-white">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm3-1.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm3 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM12 17.25c.39 0 .771.045 1.137.127a.75.75 0 0 1 .533.933l-.36 1.343a.75.75 0 0 1-1.46-.39l.234-.875a8.25 8.25 0 0 0-1.228 0l.234.875a.75.75 0 0 1-1.46.39l-.36-1.343a.75.75 0 0 1 .533-.933A9.76 9.76 0 0 1 12 17.25Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            {/* Card Front */}
                             <div className={`absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg [transform:rotateY(180deg)] flex items-center justify-center transition-opacity duration-500
                                ${card.isMatched ? 'opacity-40' : ''}
                                ${flippedIndexes.includes(index) && flippedIndexes.length === 2 && !card.isMatched ? 'animate-game-shake' : ''}
                                ${card.isMatched && recentlyMatched === card.matchId ? 'animate-game-glow-correct' : ''}
                             `}>
                                 <span className="text-6xl sm:text-7xl">{card.content}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemoryGame;