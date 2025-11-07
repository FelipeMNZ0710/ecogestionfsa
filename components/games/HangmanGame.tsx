import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { HangmanWord } from '../../types';

interface HangmanGameProps {
    words: HangmanWord[];
    onComplete: (score: number) => void;
    userHighScore: number;
}

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const MAX_MISTAKES = 6;

const SadPlanet: React.FC<{ mistakes: number }> = ({ mistakes }) => {
    const trashItems = [
        <path key="1" d="M20 25 C 20 20, 30 20, 30 25 L 30 45 L 20 45 Z M 22 28 H 28" fill="#a2d2ff" stroke="#4a5568" strokeWidth="1" />,
        <path key="2" d="M75 80 L 85 80 L 85 90 L 75 90 Z M 77 82 H 83" fill="#e2e8f0" stroke="#4a5568" strokeWidth="1" />,
        <path key="3" d="M80 30 C 75 35, 75 45, 80 50 S 90 55, 95 50 S 95 35, 90 30 Z M 83 30 C 83 25, 87 25, 87 30 M 87 30 C 87 25, 91 25, 91 30" fill="#fef08a" stroke="#4a5568" strokeWidth="0.5" />,
        <path key="4" d="M10 70 Q 15 60, 25 75 M 12 72 Q 18 65, 25 75" fill="none" stroke="#facc15" strokeWidth="2" />,
        <path key="5" d="M40 85 L 50 80 L 60 85 L 50 90 Z" fill="#ffffff" stroke="#4a5568" strokeWidth="1" />,
        <path key="6" d="M55 20 L 65 20 L 70 40 L 50 40 Z" fill="#d2b48c" stroke="#4a5568" strokeWidth="1" />,
    ];
    
    let mouthPath = "M45 58 Q 50 62, 55 58"; // Happy
    if (mistakes > 2) mouthPath = "M45 58 H 55"; // Neutral
    if (mistakes > 4) mouthPath = "M45 60 Q 50 56, 55 60"; // Sad
    
    return (
        <svg viewBox="0 0 100 100" className="w-40 h-40 sm:w-48 sm:h-48 mx-auto mb-4">
            <defs>
                <radialGradient id="planetGradient" cx="0.4" cy="0.4" r="0.6">
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="100%" stopColor="#16a34a" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="url(#planetGradient)" />
            <path d="M45 40 Q 50 35, 55 40 T 60 55 Q 50 65, 40 55 T 45 40" fill="#22c55e" opacity="0.7"/>
            <path d="M40 60 Q 35 50, 45 48" fill="#22c55e" opacity="0.7" />
            
            <circle cx="45" cy="48" r="2" fill="white" /><circle cx="55" cy="48" r="2" fill="white" />
            <circle cx="46" cy="48" r="1" fill="black" /><circle cx="56" cy="48" r="1" fill="black" />

            <path d={mouthPath} stroke="black" strokeWidth="1.5" strokeLinecap="round" fill="none" style={{ transition: 'd 0.3s' }}/>
            
            <g transform={`rotate(${mistakes * 10} 50 50)`} style={{ transition: 'transform 0.5s ease' }}>
                {trashItems.slice(0, mistakes).map((item, i) => (
                    <g key={i} transform={`rotate(${i * (360 / MAX_MISTAKES)} 50 50) translate(0 -35)`} opacity="0.8">
                       {item}
                    </g>
                ))}
            </g>
        </svg>
    );
};


