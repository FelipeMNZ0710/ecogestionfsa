const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');
const comoReciclarData = require('./data/comoReciclarData');
const { processAction } = require('./services/gamificationService');
const gamesData = require('./data/gamesData');
const locationsData = require('./data/locationsData');
const newsData = require('./data/newsData');
const rewardsData = require('./data/rewardsData');
const { initialMessages, initialChannels } = require('./data/communityData');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const saltRounds = 10;

// --- Middlewares ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware to update user's last active time
const updateUserActivity = async (req, res, next) => {
    const userId = req.body.userId || req.query.userId || (req.user ? req.user.id : null) || (req.params.userId);
    if (userId && !isNaN(userId)) { // Ensure userId is valid
        try {
            await db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [userId]);
        } catch (error) {
            // Silent fail for activity update
        }
    }
    next();
};
app.use(updateUserActivity);

// --- Database Initialization Logic ---
const initializeDatabase = async () => {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('✅ Inicializando/Verificando tablas de la base de datos...');
        
        // --- Users Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              points INT DEFAULT 0,
              kg_recycled DECIMAL(10,2) DEFAULT 0.00,
              role ENUM('usuario','moderador','dueño') DEFAULT 'usuario',
              unlocked_achievements TEXT DEFAULT NULL,
              stats TEXT DEFAULT NULL,
              last_login TIMESTAMP NULL,
              last_active TIMESTAMP NULL DEFAULT NULL,
              favorite_locations TEXT DEFAULT NULL,
              banner_url TEXT DEFAULT NULL,
              profile_picture_url TEXT DEFAULT NULL,
              title VARCHAR(255) DEFAULT NULL,
              bio TEXT DEFAULT NULL,
              socials TEXT DEFAULT NULL
            );
        `);

        // --- Admin Default ---
        const [adminExists] = await connection.query('SELECT id FROM users WHERE role = "dueño" LIMIT 1');
        if (adminExists.length === 0) {
             const passwordHash = await bcrypt.hash('admin123', saltRounds);
             const defaultStats = JSON.stringify({ messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 });
             await connection.query(
                'INSERT INTO users (name, email, password_hash, role, stats, points) VALUES (?, ?, ?, ?, ?, ?)',
                ['Super Admin', 'admin@ecogestion.com', passwordHash, 'dueño', defaultStats, 10000]
            );
            console.log('✅ Usuario Admin creado: admin@ecogestion.com / admin123');
        }

        // --- Locations Table ---
        await connection.query(`
             CREATE TABLE IF NOT EXISTS locations (
              id VARCHAR(255) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              address VARCHAR(255) NOT NULL,
              description TEXT,
              hours VARCHAR(255),
              schedule JSON,
              materials JSON,
              map_data JSON,
              status ENUM('ok', 'reported', 'maintenance', 'serviced') NOT NULL DEFAULT 'ok',
              last_serviced DATE,
              check_ins INT DEFAULT 0,
              image_urls JSON,
              reportCount INT DEFAULT 0,
              latestReportReason VARCHAR(255) DEFAULT NULL
            );
        `);

        const [locCount] = await connection.query('SELECT COUNT(*) as count FROM locations');
        if (locCount[0].count === 0) {
            console.log('⏳ Insertando Puntos Verdes iniciales...');
            for (const loc of locationsData) {
                await connection.query(
                    'INSERT INTO locations (id, name, address, description, hours, schedule, materials, map_data, status, check_ins, image_urls) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [loc.id, loc.name, loc.address, loc.description, loc.hours, loc.schedule, loc.materials, loc.map_data, loc.status, loc.check_ins, loc.image_urls]
                );
            }
        }

        // --- Impact Stats ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS impact_stats (
              id INT AUTO_INCREMENT PRIMARY KEY,
              recycled_kg INT NOT NULL DEFAULT 0,
              participants INT NOT NULL DEFAULT 0,
              points INT NOT NULL DEFAULT 0
            );
        `);
        const [statsRows] = await connection.query('SELECT * FROM impact_stats WHERE id = 1');
        if (statsRows.length === 0) {
            await connection.query(`INSERT INTO impact_stats (id, recycled_kg, participants, points) VALUES (1, 14800, 5350, 48);`);
        }

        // --- News Articles ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS news_articles (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              excerpt TEXT NOT NULL,
              image LONGTEXT DEFAULT NULL,
              content JSON DEFAULT NULL,
              featured BOOLEAN DEFAULT FALSE,
              author_id INT DEFAULT NULL,
              published_at TIMESTAMP NOT NULL DEFAULT current_timestamp
            );
        `);

        const [newsCount] = await connection.query('SELECT COUNT(*) as count FROM news_articles');
        if (newsCount[0].count === 0) {
            console.log('⏳ Insertando Noticias iniciales...');
            for (const news of newsData) {
                await connection.query(
                    'INSERT INTO news_articles (title, category, excerpt, image, content, featured) VALUES (?, ?, ?, ?, ?, ?)',
                    [news.title, news.category, news.excerpt, news.image, news.content, news.featured]
                );
            }
        }

        // --- Games Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS games (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              image VARCHAR(255) NOT NULL,
              type VARCHAR(50) NOT NULL,
              learningObjective TEXT NOT NULL,
              payload JSON DEFAULT NULL,
              rating DECIMAL(3,2) DEFAULT 3.50,
              ratings_count INT DEFAULT 0
            );
        `);
        
        const [gameRows] = await connection.query('SELECT COUNT(*) as count FROM games');
        if (gameRows[0].count < gamesData.length) {
            console.log('⏳ Actualizando catálogo de juegos...');
            for (const g of gamesData) {
                await connection.query(
                    'INSERT INTO games (id, title, category, image, type, learningObjective, payload, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title)',
                    [g.id, g.title, g.category, g.image, g.type, g.learningObjective, JSON.stringify(g.payload), g.rating]
                );
            }
        }

        // --- Rewards Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rewards (
              id VARCHAR(255) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT NOT NULL,
              cost INT NOT NULL,
              category ENUM('Descuentos', 'Digital', 'Donaciones', 'Productos') NOT NULL,
              image LONGTEXT,
              stock INT DEFAULT NULL,
              file_name VARCHAR(255) DEFAULT NULL,
              file_data LONGTEXT DEFAULT NULL,
              coupon_duration_value INT DEFAULT 24,
              coupon_duration_unit ENUM('horas', 'días') DEFAULT 'horas'
            );
        `);
        
        const [rewardCount] = await connection.query('SELECT COUNT(*) as count FROM rewards');
        if (rewardCount[0].count === 0) {
            console.log('⏳ Insertando Recompensas iniciales...');
            for (const r of rewardsData) {
                 await connection.query(
                    'INSERT INTO rewards (id, title, description, cost, category, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [r.id, r.title, r.description, r.cost, r.category, r.image, r.stock]
                );
            }
        }

        // --- Other Tables ---
        await connection.query(`
             CREATE TABLE IF NOT EXISTS user_game_scores (
              user_id INT NOT NULL,
              game_id INT NOT NULL,
              high_score INT NOT NULL DEFAULT 0,
              PRIMARY KEY (user_id, game_id),
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS reports (
              id INT AUTO_INCREMENT PRIMARY KEY,
              location_id VARCHAR(255) NOT NULL,
              user_id INT NOT NULL,
              reason ENUM('full', 'dirty', 'damaged', 'other') NOT NULL,
              comment TEXT,
              image_url LONGTEXT,
              status ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
              reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              subject VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              status ENUM('unread', 'read', 'archived') NOT NULL DEFAULT 'unread',
              submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS community_channels (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL UNIQUE,
              description TEXT,
              admin_only_write BOOLEAN DEFAULT FALSE
            );
        `);

        // Ensure initial channels exist
        for (const channel of initialChannels) {
            await connection.query(
                'INSERT IGNORE INTO community_channels (id, name, description, admin_only_write) VALUES (?, ?, ?, ?)',
                [channel.id, channel.name, channel.description, channel.admin_only_write]
            );
        }

        await connection.query(`
            CREATE TABLE IF NOT EXISTS community_messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              channel_id INT NOT NULL,
              user_id INT NOT NULL,
              content TEXT NOT NULL,
              image_url LONGTEXT DEFAULT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              edited BOOLEAN DEFAULT FALSE,
              reactions JSON,
              replying_to_message_id INT DEFAULT NULL,
              FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
            );
        `);

        // Seed initial messages if empty
        const [msgCount] = await connection.query('SELECT COUNT(*) as count FROM community_messages');
        if (msgCount[0].count === 0) {
            // ... Seeding logic would go here, but requires valid user IDs. Skipping for now.
        }

        // --- NOTIFICATIONS TABLE AND FIX ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('mention', 'reply', 'achievement', 'points') NOT NULL,
                data JSON NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // 🛠️ AUTO-FIX: Detect and Add 'data' column if missing
        try {
            const [columns] = await connection.query("SHOW COLUMNS FROM notifications LIKE 'data'");
            if (columns.length === 0) {
                console.log("⚠️ Detectada tabla 'notifications' antigua. Agregando columna 'data'...");
                await connection.query("ALTER TABLE notifications ADD COLUMN data JSON NOT NULL");
                console.log("✅ Columna 'data' agregada exitosamente.");
            }
        } catch (migErr) {
            console.error("⚠️ Error verificando/migrando tabla notifications:", migErr.message);
        }

         await connection.query(`
            CREATE TABLE IF NOT EXISTS user_redeemed_rewards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                reward_id VARCHAR(255) NOT NULL,
                code VARCHAR(255) NOT NULL UNIQUE,
                status ENUM('active','used','expired') NOT NULL DEFAULT 'active',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
            );
        `);
        
    } catch (err) {
        console.error('❌ ERROR CRÍTICO DB:', err);
    } finally {
        if (connection) connection.release();
    }
};

const startServer = async () => {
    await initializeDatabase();
    app.listen(port, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });
};

startServer();

// --- HELPER FUNCTIONS ---
const getUserById = async (userId) => {
    if (!userId) return null;
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) return null;
    const user = userRows[0];
    
    // Parsing JSON safely
    const parse = (str, def) => {
        try { return str ? JSON.parse(str) : def; } catch { return def; }
    };
    
    // Unlock achievements
    const allAchievements = require('./data/achievementsData').allAchievements;
    const unlockedIds = new Set(parse(user.unlocked_achievements, []));
    const userAchievements = allAchievements.map(ach => ({...ach, unlocked: unlockedIds.has(ach.id)}));

    // Stats defaults
    const defaultStats = { messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 };
    const parsedStats = parse(user.stats, {});
    const mergedStats = { ...defaultStats, ...parsedStats };

    // Mapeo explícito de snake_case (DB) a camelCase (Frontend)
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        kgRecycled: user.kg_recycled || 0,
        role: user.role,
        achievements: userAchievements,
        stats: mergedStats,
        profilePictureUrl: user.profile_picture_url,
        bannerUrl: user.banner_url,
        title: user.title,
        bio: user.bio,
        favoriteLocations: parse(user.favorite_locations, []),
        socials: parse(user.socials, {}),
        lastLogin: user.last_login ? new Date(user.last_login).toISOString().split('T')[0] : null,
    };
};


// --- ENDPOINTS ---

// Auth
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Datos incompletos' });
    try {
        const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(409).json({ message: 'Email ya registrado' });
        
        const hash = await bcrypt.hash(password, saltRounds);
        const defaultStats = JSON.stringify({ messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 });
        
        const [result] = await db.query('INSERT INTO users (name, email, password_hash, stats) VALUES (?, ?, ?, ?)', [name, email, hash, defaultStats]);
        const newUser = await getUserById(result.insertId);
        res.status(201).json(newUser);
    } catch (e) { res.status(500).json({ message: 'Error del servidor' }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ message: 'Credenciales inválidas' });
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });
        
        const fullUser = await getUserById(user.id);
        res.json(fullUser);
    } catch (e) { res.status(500).json({ message: 'Error del servidor' }); }
});

// Gamification
app.post('/api/user-action', async (req, res) => {
    const { userId, action, payload } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        
        const user = rows[0];
        const { updatedUser, notifications } = processAction(user, action, payload);
        
        await db.query('UPDATE users SET points = ?, stats = ?, unlocked_achievements = ?, last_login = ? WHERE id = ?', 
            [updatedUser.points, JSON.stringify(updatedUser.stats), JSON.stringify(updatedUser.unlocked_achievements), updatedUser.last_login, userId]);
        
        // High Score Logic
        if (action === 'complete_game' && payload?.gameId && payload?.score) {
            await db.query(`INSERT INTO user_game_scores (user_id, game_id, high_score) VALUES (?, ?, ?) 
                            ON DUPLICATE KEY UPDATE high_score = GREATEST(high_score, VALUES(high_score))`, 
                            [userId, payload.gameId, payload.score]);
        }

        // Notifications
        for (const n of notifications) {
             if(n.type === 'achievement') {
                const def = require('./data/achievementsData').allAchievements.find(a => a.id === n.achievementId);
                if(def) await db.query('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [userId, 'achievement', JSON.stringify(def)]);
             } else {
                 await db.query('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [userId, 'points', JSON.stringify(n)]);
             }
        }

        const finalUser = await getUserById(userId);
        res.json({ updatedUser: finalUser, notifications });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Error en gamificación' }); }
});

// Data Endpoints
app.get('/api/locations', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM locations');
        res.json(rows);
    } catch (e) { res.status(500).json({ message: 'Error obteniendo puntos verdes' }); }
});

app.get('/api/news', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM news_articles ORDER BY published_at DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ message: 'Error obteniendo noticias' }); }
});

app.get('/api/games', async (req, res) => {
    const { userId } = req.query;
    try {
        const [games] = await db.query('SELECT * FROM games');
        if (userId) {
            const [scores] = await db.query('SELECT game_id, high_score FROM user_game_scores WHERE user_id = ?', [userId]);
            const scoreMap = {};
            scores.forEach(s => scoreMap[s.game_id] = s.high_score);
            res.json(games.map(g => ({ ...g, userHighScore: scoreMap[g.id] || 0 })));
        } else {
            res.json(games.map(g => ({ ...g, userHighScore: 0 })));
        }
    } catch (e) { res.status(500).json({ message: 'Error juegos' }); }
});

app.get('/api/recycling-guides', (req, res) => res.json(comoReciclarData));
app.get('/api/impact-stats', async (req, res) => {
    const [rows] = await db.query('SELECT recycled_kg as recycledKg, participants, points FROM impact_stats WHERE id = 1');
    res.json(rows[0] || { recycledKg: 0, participants: 0, points: 0 });
});

// --- PROFILE API ---
app.get('/api/users/profile/:id', async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user);
    } catch (e) { res.status(500).json({ message: 'Error' }); }
});

app.put('/api/users/profile/:id', async (req, res) => {
    const { name, title, bio, bannerUrl, profilePictureUrl, points, kgRecycled, role } = req.body;
    const updates = [];
    const params = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (bio !== undefined) { updates.push('bio = ?'); params.push(bio); }
    if (bannerUrl !== undefined) { updates.push('banner_url = ?'); params.push(bannerUrl); }
    if (profilePictureUrl !== undefined) { updates.push('profile_picture_url = ?'); params.push(profilePictureUrl); }
    if (points !== undefined) { updates.push('points = ?'); params.push(points); }
    if (kgRecycled !== undefined) { updates.push('kg_recycled = ?'); params.push(kgRecycled); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }

    if (updates.length === 0) return res.json(await getUserById(req.params.id));

    params.push(req.params.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json(await getUserById(req.params.id));
});

app.put('/api/users/favorites', async (req, res) => {
    const { userId, locationId } = req.body;
    const user = await getUserById(userId);
    if(!user) return res.status(404).json({message: 'User not found'});
    
    // usar user.favoriteLocations (que ahora viene en camelCase desde getUserById)
    let favorites = user.favoriteLocations || [];
    if (favorites.includes(locationId)) {
        favorites = favorites.filter(id => id !== locationId);
    } else {
        favorites.push(locationId);
    }
    
    await db.query('UPDATE users SET favorite_locations = ? WHERE id = ?', [JSON.stringify(favorites), userId]);
    res.json(await getUserById(userId));
});

// --- NOTIFICATIONS ---
app.get('/api/notifications/unread-count/:userId', async (req, res) => {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE', [req.params.userId]);
    res.json({ totalUnread: rows[0].count });
});

app.get('/api/notifications/:userId', async (req, res) => {
    const [rows] = await db.query("SELECT id, type, data, is_read, created_at as time FROM notifications WHERE user_id = ? AND type IN ('mention', 'reply') ORDER BY created_at DESC", [req.params.userId]);
     const notifications = rows.map(row => {
        let data = {};
        try { 
            const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data; 
            if (parsed) data = parsed;
        } catch(e) {}
        
        // Safety check if data is null
        data = data || {};

        return {
             id: row.id,
             type: row.type,
             is_read: row.is_read,
             time: row.time,
             icon: '💬',
             fromUser: data?.fromUser || 'Sistema',
             channel: data?.channelName || 'general',
             channelId: data?.channelId || 1,
             messageId: data?.messageId || 0,
             messageSnippet: data?.content || '',
             repliedTo: data?.repliedTo || undefined
        };
    });
    res.json(notifications);
});

app.get('/api/notifications/profile/:userId', async (req, res) => {
    const [rows] = await db.query("SELECT id, type, data, created_at as time FROM notifications WHERE user_id = ? AND type IN ('achievement', 'points') ORDER BY created_at DESC", [req.params.userId]);
    const notifications = rows.map(row => {
        let data = {};
        try { 
            const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data; 
            if (parsed) data = parsed;
        } catch(e) {}

        // Safety check if data is null
        data = data || {};
        
        return {
             id: row.id,
             type: row.type,
             time: row.time,
             title: data?.title || (row.type === 'points' ? '¡Puntos ganados!' : '¡Logro Desbloqueado!'),
             message: data?.message || '',
             icon: data?.icon || (row.type === 'points' ? '✨' : '🏆')
        };
    });
    res.json(notifications);
});

app.put('/api/notifications/mark-all-read/:userId', async (req, res) => {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.params.userId]);
    res.sendStatus(200);
});

// --- COMMUNITY ---
app.get('/api/community/channels', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM community_channels');
    res.json(rows.map(c => ({...c, unreadCount: 0})));
});

app.post('/api/community/channels', async (req, res) => {
    const { name, description, admin_only_write } = req.body;
    try {
        const [result] = await db.query('INSERT INTO community_channels (name, description, admin_only_write) VALUES (?, ?, ?)', [name, description, admin_only_write]);
        res.status(201).json({ id: result.insertId, name, description, admin_only_write });
    } catch (e) { res.status(500).json({ message: 'Error creating channel' }); }
});

app.delete('/api/community/channels/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM community_channels WHERE id = ?', [req.params.id]);
        res.sendStatus(200);
    } catch (e) { res.status(500).json({ message: 'Error deleting channel' }); }
});

app.get('/api/community/members', async (req, res) => {
    const [rows] = await db.query('SELECT id, name, profile_picture_url, role FROM users');
    const members = rows.map(u => ({
        id: u.id,
        name: u.name,
        profile_picture_url: u.profile_picture_url,
        is_admin: u.role === 'dueño' || u.role === 'moderador',
        is_online: false 
    }));
    res.json(members);
});

app.get('/api/community/messages/:channelId', async (req, res) => {
    const [rows] = await db.query(`
        SELECT m.*, u.name as user, u.profile_picture_url as avatarUrl, u.role as userRole, u.title as userTitle
        FROM community_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.channel_id = ?
        ORDER BY m.created_at ASC
    `, [req.params.channelId]);
    
    const messages = await Promise.all(rows.map(async (msg) => {
        let replyingTo = null;
        if (msg.replying_to_message_id) {
             const [replyRows] = await db.query('SELECT m.content, u.name FROM community_messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?', [msg.replying_to_message_id]);
             if (replyRows.length > 0) {
                 replyingTo = { messageId: msg.replying_to_message_id, user: replyRows[0].name, text: replyRows[0].content };
             }
        }
        
        return {
            id: msg.id,
            user_id: msg.user_id,
            user: msg.user,
            avatarUrl: msg.avatarUrl,
            userRole: msg.userRole,
            userTitle: msg.userTitle,
            timestamp: msg.created_at,
            text: msg.content,
            imageUrl: msg.image_url,
            edited: msg.edited,
            reactions: typeof msg.reactions === 'string' ? JSON.parse(msg.reactions || '{}') : (msg.reactions || {}),
            replyingTo
        };
    }));
    
    res.json(messages);
});

app.post('/api/community/messages', async (req, res) => {
    const { channelId, userId, content, replyingToId, imageUrl } = req.body;
    const [result] = await db.query(
        'INSERT INTO community_messages (channel_id, user_id, content, replying_to_message_id, image_url) VALUES (?, ?, ?, ?, ?)',
        [channelId, userId, content, replyingToId, imageUrl]
    );

    // Check for mentions in content (@Name)
    const mentions = content.match(/@(\w+(\s\w+)*)/g);
    if (mentions) {
        for (const mention of mentions) {
            const name = mention.substring(1); // remove @
            const [userRows] = await db.query('SELECT id FROM users WHERE name = ?', [name]);
            if (userRows.length > 0) {
                const targetUserId = userRows[0].id;
                if (targetUserId !== userId) {
                    // Fetch sender info for notification
                    const [senderRows] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
                    const [channelRows] = await db.query('SELECT name FROM community_channels WHERE id = ?', [channelId]);
                    
                    const notifData = {
                        fromUser: senderRows[0].name,
                        channelName: channelRows[0].name,
                        channelId: channelId,
                        messageId: result.insertId,
                        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
                    };
                    
                    await db.query("INSERT INTO notifications (user_id, type, data) VALUES (?, 'mention', ?)", [targetUserId, JSON.stringify(notifData)]);
                }
            }
        }
    }
    
    // Check for replies
    if (replyingToId) {
         const [msgRows] = await db.query('SELECT user_id, content FROM community_messages WHERE id = ?', [replyingToId]);
         if (msgRows.length > 0 && msgRows[0].user_id !== userId) {
            const [senderRows] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
            const [channelRows] = await db.query('SELECT name FROM community_channels WHERE id = ?', [channelId]);

             const notifData = {
                fromUser: senderRows[0].name,
                channelName: channelRows[0].name,
                channelId: channelId,
                messageId: result.insertId,
                content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                repliedTo: msgRows[0].content.substring(0, 30) + '...'
            };
            await db.query("INSERT INTO notifications (user_id, type, data) VALUES (?, 'reply', ?)", [msgRows[0].user_id, JSON.stringify(notifData)]);
         }
    }

    res.sendStatus(201);
});

app.put('/api/community/messages/:id', async (req, res) => {
    const { content } = req.body;
    await db.query('UPDATE community_messages SET content = ?, edited = TRUE WHERE id = ?', [content, req.params.id]);
    res.sendStatus(200);
});

app.delete('/api/community/messages/:id', async (req, res) => {
    await db.query('DELETE FROM community_messages WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
});

app.post('/api/community/messages/:id/react', async (req, res) => {
    const { userName, emoji } = req.body;
    const [rows] = await db.query('SELECT reactions FROM community_messages WHERE id = ?', [req.params.id]);
    if(rows.length === 0) return res.sendStatus(404);
    
    let reactions = {};
    try { reactions = JSON.parse(rows[0].reactions || '{}'); } catch(e) {}
    
    if (!reactions[emoji]) reactions[emoji] = [];
    
    if (reactions[emoji].includes(userName)) {
        reactions[emoji] = reactions[emoji].filter(u => u !== userName);
        if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
        reactions[emoji].push(userName);
    }
    
    await db.query('UPDATE community_messages SET reactions = ? WHERE id = ?', [JSON.stringify(reactions), req.params.id]);
    res.sendStatus(200);
});


// --- REWARDS ---
app.get('/api/rewards', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM rewards');
    res.json(rows);
});

app.post('/api/redeem-reward', async (req, res) => {
    const { userId, rewardId } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const [userRows] = await connection.query('SELECT points FROM users WHERE id = ?', [userId]);
        const [rewardRows] = await connection.query('SELECT * FROM rewards WHERE id = ?', [rewardId]);
        
        if (userRows.length === 0 || rewardRows.length === 0) throw new Error('Usuario o recompensa no encontrados');
        
        const user = userRows[0];
        const reward = rewardRows[0];
        
        if (user.points < reward.cost) throw new Error('Puntos insuficientes');
        if (reward.stock !== null && reward.stock <= 0) throw new Error('Sin stock');
        
        // Deduct points
        await connection.query('UPDATE users SET points = points - ? WHERE id = ?', [reward.cost, userId]);
        
        // Reduce stock
        if (reward.stock !== null) {
            await connection.query('UPDATE rewards SET stock = stock - 1 WHERE id = ?', [rewardId]);
        }
        
        // Create redemption record
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (reward.coupon_duration_value * (reward.coupon_duration_unit === 'días' ? 24 : 1)));
        
        await connection.query(
            'INSERT INTO user_redeemed_rewards (user_id, reward_id, code, expires_at) VALUES (?, ?, ?, ?)',
            [userId, rewardId, code, expiresAt]
        );
        
        await connection.commit();
        
        const updatedUser = await getUserById(userId);
        const rewardWithFile = reward.category === 'Digital' ? { fileName: reward.file_name, fileData: reward.file_data } : null;
        
        res.json({ updatedUser, rewardWithFile });
        
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
});

app.get('/api/users/:id/redeemed-rewards', async (req, res) => {
    const [rows] = await db.query(`
        SELECT ur.*, r.title as rewardTitle, r.image as rewardImage, r.category 
        FROM user_redeemed_rewards ur 
        JOIN rewards r ON ur.reward_id = r.id 
        WHERE ur.user_id = ? 
        ORDER BY ur.created_at DESC
    `, [req.params.id]);
    
    const formatted = rows.map(r => ({
        id: r.id,
        rewardTitle: r.rewardTitle,
        rewardImage: r.rewardImage,
        code: r.code,
        status: new Date() > new Date(r.expires_at) && r.status === 'active' ? 'expired' : r.status,
        expiresAt: r.expires_at
    }));
    
    res.json(formatted);
});

app.put('/api/users/:id/achievements', async (req, res) => {
     const { achievementId, unlocked } = req.body;
     const userId = req.params.id;
     const user = await getUserById(userId);
     if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
     
     const currentAchievements = new Set(user.achievements.filter(a => a.unlocked).map(a => a.id));
     if (unlocked) currentAchievements.add(achievementId);
     else currentAchievements.delete(achievementId);
     
     await db.query('UPDATE users SET unlocked_achievements = ? WHERE id = ?', [JSON.stringify(Array.from(currentAchievements)), userId]);
     res.json(await getUserById(userId));
});

// --- ADMIN ENDPOINTS ---
// Middleware mock for admin check - in production use JWT
const checkAdmin = async (req, res, next) => {
    const adminId = req.query.adminUserId || req.body.adminUserId;
    if (!adminId) return res.status(403).json({ message: 'No autorizado' });
    const user = await getUserById(adminId);
    if (user && (user.role === 'dueño' || user.role === 'moderador')) next();
    else res.status(403).json({ message: 'No tienes permisos de administrador' });
};

app.get('/api/admin/messages', checkAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contact_messages ORDER BY submitted_at DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ message: 'Error DB Mensajes' }); }
});

app.get('/api/admin/reports', checkAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.name as userName, l.name as locationName 
            FROM reports r 
            JOIN users u ON r.user_id = u.id 
            JOIN locations l ON r.location_id = l.id 
            ORDER BY r.reported_at DESC
        `);
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Error DB Reportes' }); }
});

