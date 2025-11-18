
import React from 'react';
import type { ChatMessage, Page } from '../types';
import { marked } from 'marked';

interface ChatMessageBubbleProps {
    message: ChatMessage;
    onNavigate: (page: Page) => void;
    onFeedback: (messageId: number, feedback: 'like' | 'dislike') => void;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, onNavigate, onFeedback }) => {
    const isUser = message.sender === 'user';
    const showTypingIndicator = message.sender === 'bot' && message.text === '' && !message.isLoading;

    const botAvatar = (
        <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center overflow-hidden" title="Ecobot">
            <img 
                src="https://cdn.discordapp.com/attachments/1435059807135596566/1440459315197644850/dise_o_de_la_cara_de_un_bot-removebg-preview.png?ex=691e3bc7&is=691cea47&hm=070eaa8d7916b08123839b2ece378c93ee01a1fec9628d31f7223fa2424dcc19&" 
                alt="Ecobot" 
                className="w-full h-full object-cover p-1" 
            />
        </div>
    );

    const userAvatar = (
         <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0" title="Tú"></div>
    );

    const typingIndicator = (
        <div className="typing-indicator flex items-center space-x-1.5 p-2">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
        </div>
    );

    const thinkingIndicator = (
         <div className="px-4 py-2 text-sm text-text-secondary animate-pulse-faint">
            Ecobot está pensando...
        </div>
    );
    
    const renderMessageContent = () => {
        const text = message.text;
        const buttonRegex = /\[BUTTON: (.*?)\]\((.*?)\)/g;
        const buttons: { text: string; url: string }[] = [];
        let match;

        while ((match = buttonRegex.exec(text)) !== null) {
            buttons.push({ text: match[1], url: match[2] });
        }
        
        const cleanedText = text.replace(buttonRegex, '').trim();

        const createMarkup = (txt: string) => {
            const sanitized = txt.endsWith('```') ? txt + '\u00A0' : txt;
            return { __html: marked.parse(sanitized) };
        };

        const handleButtonClick = (url: string) => {
            onNavigate(url as Page);
        };

        return (
            <>
                {cleanedText && <div className="prose-custom prose-sm text-inherit" dangerouslySetInnerHTML={createMarkup(cleanedText)} />}
                {buttons.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {buttons.map((btn, index) => (
                            <button
                                key={index}
                                onClick={() => handleButtonClick(btn.url)}
                                className="chat-action-button"
                            >
                                {btn.text}
                            </button>
                        ))}
                    </div>
                )}
            </>
        );
    };


    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}>
            {!isUser && botAvatar}
            <div className={`max-w-xs md:max-w-md rounded-2xl message-bubble-wrapper group relative ${isUser ? 'bg-primary text-white rounded-br-none' : 'bg-surface text-text-main rounded-bl-none'}`}>
                 <div className={`${showTypingIndicator || message.isLoading ? '' : 'px-4 py-2'}`}>
                    {message.isLoading
                        ? thinkingIndicator
                        : showTypingIndicator
                            ? typingIndicator
                            : renderMessageContent()
                    }
                 </div>

                 {!isUser && !showTypingIndicator && !message.isLoading && message.text && (
                     <div className="feedback-controls">
                         <button 
                            onClick={() => onFeedback(message.id, 'like')} 
                            className={`feedback-button ${message.feedback === 'like' ? 'selected' : ''}`}
                            aria-label="Me gusta"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.562 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                         </button>
                         <button 
                            onClick={() => onFeedback(message.id, 'dislike')} 
                            className={`feedback-button ${message.feedback === 'dislike' ? 'selected' : ''}`}
                            aria-label="No me gusta"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.642a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.438 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.2-2.667a4 4 0 00.8-2.4z" />
                            </svg>
                         </button>
                     </div>
                 )}
            </div>
             {isUser && userAvatar}
        </div>
    );
};

export default ChatMessageBubble;
