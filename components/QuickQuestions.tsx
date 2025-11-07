import React from 'react';

interface QuickQuestionsProps {
    questions: string[];
    onQuestionClick: (question: string) => void;
}

const QuickQuestions: React.FC<QuickQuestionsProps> = ({ questions, onQuestionClick }) => {
    return (
        <div className="flex flex-wrap gap-2">
            {questions.map(q => (
                <button 
                    key={q}
                    onClick={() => onQuestionClick(q)}
                    className="px-3 py-1 bg-surface text-text-secondary text-sm rounded-full hover:bg-slate-700 transition-colors"
                >
                    {q}
                </button>
            ))}
        </div>
    );
};

export default QuickQuestions;