app.get('/api/admin/users', checkAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role, points FROM users');
        res.json(rows);
    } catch (e) { res.status(500).json({ message: 'Error DB Usuarios' }); }
});

app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        await db.query('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)', [name, email, subject, message]);
        res.status(201).json({ message: 'Mensaje enviado' });
    } catch (e) { res.status(500).json({ message: 'Error enviando mensaje' }); }
});

// --- Generic Update Status ---
app.put('/api/admin/messages/:id', checkAdmin, async (req, res) => {
    const { status } = req.body;
    await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
});

app.put('/api/admin/reports/:id', checkAdmin, async (req, res) => {
    const { status } = req.body;
    await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await db.query(`
        SELECT r.*, u.name as userName, l.name as locationName 
        FROM reports r 
        JOIN users u ON r.user_id = u.id 
        JOIN locations l ON r.location_id = l.id 
        WHERE r.id = ?`, [req.params.id]);
    res.json(updated[0]);
});

// Admin Delete Endpoints
app.delete('/api/admin/messages/:id', checkAdmin, async (req, res) => {
    await db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
});

app.delete('/api/admin/reports/:id', checkAdmin, async (req, res) => {
    await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
});

app.delete('/api/admin/users/:id', checkAdmin, async (req, res) => {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
});

// Admin Update User
app.put('/api/admin/users/:id', checkAdmin, async (req, res) => {
    const { name, role, points } = req.body;
    const updates = [];
    const params = [];
    if(name) { updates.push('name = ?'); params.push(name); }
    if(role) { updates.push('role = ?'); params.push(role); }
    if(points !== undefined) { updates.push('points = ?'); params.push(points); }
    
    if(updates.length > 0) {
        params.push(req.params.id);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    res.json(await getUserById(req.params.id));
});

// Admin Manage Achievements of specific user
app.put('/api/admin/users/:id/achievements', checkAdmin, async (req, res) => {
     const { achievementId, unlocked } = req.body;
     const userId = req.params.id;
     const user = await getUserById(userId);
     if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
     
     const currentAchievements = new Set(user.achievements.filter(a => a.unlocked).map(a => a.id));
     if (unlocked) currentAchievements.add(achievementId);
     else currentAchievements.delete(achievementId);
     
     await db.query('UPDATE users SET unlocked_achievements = ? WHERE id = ?', [JSON.stringify(Array.from(currentAchievements)), userId]);
     res.json(await getUserById(userId));
});

// Report creation from frontend
app.post('/api/locations/report', async (req, res) => {
    const { locationId, userId, reason, comment, imageUrl } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO reports (location_id, user_id, reason, comment, image_url) VALUES (?, ?, ?, ?, ?)',
            [locationId, userId, reason, comment, imageUrl]
        );
        
        // Update location status to 'reported'
        await db.query('UPDATE locations SET status = ?, reportCount = reportCount + 1, latestReportReason = ? WHERE id = ?', ['reported', reason, locationId]);
        
        const [updatedLoc] = await db.query('SELECT * FROM locations WHERE id = ?', [locationId]);
        res.json(updatedLoc[0]);
    } catch (e) { res.status(500).json({ message: 'Error creating report' }); }
});

