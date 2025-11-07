import React, { useState, useMemo, useCallback } from 'react';
import type { QuizQuestion } from '../../types';

interface TriviaGameProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
    onClose: () => void;
    userHighScore: number;
}

const TriviaGame: React.FC<TriviaGameProps> = ({ questions, onComplete, onClose, userHighScore }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    
    const finalScore = score;
    const isNewHighScore = finalScore > userHighScore;

    const restartGame = useCallback(() => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setScore(0);
        setIsFinished(false);
    }, []);

    const handleAnswer = (answerIndex: number) => {
        if (showFeedback) return;
        setSelectedAnswer(answerIndex);
        setShowFeedback(true);
        if (answerIndex === questions[currentQuestionIndex].correctAnswer) {
            setScore(s => s + 10);
        }
    };
    
    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setShowFeedback(false);
            setSelectedAnswer(null);
        } else {
            setIsFinished(true);
            onComplete(score + (selectedAnswer === questions[currentQuestionIndex].correctAnswer ? 10 : 0));
        }
    };

    if (!gameStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-8 flex-col animate-fade-in-up">
                <div className="text-7xl mb-4">🧠</div>
                <h2 className="text-3xl font-bold font-display text-text-main">Súper Trivia</h2>
                <p className="text-text-secondary mt-4 max-w-md">Pon a prueba tus conocimientos sobre reciclaje. Responde correctamente para sumar puntos. ¡Mucha suerte!</p>
                <button onClick={() => setGameStarted(true)} className="cta-button mt-8">
                    Empezar a Jugar
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="relative max-w-xl mx-auto h-full flex flex-col justify-between text-text-main">
            {!isFinished ? (
                <>
                    <div>
                        <div className="flex justify-between items-center mb-2 text-sm text-text-secondary">
                            <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                            <span>Puntaje: {score}</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2.5 mb-4">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-6 min-h-[6rem] flex items-center">{currentQuestion.question}</h2>
                    </div>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => {
                            let buttonClass = "w-full text-left p-4 border-2 rounded-lg transition-all duration-200 font-semibold flex items-center justify-between ";
                            let feedbackIcon = null;

                            if (showFeedback) {
                                if (index === currentQuestion.correctAnswer) {
                                    buttonClass += "bg-emerald-500/20 border-emerald-500 text-text-main";
                                    feedbackIcon = '✅';
                                } else if (index === selectedAnswer) {
                                    buttonClass += "bg-red-500/20 border-red-500 text-text-main animate-game-shake";
                                    feedbackIcon = '❌';
                                } else {
                                    buttonClass += "border-slate-700 opacity-50";
                                }
                            } else {
                               buttonClass += "border-slate-700 hover:border-primary hover:bg-primary/10";
                            }
                            return (
                                <button key={index} onClick={() => handleAnswer(index)} disabled={showFeedback} className={buttonClass}>
                                    <span>{option}</span>
                                    {feedbackIcon && <span className="text-2xl">{feedbackIcon}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-6">
                        {showFeedback && (
                            <button onClick={handleNext} className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors" style={{ animation: 'fadeInUp 0.5s' }}>
                                {currentQuestionIndex < questions.length - 1 ? 'Siguiente' : 'Ver Resultados'}
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-center p-4 sm:p-8 flex-col" style={{ animation: 'game-pop-in 0.5s' }}>
                    <div className="text-7xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-text-main">¡Juego Completado!</h2>
                    {isNewHighScore && <p className="font-bold text-amber-400 text-xl mt-4 animate-bounce">¡Nuevo Récord!</p>}
                    <p className="text-text-secondary mt-2 text-lg">Puntaje Final: <strong className="text-primary text-2xl">{finalScore}</strong></p>
                    <p className="text-text-secondary text-sm">Tu récord anterior: {userHighScore}</p>
                </div>
            )}
        </div>
    );
};

export default TriviaGame;