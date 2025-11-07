import React, { useState, useEffect } from 'react';
import type { User, ChatMessage, Page } from '../types';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import { getBotResponseStream } from '../services/intelligentBotService';
import { allQuickQuestions } from '../data/quickQuestionsData';
import { getFromCache, setInCache } from '../services/cacheService';

interface ChatAssistantWidgetProps {
    user: User | null;
    setCurrentPage: (page: Page) => void;
}

const getShuffledQuestions = () => {
    return allQuickQuestions.sort(() => 0.5 - Math.random()).slice(0, 4);
};

const ChatAssistantWidget: React.FC<ChatAssistantWidgetProps> = ({ user, setCurrentPage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem('ecoChatHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Could not load chat history:", error);
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState<string[]>([]);

    useEffect(() => {
        try {
            localStorage.setItem('ecoChatHistory', JSON.stringify(messages));
        } catch (error) {
            console.error("Could not save chat history:", error);
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const typingMessageId = Date.now();
            const typingMessage: ChatMessage = { id: typingMessageId, text: '', sender: 'bot', isLoading: true };
            setMessages([typingMessage]);

            setTimeout(() => {
                setShuffledQuestions(getShuffledQuestions());
                
                let welcomeText: string;
                if (user) {
                    const firstName = user.name.split(' ')[0];
                    welcomeText = `¡Hola, ${firstName}! Soy Ecobot, tu asistente virtual de EcoGestión. 🤖\n\n¿Cómo puedo ayudarte a reciclar hoy?`;
                } else {
                    welcomeText = `¡Hola! Soy Ecobot, tu asistente virtual de EcoGestión. 🤖\n\n¿Cómo puedo ayudarte a reciclar hoy?`;
                }
                
                setMessages(prev => prev.map(m => 
                    m.id === typingMessageId ? { ...m, text: welcomeText, isLoading: false } : m
                ));
            }, 800);
        }
    }, [isOpen, user, messages.length]);

    const handleSend = async (text: string) => {
        const newUserMessage: ChatMessage = { id: Date.now(), text, sender: 'user' };
        setMessages(prev => [...prev, newUserMessage]);

        const cachedResponse = getFromCache(text);
        if (cachedResponse) {
            const cachedBotMessage: ChatMessage = { id: Date.now() + 1, text: cachedResponse, sender: 'bot' };
            setMessages(prev => [...prev, cachedBotMessage]);
            return;
        }

        setIsLoading(true);
        const botMessageId = Date.now() + 1;
        // Display "thinking" message immediately
        const thinkingMessage: ChatMessage = { id: botMessageId, text: '', sender: 'bot', isLoading: true };
        setMessages(prev => [...prev, thinkingMessage]);

        let fullResponse = '';
        let isFirstChunk = true;
        try {
            const stream = getBotResponseStream(text);
            for await (const chunk of stream) {
                if (isFirstChunk) {
                    // Replace "thinking" message with the first chunk
                    fullResponse = chunk;
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === botMessageId ? { ...msg, text: fullResponse, isLoading: false } : msg
                        )
                    );
                    isFirstChunk = false;
                } else {
                    fullResponse += chunk;
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === botMessageId ? { ...msg, text: fullResponse } : msg
                        )
                    );
                }
            }
        } catch (error) {
            console.error("Error streaming bot response:", error);
            const errorMessage = "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.";
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === botMessageId ? { ...msg, text: errorMessage, isLoading: false } : msg
                )
            );
        } finally {
            // If the stream was empty or failed before the first chunk
            if (isFirstChunk) {
                 setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
            }
            setIsLoading(false);
            if (fullResponse) {
                setInCache(text, fullResponse);
            }
        }
    };

    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        setIsOpen(false);
    };

    const handleFeedback = (messageId: number, feedback: 'like' | 'dislike') => {
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                msg.id === messageId
                    ? { ...msg, feedback: msg.feedback === feedback ? null : feedback }
                    : msg
            )
        );
    };
    
    const handleNewConversation = () => {
        setMessages([]);
    };

    return (
        <>
            <div className={`fixed bottom-5 right-5 z-[1000] transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-primary rounded-full shadow-lg text-white flex items-center justify-center hover:bg-primary-dark hover:scale-110 transition-transform"
                    aria-label="Abrir chat de ayuda"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM9 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm3-1.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm3 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM12 17.25c.39 0 .771.045 1.137.127a.75.75 0 0 1 .533.933l-.36 1.343a.75.75 0 0 1-1.46-.39l.234-.875a8.25 8.25 0 0 0-1.228 0l.234.875a.75.75 0 0 1-1.46.39l-.36-1.343a.75.75 0 0 1 .533-.933A9.76 9.76 0 0 1 12 17.25Z" /></svg>
                </button>
            </div>

            <div className={`fixed bottom-5 right-5 z-[1000] w-[calc(100%-2.5rem)] max-w-sm h-[70vh] max-h-[600px] bg-background rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 ease-out origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <header className="p-4 bg-surface rounded-t-2xl flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg text-text-main">Ecobot Asistente</h3>
                        <button onClick={handleNewConversation} className="text-xs text-text-secondary hover:underline">Nueva Conversación</button>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-3xl leading-none px-2 text-text-secondary hover:text-text-main rounded-full">&times;</button>
                </header>
                
                <ChatHistory 
                    messages={messages} 
                    isLoading={isLoading} 
                    showQuickQuestions={messages.length === 1 && !!messages[0].text && !messages[0].isLoading}
                    quickQuestions={shuffledQuestions}
                    onQuickQuestionClick={handleSend}
                    onNavigate={handleNavigate}
                    onFeedback={handleFeedback}
                />
                                
                <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>
        </>
    );
};

export default ChatAssistantWidget;