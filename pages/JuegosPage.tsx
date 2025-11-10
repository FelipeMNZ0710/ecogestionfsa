import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { User, Game, GamificationAction, GameType, QuizQuestion, MemoryCardData, SortableItemData, HangmanWord, BinType } from '../types';
import TriviaGame from '../components/games/TriviaGame';
import MemoryGame from '../components/games/MemoryGame';
import SortingGame from '../components/games/SortingGame';
import HangmanGame from '../components/games/HangmanGame';
import RecyclingChainGame from '../components/games/RecyclingChainGame';
import WasteCatcherGame from '../components/games/WasteCatcherGame';
import RepairItGame from '../components/games/RepairItGame';
import EcoQuizGame from '../components/games/EcoQuizGame';
import FindTheIntruderGame from '../components/games/FindTheIntruderGame';
import RecyclingPathGame from '../components/games/RecyclingPathGame';
import RiverCleanerGame from '../components/games/RiverCleanerGame';
import CompostSequenceGame from '../components/games/CompostSequenceGame';
import MythBustersGame from '../components/games/MythBustersGame';
import ConceptConnectorGame from '../components/games/ConceptConnectorGame';
import WaterSaverGame from '../components/games/WaterSaverGame';
import EcoWordleGame from '../components/games/EcoWordleGame';
import SustainableBuilderGame from '../components/games/SustainableBuilderGame';
import EnergyImpactGame from '../components/games/EnergyImpactGame';
import NatureSoundsGame from '../components/games/NatureSoundsGame';
import SpotTheDifferenceGame from '../components/games/SpotTheDifferenceGame';