// Location management
app.post('/api/locations', async (req, res) => {
    const loc = req.body;
    await db.query(
        'INSERT INTO locations (id, name, address, description, hours, schedule, materials, map_data, status, check_ins, image_urls) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [loc.id, loc.name, loc.address, loc.description, loc.hours, JSON.stringify(loc.schedule), JSON.stringify(loc.materials), JSON.stringify(loc.mapData), loc.status, loc.checkIns, JSON.stringify(loc.imageUrls)]
    );
    res.sendStatus(201);
});

app.put('/api/locations/:id', async (req, res) => {
    const loc = req.body;
    await db.query(
        'UPDATE locations SET name=?, address=?, description=?, hours=?, materials=?, map_data=?, status=?, image_urls=? WHERE id=?',
        [loc.name, loc.address, loc.description, loc.hours, JSON.stringify(loc.materials), JSON.stringify(loc.mapData), loc.status, JSON.stringify(loc.imageUrls), req.params.id]
    );
    res.sendStatus(200);
});

app.delete('/api/locations/:id', async (req, res) => {
    await db.query('DELETE FROM locations WHERE id=?', [req.params.id]);
    res.sendStatus(200);
});

// News management
app.post('/api/news', async (req, res) => {
    const n = req.body;
    await db.query(
        'INSERT INTO news_articles (title, category, excerpt, image, content, featured) VALUES (?, ?, ?, ?, ?, ?)',
        [n.title, n.category, n.excerpt, n.image, JSON.stringify(n.content), n.featured]
    );
    res.sendStatus(201);
});