const HangmanGame: React.FC<HangmanGameProps> = ({ words, onComplete, userHighScore }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [{ word, hint }, setCurrentWord] = useState<{word: string; hint: string}>({word: '', hint: ''});
    const [guessedLetters, setGuessedLetters] = useState(new Set<string>());
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [score, setScore] = useState(0);

    const incorrectGuesses = useMemo(() => {
        return [...guessedLetters].filter(letter => !word.toUpperCase().includes(letter)).length;
    }, [guessedLetters, word]);
    
    const maskedWord = useMemo(() => {
        return word.toUpperCase().split('').map(letter => (letter === ' ' ? ' ' : guessedLetters.has(letter) ? letter : '_')).join('');
    }, [word, guessedLetters]);

    const setupNewGame = useCallback(() => {
        const newWordData = words[Math.floor(Math.random() * words.length)];
        setCurrentWord({word: newWordData.word.toUpperCase(), hint: newWordData.hint});
        setGuessedLetters(new Set<string>());
        setGameState('playing');
        setScore(0);
        setGameStarted(true);
    }, [words]);

    useEffect(() => {
        if (words.length > 0) {
            const newWordData = words[Math.floor(Math.random() * words.length)];
            setCurrentWord({word: newWordData.word.toUpperCase(), hint: newWordData.hint});
        }
    }, [words]);
    
     useEffect(() => {
        if (gameState !== 'playing' || !gameStarted) return;

        if (maskedWord === word && word !== '') {
            const finalScore = 100 - (incorrectGuesses * 10);
            setScore(finalScore);
            setGameState('won');
            onComplete(finalScore);
        } else if (incorrectGuesses >= MAX_MISTAKES) {
            setScore(0);
            setGameState('lost');
            onComplete(0);
        }
    }, [maskedWord, word, incorrectGuesses, onComplete, gameState, gameStarted]);

    const handleGuess = (letter: string) => {
        if (gameState !== 'playing') return;
        setGuessedLetters(prev => new Set(prev).add(letter));
    };
    
    const isNewHighScore = score > userHighScore;

    if (!gameStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col animate-fade-in-up">
                <div className="text-7xl mb-4">🌍</div>
                <h2 className="text-3xl font-bold text-text-main">Ahorcado Sostenible</h2>
                <p className="text-text-secondary mt-4 max-w-md">Adivina la palabra oculta letra por letra. Tienes 6 intentos antes de que el planeta se llene de basura. ¡Presta atención a la pista!</p>
                <button onClick={() => setGameStarted(true)} className="cta-button mt-8">
                    Empezar a Jugar
                </button>
            </div>
        );
    }

    if (gameState !== 'playing') {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-4 sm:p-8 flex-col" style={{ animation: 'game-pop-in 0.5s' }}>
                <div className={`text-7xl mb-4 ${gameState === 'won' ? 'animate-bounce' : ''}`}>{gameState === 'won' ? '🎉' : '😥'}</div>
                <h2 className="text-3xl font-bold text-text-main">{gameState === 'won' ? '¡Lo Adivinaste!' : '¡Planeta Contaminado!'}</h2>
                <p className="text-text-secondary mt-2 text-lg">La palabra era: <strong className="text-primary">{word}</strong></p>
                
                {gameState === 'won' && isNewHighScore && <p className="font-bold text-amber-400 text-xl mt-4 animate-bounce">¡Nuevo Récord!</p>}
                {gameState === 'won' && <p className="text-text-secondary mt-2 text-lg">Puntaje: <strong className="text-primary text-2xl">{score}</strong></p>}
                {gameState === 'won' && <p className="text-text-secondary text-sm">Récord anterior: {userHighScore}</p>}

                <div className="mt-4 p-4 bg-background rounded-lg text-sm text-text-secondary">
                    <strong className="text-primary">Dato Curioso:</strong> {hint}
                </div>
                <button onClick={setupNewGame} className="mt-8 bg-primary text-white font-semibold py-3 px-8 rounded-lg hover:bg-primary-dark transition-colors">
                    Jugar de Nuevo
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-around text-text-main">
            <SadPlanet mistakes={incorrectGuesses} />
            
            <div className="text-center">
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2 text-2xl sm:text-4xl font-bold tracking-widest my-4">
                    {word.split('').map((letter, index) => (
                         letter === ' ' 
                         ? <div key={index} className="w-4 sm:w-6"></div>
                         : <span key={index} className={`w-8 h-10 sm:w-12 sm:h-16 flex items-center justify-center bg-surface border-b-4 rounded-md text-text-main transition-all duration-200 ${guessedLetters.has(letter) ? 'border-primary' : 'border-slate-700'}`}>
                            {guessedLetters.has(letter) ? letter : ''}
                        </span>
                    ))}
                </div>
                <p className="text-sm text-primary h-6 font-semibold">Pista: {hint}</p>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1 sm:gap-2 p-1 sm:p-2">
                {ALPHABET.map(letter => {
                    const isGuessed = guessedLetters.has(letter);
                    const isCorrect = word.includes(letter);
                    
                    return (
                        <button 
                            key={letter}
                            onClick={() => handleGuess(letter)}
                            disabled={isGuessed}
                            className={`w-8 h-8 sm:w-10 sm:h-10 font-bold rounded-md transition-all duration-200 text-sm sm:text-base
                                ${isGuessed 
                                    ? (isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-500 opacity-60')
                                    : 'bg-background hover:bg-primary/20 text-text-main shadow-sm'
                                }`}
                        >
                            {letter}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default HangmanGame;