const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="flex text-yellow-400">
            {[...Array(fullStars)].map((_, i) => <svg key={`f${i}`} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
            {halfStar && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
            {[...Array(emptyStars)].map((_, i) => <svg key={`e${i}`} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
        </div>
    );
};


const GameCard: React.FC<{ 
    game: Game; 
    user: User | null;
    isAdminMode: boolean;
    onPlay: (game: Game) => void;
    onEdit: (game: Game) => void;
    onDelete: (gameId: number) => void;
}> = ({ game, user, isAdminMode, onPlay, onEdit, onDelete }) => (
    <div className="modern-card p-0 overflow-hidden fade-in-section relative flex flex-col">
        {isAdminMode && (
            <div className="card-admin-controls">
                <button onClick={(e) => { e.stopPropagation(); onEdit(game); }} className="admin-action-button" title="Editar juego">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(game.id); }} className="admin-action-button delete" title="Eliminar juego">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        )}
        <img src={game.image} alt={game.title} className="w-full h-40 object-cover" />
        <div className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-secondary font-semibold">{game.category}</p>
                {game.rating && <StarRating rating={game.rating} />}
            </div>
            <h3 className="font-bold text-lg text-text-main mb-2">{game.title}</h3>
            <p className="text-xs text-text-secondary mb-4 flex-grow">{game.learningObjective}</p>
            {user && (
                <div className="text-xs bg-slate-700/50 rounded-md p-2 mb-3 text-center">
                    Tu récord: <span className="font-bold text-primary">{game.userHighScore.toLocaleString('es-AR')} pts</span>
                </div>
            )}
            <button 
                onClick={() => onPlay(game)}
                className="w-full mt-auto bg-primary text-white font-semibold py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                disabled={!user}
            >
                {user ? 'Jugar' : 'Inicia Sesión'}
            </button>
        </div>
    </div>
);

const GamePlayer: React.FC<{
    game: Game;
    onClose: () => void;
    onGameComplete: (payload: { gameId: number; score: number }) => void;
}> = ({ game, onClose, onGameComplete }) => {
    
    const handleCompletion = useCallback((score: number) => {
        onGameComplete({ gameId: game.id, score });
    }, [onGameComplete, game.id]);
    
    const renderGame = () => {
        const { payload } = game;
        const props = { onComplete: handleCompletion, userHighScore: game.userHighScore };
        switch(game.type) {
            case 'trivia': return <TriviaGame questions={payload.questions || []} onClose={onClose} {...props} />;
            case 'memory': return <MemoryGame cards={payload.cards || []} {...props} />;
            case 'sorting': return <SortingGame items={payload.items || []} bins={payload.bins || []} duration={payload.duration || 60} {...props} />;
            case 'hangman': return <HangmanGame words={payload.words || []} {...props} />;
            case 'chain': return <RecyclingChainGame items={payload.items || []} bins={payload.bins || []} duration={payload.duration || 90} {...props} />;
            case 'catcher': return <WasteCatcherGame items={payload.fallingItems || []} lives={payload.lives || 3} {...props} />;
            case 'repair': return <RepairItGame items={payload.repairableItems || []} timePerItem={payload.timePerItem || 15} {...props} />;
            
            // New Placeholder Games
            case 'eco-quiz': return <EcoQuizGame {...props} />;
            case 'find-the-intruder': return <FindTheIntruderGame {...props} />;
            case 'recycling-path': return <RecyclingPathGame {...props} />;
            case 'river-cleaner': return <RiverCleanerGame {...props} />;
            case 'compost-sequence': return <CompostSequenceGame {...props} />;
            case 'myth-busters': return <MythBustersGame {...props} />;
            case 'concept-connector': return <ConceptConnectorGame {...props} />;
            case 'water-saver': return <WaterSaverGame {...props} />;
            case 'eco-wordle': return <EcoWordleGame {...props} />;
            case 'sustainable-builder': return <SustainableBuilderGame {...props} />;
            case 'energy-impact': return <EnergyImpactGame {...props} />;
            case 'nature-sounds': return <NatureSoundsGame {...props} />;
            case 'spot-the-difference': return <SpotTheDifferenceGame {...props} />;
            
            default: return <div>Juego no reconocido.</div>;
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col relative bg-surface">
            <header className="p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                <h2 className="text-xl font-bold text-text-main">{game.title}</h2>
                <button onClick={onClose} className="text-3xl leading-none px-2 rounded-full text-text-secondary hover:text-text-main transition-colors">&times;</button>
            </header>
            <div className="flex-1 p-2 sm:p-4 overflow-y-auto bg-background">
                {renderGame()}
            </div>
        </div>
    );
};

const GameEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (game: Omit<Game, 'id' | 'userHighScore'> & { id?: number }) => void;
    game: Game | null;
}> = ({ isOpen, onClose, onSave, game }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState('');
    const [type, setType] = useState<GameType>('trivia');
    const [learningObjective, setLearningObjective] = useState('');
    const [payload, setPayload] = useState<Game['payload']>({});

    const allGameTypes: GameType[] = [
        'trivia', 'memory', 'sorting', 'hangman', 'chain', 'catcher', 'repair',
        'eco-quiz', 'find-the-intruder', 'recycling-path', 'river-cleaner', 'compost-sequence',
        'myth-busters', 'concept-connector', 'water-saver', 'eco-wordle', 'sustainable-builder',
        'energy-impact', 'nature-sounds', 'spot-the-difference'
    ];

    useEffect(() => {
        if (isOpen) {
            if (game) {
                setTitle(game.title);
                setCategory(game.category);
                setImage(game.image);
                setType(game.type);
                setLearningObjective(game.learningObjective);
                setPayload(JSON.parse(JSON.stringify(game.payload))); // Deep copy
            } else {
                setTitle(''); setCategory('Conocimiento');
                setImage('https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=400');
                setType('trivia'); setLearningObjective('');
                setPayload({ points: 100, questions: [{ question: '', options: ['', '', ''], correctAnswer: 0 }] });
            }
        }
    }, [game, isOpen]);
    
    if (!isOpen) return null;

    const handleTypeChange = (newType: GameType) => {
        setType(newType);
        if (!game) { // Only reset payload for new games
            switch (newType) {
                case 'trivia': setPayload({ points: 100, questions: [{ question: '', options: ['', '', ''], correctAnswer: 0 }] }); break;
                case 'memory': setPayload({ points: 60, cards: [{ id: '1', content: '♻️', type: 'icon' }] }); break;
                case 'sorting': setPayload({ points: 75, duration: 60, items: [], bins: ['plastico', 'papel', 'vidrio', 'metales', 'organico'] }); break;
                case 'hangman': setPayload({ points: 40, words: [{ word: '', hint: '' }] }); break;
                case 'chain': setPayload({ points: 80, duration: 90, items: [], bins: ['plastico', 'papel', 'vidrio', 'metales', 'organico'] }); break;
                case 'catcher': setPayload({ points: 70, lives: 3, fallingItems: [] }); break;
                case 'repair': setPayload({ points: 65, timePerItem: 15, repairableItems: [] }); break;
                default: setPayload({ points: 50 }); break;
            }
        }
    };

    const handlePayloadChange = (field: string, value: any) => {
        setPayload(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: game?.id, title, category, image, type, learningObjective, payload });
    };

    const renderPayloadEditor = () => {
        const commonFields = (
             <div>
                <label>Puntos por Completar</label>
                <input type="number" value={payload.points || 0} onChange={e => handlePayloadChange('points', Number(e.target.value))} />
            </div>
        );
        
        switch (type) {
            case 'trivia':
                const questions = payload.questions as QuizQuestion[] || [];
                return <>
                    {commonFields}
                    <fieldset className="border border-slate-600 p-3 rounded-md mt-4">
                        <legend className="px-2 text-sm text-text-secondary">Preguntas</legend>
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="p-3 bg-background rounded-md border border-slate-700 mb-3">
                                <label className="text-xs">Pregunta {qIndex + 1}</label>
                                <input type="text" value={q.question} onChange={e => {
                                    const newQuestions = [...questions];
                                    newQuestions[qIndex].question = e.target.value;
                                    handlePayloadChange('questions', newQuestions);
                                }} className="mb-2" />
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <input type="radio" name={`correct-${qIndex}`} checked={q.correctAnswer === oIndex} onChange={() => {
                                                const newQuestions = [...questions];
                                                newQuestions[qIndex].correctAnswer = oIndex;
                                                handlePayloadChange('questions', newQuestions);
                                            }} />
                                            <input type="text" value={opt} onChange={e => {
                                                const newQuestions = [...questions];
                                                newQuestions[qIndex].options[oIndex] = e.target.value;
                                                handlePayloadChange('questions', newQuestions);
                                            }} placeholder={`Opción ${oIndex + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => handlePayloadChange('questions', [...questions, { question: '', options: ['', '', ''], correctAnswer: 0 }])} className="text-sm text-primary mt-2">+ Añadir Pregunta</button>
                    </fieldset>
                </>;
            case 'memory':
                const cards = payload.cards as MemoryCardData[] || [];
                return <>
                    {commonFields}
                    <fieldset className="border border-slate-600 p-3 rounded-md mt-4">
                        <legend className="px-2 text-sm text-text-secondary">Pares de Cartas (usar emojis)</legend>
                        <div className="grid grid-cols-4 gap-2">
                        {cards.map((c, index) => (
                           <div key={index} className="relative">
                             <input type="text" value={c.content} onChange={e => {
                                const newCards = [...cards];
                                newCards[index].content = e.target.value;
                                newCards[index].id = String(index + 1);
                                handlePayloadChange('cards', newCards);
                            }} className="text-center text-2xl p-2"/>
                            <button type="button" onClick={() => handlePayloadChange('cards', cards.filter((_, i) => i !== index))} className="absolute -top-1 -right-1 bg-red-600 text-white w-5 h-5 rounded-full text-xs">X</button>
                           </div>
                        ))}
                        </div>
                        <button type="button" onClick={() => handlePayloadChange('cards', [...cards, { id: String(cards.length + 1), content: '', type: 'icon' }])} className="text-sm text-primary mt-2">+ Añadir Par</button>
                    </fieldset>
                </>;
            case 'sorting':
                 const items = payload.items as SortableItemData[] || [];
                 const allBins: BinType[] = ['plastico', 'papel', 'vidrio', 'metales', 'organico'];
                 return <>
                    {commonFields}
                    <div>
                        <label>Duración (segundos)</label>
                        <input type="number" value={payload.duration || 60} onChange={e => handlePayloadChange('duration', Number(e.target.value))} />
                    </div>
                     <fieldset className="border border-slate-600 p-3 rounded-md mt-4">
                        <legend className="px-2 text-sm text-text-secondary">Objetos a Clasificar</legend>
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-3 gap-2 mb-2 items-center">
                                <input type="text" value={item.name} onChange={e => {
                                    const newItems = [...items]; newItems[index].name = e.target.value; handlePayloadChange('items', newItems);
                                }} placeholder="Nombre"/>
                                <input type="text" value={item.image} onChange={e => {
                                    const newItems = [...items]; newItems[index].image = e.target.value; handlePayloadChange('items', newItems);
                                }} placeholder="Emoji" className="text-center"/>
                                <select value={item.correctBin} onChange={e => {
                                    const newItems = [...items]; newItems[index].correctBin = e.target.value as BinType; handlePayloadChange('items', newItems);
                                }}>
                                    {allBins.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        ))}
                        <button type="button" onClick={() => handlePayloadChange('items', [...items, {id: `i${items.length+1}`, name: '', image: '', correctBin: 'plastico'}])} className="text-sm text-primary mt-2">+ Añadir Objeto</button>
                    </fieldset>
                 </>;
            default:
                return (
                    <div>
                        <label>Payload (Configuración del juego en JSON)</label>
                        <textarea value={JSON.stringify(payload, null, 2)} onChange={e => {
                           try {
                                setPayload(JSON.parse(e.target.value));
                           } catch (error) {
                               console.log("Invalid JSON in payload");
                           }
                        }} rows={10} className="font-mono text-sm"></textarea>
                    </div>
                );
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-xl font-bold text-text-main mb-4">{game ? 'Editar Juego' : 'Crear Nuevo Juego'}</h2>
                    <div className="space-y-4 modal-form">
                        <div><label>Título</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label>Categoría</label><input type="text" value={category} onChange={e => setCategory(e.target.value)} required /></div>
                            <div><label>Tipo de Juego</label>
                                <select value={type} onChange={e => handleTypeChange(e.target.value as GameType)}>
                                    {allGameTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div><label>URL de la Imagen</label><input type="text" value={image} onChange={e => setImage(e.target.value)} required /></div>
                        <div><label>Objetivo de Aprendizaje</label><input type="text" value={learningObjective} onChange={e => setLearningObjective(e.target.value)} required /></div>
                        
                        {renderPayloadEditor()}

                    </div>
                    <div className="flex justify-end space-x-3 pt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">Guardar Juego</button></div>
                </form>
            </div>
        </div>
    );
};

const JuegosPage: React.FC<{ user: User | null; onUserAction: (action: GamificationAction, payload?: any) => void; isAdminMode: boolean; }> = ({ user, onUserAction, isAdminMode }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeGame, setActiveGame] = useState<Game | null>(null);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Todos');

    const fetchGames = useCallback(async () => {
        setIsLoading(true);
        try {
            const url = user ? `http://localhost:3001/api/games?userId=${user.id}` : 'http://localhost:3001/api/games';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch games');
            const data = await response.json();
            setGames(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const gameCategories = useMemo(() => ['Todos', ...Array.from(new Set(games.map(g => g.category)))], [games]);

    const filteredGames = useMemo(() => {
        if (activeCategory === 'Todos') {
            return games;
        }
        return games.filter(g => g.category === activeCategory);
    }, [games, activeCategory]);

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
    }, [filteredGames]);

    const handleGameComplete = (payload: { gameId: number; score: number }) => {
        const completedGame = games.find(g => g.id === payload.gameId);
        if (completedGame && user) {
            const isNewHighScore = payload.score > completedGame.userHighScore;
            
            onUserAction('complete_game', { 
                gameId: payload.gameId, 
                score: payload.score, 
                points: completedGame.payload.points // EcoPoints
            });

            // Update UI optimistically
            setGames(prevGames => prevGames.map(g => 
                g.id === payload.gameId ? { ...g, userHighScore: isNewHighScore ? payload.score : g.userHighScore } : g
            ));

             // Close after a delay to show the final screen
            setTimeout(() => {
                setActiveGame(null);
            }, 4000);
        }
    };

    const handleOpenEditModal = (game: Game | null) => {
        setEditingGame(game);
        setIsEditModalOpen(true);
    };

    const handleSaveGame = async (gameToSave: Omit<Game, 'id' | 'userHighScore'> & { id?: number }) => {
        const isCreating = !gameToSave.id;
        const url = isCreating ? `http://localhost:3001/api/games` : `http://localhost:3001/api/games/${gameToSave.id}`;
        const method = isCreating ? 'POST' : 'PUT';
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameToSave)
            });
            if (!response.ok) throw new Error('Failed to save game');
            setIsEditModalOpen(false);
            fetchGames();
        } catch (error) {
            console.error("Error saving game:", error);
            alert('Failed to save game');
        }
    };
    
    const handleDeleteGame = async (gameId: number) => {
        if (window.confirm("¿Seguro que quieres eliminar este juego?")) {
            try {
                const response = await fetch(`http://localhost:3001/api/games/${gameId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete game');
                fetchGames();
            } catch (error) {
                console.error("Error deleting game:", error);
                alert('Failed to delete game');
            }
        }
    };

    return (
        <>
            <GameEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveGame} game={editingGame} />
            <div className="bg-background pt-20 relative min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12 animate-fade-in-up relative">
                        <h1 className="text-4xl font-extrabold font-display text-text-main sm:text-5xl">Sala de Juegos Educativos</h1>
                        <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">¡Aprende sobre reciclaje de la forma más divertida y gana EcoPuntos!</p>
                        {isAdminMode && (
                             <div className="mt-6">
                                <button onClick={() => handleOpenEditModal(null)} className="cta-button">
                                    + Crear Nuevo Juego
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="mb-8 flex flex-wrap justify-center gap-2">
                        {gameCategories.map(category => (
                            <button 
                                key={category} 
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                                    activeCategory === category 
                                    ? 'bg-primary text-white' 
                                    : 'bg-surface text-text-secondary hover:bg-slate-700'
                                }`}
                            >{category}</button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="text-center py-20 text-text-secondary">
                            <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Cargando juegos...
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredGames.map(game => (
                                <GameCard 
                                    key={game.id} 
                                    game={game}
                                    user={user}
                                    isAdminMode={isAdminMode}
                                    onPlay={setActiveGame}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleDeleteGame}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {activeGame && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
                    <div className="w-full max-w-4xl h-[95vh] max-h-[800px] bg-surface rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                       <GamePlayer 
                            game={activeGame}
                            onClose={() => setActiveGame(null)}
                            onGameComplete={handleGameComplete}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default JuegosPage;