app.put('/api/news/:id', async (req, res) => {
    const n = req.body;
    await db.query(
        'UPDATE news_articles SET title=?, category=?, excerpt=?, image=?, content=?, featured=? WHERE id=?',
        [n.title, n.category, n.excerpt, n.image, JSON.stringify(n.content), n.featured, req.params.id]
    );
    res.sendStatus(200);
});

app.delete('/api/news/:id', async (req, res) => {
    await db.query('DELETE FROM news_articles WHERE id=?', [req.params.id]);
    res.sendStatus(200);
});

// Rewards Management
app.post('/api/rewards', async (req, res) => {
    const r = req.body;
    await db.query(
        'INSERT INTO rewards (id, title, description, cost, category, image, stock, file_name, file_data, coupon_duration_value, coupon_duration_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.title, r.description, r.cost, r.category, r.image, r.stock, r.fileName, r.fileData, r.couponDurationValue, r.couponDurationUnit]
    );
    res.sendStatus(201);
});

app.put('/api/rewards/:id', async (req, res) => {
    const r = req.body;
    await db.query(
        'UPDATE rewards SET title=?, description=?, cost=?, category=?, image=?, stock=?, file_name=?, file_data=?, coupon_duration_value=?, coupon_duration_unit=? WHERE id=?',
        [r.title, r.description, r.cost, r.category, r.image, r.stock, r.fileName, r.fileData, r.couponDurationValue, r.couponDurationUnit, req.params.id]
    );
    res.sendStatus(200);
});

