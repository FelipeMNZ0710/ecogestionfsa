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
    const updatedUser = { ...user };
    const notifications = [];
    let pointsToAdd = 0;
    
    let stats = {};
    try {
        if (typeof user.stats === 'string' && user.stats.trim().startsWith('{')) {
            stats = JSON.parse(user.stats);
        } else if (typeof user.stats === 'object' && user.stats !== null) {
            stats = user.stats; // Already an object
        }
    } catch (e) { console.warn(`[Gamification] Corrupt stats for user ${user.id}. Resetting.`); }
    
    let unlockedAchievements = new Set();
    try {
        if (typeof user.unlocked_achievements === 'string' && user.unlocked_achievements.trim().startsWith('[')) {
            const parsed = JSON.parse(user.unlocked_achievements);
            if(Array.isArray(parsed)) unlockedAchievements = new Set(parsed);
        } else if (Array.isArray(user.unlocked_achievements)) {
            unlockedAchievements = new Set(user.unlocked_achievements);
        }
    } catch (e) { console.warn(`[Gamification] Corrupt achievements for user ${user.id}. Resetting.`); }

    const defaultStats = { messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 };
    stats = { ...defaultStats, ...stats };
    
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
                    icon: achievementDef.icon,
                    achievementId: achievementDef.id
                });
            }
        }
    });
    
    updatedUser.stats = stats;
    updatedUser.unlocked_achievements = Array.from(unlockedAchievements);

    return { updatedUser, notifications };
};

module.exports = { processAction };