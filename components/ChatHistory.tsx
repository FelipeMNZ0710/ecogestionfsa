import React, { useRef, useEffect } from 'react';
import type { ChatMessage, Page } from '../types';
import ChatMessageBubble from './ChatMessageBubble';
import QuickQuestions from './QuickQuestions';

interface ChatHistoryProps {
    messages: ChatMessage[];
    isLoading: boolean;
    showQuickQuestions: boolean;
    quickQuestions: string[];
    onQuickQuestionClick: (question: string) => void;
    onNavigate: (page: Page) => void;
    onFeedback: (messageId: number, feedback: 'like' | 'dislike') => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, showQuickQuestions, quickQuestions, onQuickQuestionClick, onNavigate, onFeedback }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, showQuickQuestions]);

    return (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
                <ChatMessageBubble key={msg.id} message={msg} onNavigate={onNavigate} onFeedback={onFeedback} />
            ))}
            
            {showQuickQuestions && (
                 <div className="pl-11 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <p className="text-xs text-text-secondary mb-2">O prueba una de estas preguntas:</p>
                    <QuickQuestions questions={quickQuestions} onQuestionClick={onQuickQuestionClick} />
                 </div>
            )}

            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default ChatHistory;