app.delete('/api/rewards/:id', async (req, res) => {
    await db.query('DELETE FROM rewards WHERE id=?', [req.params.id]);
    res.sendStatus(200);
});

// Stats Update
app.put('/api/impact-stats', checkAdmin, async (req, res) => {
    const { recycledKg, participants, points } = req.body;
    await db.query('UPDATE impact_stats SET recycled_kg=?, participants=?, points=? WHERE id=1', [recycledKg, participants, points]);
    res.sendStatus(200);
});

// Games Management
app.post('/api/games', async (req, res) => {
    const g = req.body;
    const [result] = await db.query(
        'INSERT INTO games (title, category, image, type, learningObjective, payload) VALUES (?, ?, ?, ?, ?, ?)',
        [g.title, g.category, g.image, g.type, g.learningObjective, JSON.stringify(g.payload)]
    );
    res.sendStatus(201);
});

app.put('/api/games/:id', async (req, res) => {
    const g = req.body;
    await db.query(
        'UPDATE games SET title=?, category=?, image=?, type=?, learningObjective=?, payload=? WHERE id=?',
        [g.title, g.category, g.image, g.type, g.learningObjective, JSON.stringify(g.payload), req.params.id]
    );
    res.sendStatus(200);
});

app.delete('/api/games/:id', async (req, res) => {
    await db.query('DELETE FROM games WHERE id=?', [req.params.id]);
    res.sendStatus(200);
});