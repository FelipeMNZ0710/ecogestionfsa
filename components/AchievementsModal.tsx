import React from 'react';
import type { User, Achievement } from '../types';

interface AchievementsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isAdminMode: boolean;
    onToggleAchievement: (achievementId: string, unlocked: boolean) => void;
}

const AchievementTile: React.FC<{ 
    achievement: Achievement, 
    isAdminMode: boolean, 
    onToggle: (id: string, unlocked: boolean) => void 
}> = ({ achievement, isAdminMode, onToggle }) => {
    const isUnlocked = achievement.unlocked;

    return (
        <div className={`achievement-tile ${isUnlocked ? 'unlocked' : 'locked'}`}>
            <div className="achievement-icon">
                {isUnlocked ? achievement.icon : '🔒'}
            </div>
            <div className="flex-grow">
                <h4 className="achievement-name">{achievement.name}</h4>
                <p className="achievement-desc">{achievement.description}</p>
            </div>
            {isAdminMode && (
                <div className="ml-4 flex-shrink-0">
                    <label className="custom-toggle-label">
                        <input 
                            type="checkbox" 
                            className="custom-toggle-input" 
                            checked={isUnlocked} 
                            onChange={(e) => onToggle(achievement.id, e.target.checked)}
                        />
                        <div className="custom-toggle-track">
                            <div className="custom-toggle-thumb"></div>
                        </div>
                    </label>
                </div>
            )}
        </div>
    );
};


const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, user, isAdminMode, onToggleAchievement }) => {
    if (!isOpen || !user) return null;

    const unlockedCount = user.achievements.filter(a => a.unlocked).length;
    const totalCount = user.achievements.length;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-3xl !max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-surface z-10">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Logros de {user.name}</h2>
                        <p className="text-sm text-text-secondary">Desbloqueados: {unlockedCount} de {totalCount}</p>
                    </div>
                    <button onClick={onClose} className="text-3xl leading-none px-2 text-text-secondary hover:text-text-main rounded-full transition-colors">&times;</button>
                </header>
                <div className="p-6">
                    <div className="achievements-grid">
                        {user.achievements.map(ach => (
                            <AchievementTile 
                                key={ach.id} 
                                achievement={ach}
                                isAdminMode={isAdminMode}
                                onToggle={onToggleAchievement}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementsModal;