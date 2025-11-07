import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [message]);

    const handleSend = () => {
        if (message.trim() && !isLoading) {
            onSend(message.trim());
            setMessage('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 border-t border-white/10 flex items-center gap-2">
            <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-background border border-slate-600 rounded-lg p-2 resize-none focus:ring-2 focus:ring-primary focus:outline-none text-text-main max-h-28"
                rows={1}
                disabled={isLoading}
            />
            <button
                onClick={handleSend}
                disabled={isLoading || !message.trim()}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 text-white disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                aria-label="Enviar mensaje"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </div>
    );
};

export default ChatInput;
