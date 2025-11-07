
const { allAchievements } = require('../data/achievementsData');

const actionPoints = {
    send_message: 5,
    check_in: 25,
    report_punto_verde: 15,
    daily_login: 10,
    complete_quiz: 50,
    identify_object: 10,
};

const processAction = (user, action, payload) => {
    // Admins don't participate in the gamification system
    if (user.role === 'dueño' || user.role === 'moderador') {
        return { updatedUser: user, notifications: [] };
    }

    const updatedUser = { ...user };
    const stats = updatedUser.stats || {};
    const unlockedAchievements = new Set(updatedUser.unlocked_achievements || []);
    
    // Initialize stats if they don't exist
    stats.messagesSent = stats.messagesSent || 0;
    stats.pointsVisited = stats.pointsVisited || 0;
    stats.reportsMade = stats.reportsMade || 0;
    stats.dailyLogins = stats.dailyLogins || 0;
    stats.completedQuizzes = stats.completedQuizzes || [];
    stats.quizzesCompleted = stats.quizzesCompleted || 0;
    stats.gamesPlayed = stats.gamesPlayed || 0;
    stats.objectsIdentified = stats.objectsIdentified || 0;
    
    const notifications = [];
    let pointsToAdd = 0;

    if (action === 'complete_game') {
        pointsToAdd = payload?.points || 0;
    } else {
        pointsToAdd = actionPoints[action] || 0;
    }
    
    switch(action) {
        case 'send_message': stats.messagesSent++; break;
        case 'check_in': stats.pointsVisited++; break;
        case 'report_punto_verde': stats.reportsMade++; break;
        case 'daily_login': 
            stats.dailyLogins++; 
            updatedUser.last_login = new Date();
            break;
        case 'complete_quiz':
            if (payload?.material && !stats.completedQuizzes.includes(payload.material)) {
                stats.completedQuizzes.push(payload.material);
                stats.quizzesCompleted = stats.completedQuizzes.length;
            } else {
                pointsToAdd = 0;
            }
            break;
        case 'complete_game': stats.gamesPlayed++; break;
        case 'identify_object': stats.objectsIdentified++; break;
    }

    if (pointsToAdd > 0) {
        updatedUser.points = (updatedUser.points || 0) + pointsToAdd;
        notifications.push({
            type: 'points',
            title: '¡Puntos ganados!',
            message: `Ganaste ${pointsToAdd} EcoPuntos por esta acción.`,
            icon: '✨'
        });
    }

    // Check for new achievements
    allAchievements.forEach(achievementDef => {
        if (!unlockedAchievements.has(achievementDef.id)) {
            let isUnlocked = false;
            const { type, stat, value } = achievementDef.unlockCondition;

            if (type === 'points' && updatedUser.points >= value) {
                isUnlocked = true;
            } else if (type === 'stat' && stat && stats[stat] !== undefined) {
                const statValue = stats[stat];
                if (typeof statValue === 'number' && statValue >= value) {
                     isUnlocked = true;
                } else if (Array.isArray(statValue) && statValue.length >= value) {
                    isUnlocked = true;
                }
            }

            if (isUnlocked) {
                unlockedAchievements.add(achievementDef.id);
                notifications.push({
                    type: 'achievement',
                    title: '¡Logro Desbloqueado!',
                    message: `Conseguiste el logro: ${achievementDef.name}`,
                    icon: achievementDef.icon
                });
            }
        }
    });
    
    updatedUser.stats = stats;
    updatedUser.unlocked_achievements = Array.from(unlockedAchievements);

    return { updatedUser, notifications };
};

module.exports = { processAction };