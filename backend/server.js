const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');
const comoReciclarData = require('./data/comoReciclarData');
const { processAction } = require('./services/gamificationService');
const gamesData = require('./data/gamesData');
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
    // A simple way to get userId from various requests
    const userId = req.body.userId || req.query.userId || (req.user ? req.user.id : null) || (req.params.userId);
    if (userId) {
        try {
            await db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [userId]);
        } catch (error) {
            console.warn(`[Activity] Could not update last_active for user ${userId}:`, error.message);
        }
    }
    next();
};
app.use(updateUserActivity);


// --- Nodemailer Transporter Setup ---
let transporter;
if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    console.log(`✅ Nodemailer configurado para el servicio: ${process.env.EMAIL_SERVICE}`);
} else {
    console.warn('⚠️  ADVERTENCIA: Faltan las variables de entorno para el email (EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS). Los emails no se enviarán, solo se simularán en la consola.');
    transporter = null;
}

// --- Database Initialization Logic ---
const initializeDatabase = async () => {
    let connection;
    try {
        connection = await db.getConnection();
        console.log('✅ Conexión a la base de datos MySQL exitosa.');
        
        // --- Users Table (MySQL Syntax with ENUM) ---
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
        console.log('✅ Tabla "users" asegurada.');

        const usersToInsert = [
            { id: 1, name: 'Laura Fernández', email: 'laura@ecogestion.com', role: 'moderador' },
            { id: 2, name: 'Carlos Giménez', email: 'carlos@ecogestion.com', role: 'usuario' },
            { id: 3, name: 'María Rodriguez', email: 'maria@ecogestion.com', role: 'usuario' },
            { id: 4, name: 'Javier Sosa', email: 'javier@ecogestion.com', role: 'usuario' },
            { id: 5, name: 'Admin Dueño', email: 'admin@ecogestion.com', role: 'dueño' },
        ];
        console.log('⏳ Verificando/poblando usuarios iniciales...');
        const passwordHash = await bcrypt.hash('password123', saltRounds);
        const defaultStats = JSON.stringify({ messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 });

        for (const user of usersToInsert) {
            await connection.query(
                'INSERT IGNORE INTO users (id, name, email, password_hash, role, stats) VALUES (?, ?, ?, ?, ?, ?)',
                [user.id, user.name, user.email, passwordHash, user.role, defaultStats]
            );
        }
        console.log(`✅ ¡${usersToInsert.length} usuarios iniciales verificados/insertados! (pass: password123)`);

        const felipeId = 6;
        const felipeEmail = 'felipemonzon0710@gmail.com';
        const felipeName = 'Felipe Monzón';
        const felipePassword = '7c3f1d85vec';
        const felipeRole = 'dueño';
        const felipePasswordHash = await bcrypt.hash(felipePassword, saltRounds);
        
        await connection.query(
            `INSERT INTO users (id, name, email, password_hash, role, stats) VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role)`,
            [felipeId, felipeName, felipeEmail, felipePasswordHash, felipeRole, defaultStats]
        );
        console.log(`✅ Usuario dueño '${felipeName}' asegurado con ID ${felipeId}.`);

        // --- Locations Table (MySQL Syntax with ENUM) ---
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
              image_urls JSON
            );
        `);
        console.log('✅ Tabla "locations" asegurada.');
        
        // --- Impact Stats Table (MySQL Syntax) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS impact_stats (
              id INT AUTO_INCREMENT PRIMARY KEY,
              recycled_kg INT NOT NULL DEFAULT 0,
              participants INT NOT NULL DEFAULT 0,
              points INT NOT NULL DEFAULT 0
            );
        `);
        console.log('✅ Tabla "impact_stats" asegurada.');
        const [statsRows] = await connection.query('SELECT * FROM impact_stats WHERE id = 1');
        if (statsRows.length === 0) {
            await connection.query(`INSERT INTO impact_stats (id, recycled_kg, participants, points) VALUES (1, 14800, 5350, 48);`);
            console.log('✅ Datos iniciales de estadísticas insertados.');
        } else {
            console.log('✅ Fila de estadísticas verificada.');
        }

        // --- News Articles Table (MySQL Syntax) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS news_articles (
              id INT AUTO_INCREMENT PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              excerpt TEXT NOT NULL,
              image TEXT DEFAULT NULL,
              content TEXT DEFAULT NULL,
              featured BOOLEAN DEFAULT FALSE,
              author_id INT DEFAULT NULL,
              published_at TIMESTAMP NOT NULL DEFAULT current_timestamp
            );
        `);
        console.log('✅ Tabla "news_articles" asegurada.');
        
        // --- Games Table (MySQL Syntax) ---
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
        console.log('✅ Tabla "games" asegurada.');
        
        const [gameRows] = await connection.query('SELECT COUNT(*) as count FROM games');
        if (gameRows[0].count < gamesData.length) {
            console.log('⏳ La tabla "games" está incompleta o vacía. Poblando/completando con datos iniciales...');
            for (const g of gamesData) {
                await connection.query(
                    'INSERT IGNORE INTO games (id, title, category, image, type, learningObjective, payload, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [g.id, g.title, g.category, g.image, g.type, g.learningObjective, JSON.stringify(g.payload), g.rating]
                );
            }
            console.log(`✅ ¡${gamesData.length} juegos insertados/verificados en la base de datos!`);
        } else {
            console.log('✅ Tabla "games" verificada y completa.');
        }

        // --- User Game Scores Table (MySQL Syntax with Index) ---
        await connection.query(`
             CREATE TABLE IF NOT EXISTS user_game_scores (
              user_id INT NOT NULL,
              game_id INT NOT NULL,
              high_score INT NOT NULL DEFAULT 0,
              PRIMARY KEY (user_id, game_id),
              INDEX idx_user_game_scores_game_id (game_id),
              CONSTRAINT user_game_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              CONSTRAINT user_game_scores_game_id_fkey FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabla "user_game_scores" asegurada.');

        // --- Reports Table (MySQL Syntax with ENUM and Indexes) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reports (
              id INT AUTO_INCREMENT PRIMARY KEY,
              location_id VARCHAR(255) NOT NULL,
              user_id INT NOT NULL,
              reason ENUM('full', 'dirty', 'damaged', 'other') NOT NULL,
              comment TEXT,
              image_url MEDIUMTEXT,
              status ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
              reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_reports_location_id (location_id),
              INDEX idx_reports_user_id (user_id)
            );
        `);
        console.log('✅ Tabla "reports" asegurada.');

        // --- Contact Messages Table (MySQL Syntax with ENUM) ---
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
        console.log('✅ Tabla "contact_messages" asegurada.');

        // --- Community Channels Table (MySQL Syntax) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS community_channels (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL UNIQUE,
              description TEXT,
              admin_only_write BOOLEAN DEFAULT FALSE
            );
        `);
        console.log('✅ Tabla "community_channels" asegurada.');
        
        const initialChannels = [
            { id: 1, name: 'general', description: 'Charlas generales', admin_only_write: false },
            { id: 2, name: 'dudas', description: 'Preguntas sobre reciclaje', admin_only_write: false },
            { id: 3, name: 'anuncios', description: 'Anuncios importantes', admin_only_write: true },
        ];
        console.log('⏳ Verificando/poblando canales iniciales...');
        for (const channel of initialChannels) {
            await connection.query(
                'INSERT IGNORE INTO community_channels (id, name, description, admin_only_write) VALUES (?, ?, ?, ?)',
                [channel.id, channel.name, channel.description, channel.admin_only_write]
            );
        }
        console.log('✅ Canales iniciales verificados/insertados.');

        // --- Community Messages Table (MySQL Syntax with Indexes) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS community_messages (
              id INT AUTO_INCREMENT PRIMARY KEY,
              channel_id INT NOT NULL,
              user_id INT NOT NULL,
              content TEXT NOT NULL,
              image_url MEDIUMTEXT DEFAULT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              edited BOOLEAN DEFAULT FALSE,
              reactions JSON,
              replying_to_message_id INT DEFAULT NULL,
              INDEX idx_community_messages_channel_id (channel_id),
              INDEX idx_community_messages_user_id (user_id),
              FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabla "community_messages" asegurada.');

        const { initialMessages } = require('./data/communityData');
        const [msgCountRows] = await connection.query('SELECT COUNT(*) as count FROM community_messages');
        const totalInitialMessages = Object.values(initialMessages).reduce((sum, channelMsgs) => sum + channelMsgs.length, 0);

        if (msgCountRows[0].count < totalInitialMessages) {
            console.log('⏳ La tabla "community_messages" está incompleta o vacía. Poblando/completando...');
            for (const channelId in initialMessages) {
                for (const msg of initialMessages[channelId]) {
                    await connection.query(
                        'INSERT IGNORE INTO community_messages (id, channel_id, user_id, content, created_at, edited, reactions, replying_to_message_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [msg.id, channelId, msg.user_id, msg.content, msg.created_at, msg.edited || false, JSON.stringify(msg.reactions || {}), msg.replying_to_message_id || null]
                    );
                }
            }
            console.log('✅ Mensajes iniciales de la comunidad verificados/insertados.');
        } else {
            console.log('✅ Tabla "community_messages" verificada.');
        }

        const mentionMessageId = 105;
        const [mentionMessageExists] = await connection.query('SELECT id FROM community_messages WHERE id = ?', [mentionMessageId]);
        if (mentionMessageExists.length === 0) {
            const lauraUserId = 1;
            const generalChannelId = 1;
            await connection.query(
                'INSERT INTO community_messages (id, channel_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)',
                [mentionMessageId, generalChannelId, lauraUserId, `Hola @${felipeName}, ¿podrías revisar las nuevas estadísticas de la página de inicio?`, new Date(Date.now() - 1000 * 60 * 5)]
            );
            console.log(`✅ Mensaje de mención de prueba (ID ${mentionMessageId}) creado.`);
        }

        // --- Notifications Table (MySQL Syntax with ENUM and Indexes) ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('achievement', 'mention', 'reply') NOT NULL,
                achievement_id VARCHAR(255),
                related_user_id INT,
                community_message_id INT,
                channel_id INT,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (community_message_id) REFERENCES community_messages(id) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
            );
        `);
        console.log('✅ Tabla "notifications" asegurada.');

        const [notifCheck] = await connection.query('SELECT id FROM notifications WHERE community_message_id = ? AND user_id = ?', [mentionMessageId, felipeId]);
        if (notifCheck.length === 0) {
            const lauraUserId = 1;
            const generalChannelId = 1;
            await connection.query(
                'INSERT INTO notifications (user_id, type, related_user_id, community_message_id, channel_id) VALUES (?, ?, ?, ?, ?)',
                [felipeId, 'mention', lauraUserId, mentionMessageId, generalChannelId]
            );
            console.log(`✅ Notificación de prueba para Felipe Monzón creada.`);
        } else {
            console.log('✅ Notificación de prueba para Felipe ya existe.');
        }


        // --- Rewards Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rewards (
              id VARCHAR(255) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT NOT NULL,
              cost INT NOT NULL,
              category ENUM('Descuentos','Digital','Donaciones','Productos') NOT NULL,
              image MEDIUMTEXT NOT NULL,
              stock INT DEFAULT NULL,
              file_name VARCHAR(255) DEFAULT NULL,
              file_data MEDIUMTEXT DEFAULT NULL
            );
        `);
        console.log('✅ Tabla "rewards" asegurada.');
        
        const rewardsData = require('./data/rewardsData');
        const [rewardCountRows] = await connection.query('SELECT COUNT(*) as count FROM rewards');
        if (rewardCountRows[0].count < rewardsData.length) {
            console.log('⏳ La tabla "rewards" está incompleta o vacía. Poblando/completando con datos iniciales...');
            for (const reward of rewardsData) {
                await connection.query(
                    'INSERT IGNORE INTO rewards (id, title, description, cost, category, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [reward.id, reward.title, reward.description, reward.cost, reward.category, reward.image, reward.stock]
                );
            }
            console.log(`✅ ¡${rewardsData.length} recompensas verificadas/insertadas en la base de datos!`);
        } else {
             console.log('✅ Tabla "rewards" verificada y completa.');
        }


    } catch (error) {
        console.error('❌ ERROR CRÍTICO durante la inicialización de la base de datos:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// --- Helper Functions ---
const formatUserForFrontend = (dbUser) => {
    try {
        if (!dbUser || typeof dbUser !== 'object') return null;

        const { allAchievements } = require('./data/achievementsData');
        
        let unlockedIds = new Set();
        try {
            if (typeof dbUser.unlocked_achievements === 'string' && dbUser.unlocked_achievements.trim().startsWith('[')) {
                const parsedAchievements = JSON.parse(dbUser.unlocked_achievements);
                if (Array.isArray(parsedAchievements)) {
                    unlockedIds = new Set(parsedAchievements.map(String));
                }
            }
        } catch (e) {
            console.warn(`[formatUser] Could not parse 'unlocked_achievements' for user ${dbUser.id}. Using default. Data:`, dbUser.unlocked_achievements);
        }

        const userAchievements = allAchievements.map(ach => ({
            ...ach,
            unlocked: unlockedIds.has(ach.id)
        }));

        const defaultStats = { messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 };
        let finalStats = { ...defaultStats };
        try {
            let parsedStats = {};
            if (typeof dbUser.stats === 'string' && dbUser.stats.trim().startsWith('{')) {
                parsedStats = JSON.parse(dbUser.stats);
            } else if (typeof dbUser.stats === 'object' && dbUser.stats !== null) {
                parsedStats = dbUser.stats;
            }
             if (typeof parsedStats === 'object' && parsedStats !== null) {
                finalStats = { ...defaultStats, ...parsedStats };
            }
        } catch (e) {
             console.warn(`[formatUser] Could not parse 'stats' for user ${dbUser.id}. Using default. Data:`, dbUser.stats);
        }

        let safeLastLogin = null;
        if (dbUser.last_login) {
            const date = new Date(dbUser.last_login);
            if (!isNaN(date.getTime())) {
                safeLastLogin = date.toISOString().split('T')[0];
            }
        }

        const safeParseJsonArray = (field) => {
            try {
                if (typeof field === 'string' && field.trim().startsWith('[')) {
                    const parsed = JSON.parse(field);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch (e) {}
            return [];
        };
        const safeParseJsonObject = (field) => {
             try {
                if (typeof field === 'string' && field.trim().startsWith('{')) {
                    const parsed = JSON.parse(field);
                    if (typeof parsed === 'object' && parsed !== null) return parsed;
                }
            } catch (e) {}
            return {};
        };

        return {
            id: String(dbUser.id),
            name: dbUser.name || '',
            email: dbUser.email || '',
            points: Number(dbUser.points) || 0,
            kgRecycled: parseFloat(dbUser.kg_recycled) || 0.00,
            role: dbUser.role || 'usuario',
            achievements: userAchievements,
            stats: finalStats,
            lastLogin: safeLastLogin,
            favoriteLocations: safeParseJsonArray(dbUser.favorite_locations),
            bannerUrl: dbUser.banner_url || null,
            profilePictureUrl: dbUser.profile_picture_url || null,
            title: dbUser.title || null,
            bio: dbUser.bio || null,
            socials: safeParseJsonObject(dbUser.socials),
        };
    } catch (error) {
        console.error(`[CRITICAL] formatUserForFrontend failed unexpectedly for user id ${dbUser?.id}.`, error);
        return null; 
    }
};


// --- API ROUTES ---

// --- Auth ---
app.post('/api/register', async (req, res) => {
    console.log('\n[REGISTER] Petición recibida para registrar nuevo usuario.');
    try {
        const { name, email, password } = req.body;
        console.log(`[REGISTER] Datos recibidos: email=${email}, name=${name}`);
        if (!name || !email || !password) {
            console.log('[REGISTER] Error: Faltan campos requeridos.');
            return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
        }

        console.log('[REGISTER] Verificando si el email ya existe en la DB...');
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            console.log(`[REGISTER] Error: El email ${email} ya está registrado.`);
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        console.log('[REGISTER] Email disponible. Procediendo con el registro.');

        console.log('[REGISTER] Hasheando contraseña...');
        const password_hash = await bcrypt.hash(password, saltRounds);
        const last_login = new Date();
        const defaultStats = JSON.stringify({ messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 1, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0 });
        console.log('[REGISTER] Contraseña hasheada. Preparando para insertar en la DB...');

        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, last_login, role, points, kg_recycled, stats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, password_hash, last_login, 'usuario', 0, 0, defaultStats]
        );
        const newUserId = result.insertId;
        console.log(`[REGISTER] ¡ÉXITO! Usuario insertado en la DB con ID: ${newUserId}.`);

        console.log('[REGISTER] Obteniendo datos del nuevo usuario para devolver al frontend...');
        const [newUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [newUserId]);
        console.log('[REGISTER] Usuario obtenido. Enviando respuesta 201 al frontend.');
        res.status(201).json(formatUserForFrontend(newUserRows[0]));

    } catch (error) {
        console.error('----------------------------------------------------');
        console.error('>>> [REGISTER] ¡ERROR CRÍTICO DURANTE EL REGISTRO! <<<');
        console.error('----------------------------------------------------');
        console.error('Este es el error que impide guardar el usuario en la base de datos:');
        console.error(error);
        console.error('----------------------------------------------------');
        res.status(500).json({ message: 'Error en el servidor. Revisa la consola del backend para más detalles.' });
    }
});

app.post('/api/login', async (req, res) => {
    console.log(`\n[LOGIN] Petición de inicio de sesión para ${req.body.email}.`);
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
        
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log(`[LOGIN] Fallo: Email no encontrado.`);
            return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }
        
        const dbUser = users[0];
        const match = await bcrypt.compare(password, dbUser.password_hash);
        if (!match) {
            console.log(`[LOGIN] Fallo: Contraseña incorrecta para ${email}.`);
            return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
        }
        
        console.log(`[LOGIN] Éxito: Usuario ${email} autenticado. Actualizando last_login...`);
        await db.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), dbUser.id]);
        
        const [refetchedUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [dbUser.id]);

        res.status(200).json(formatUserForFrontend(refetchedUserRows[0]));
    } catch (error) {
        console.error('[LOGIN] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
    }
});

// --- User Profile, Favorites & Actions ---
app.post('/api/user-action', async (req, res) => {
    try {
        const { userId, action, payload } = req.body;
        
        if (action === 'check_in' && payload?.locationId) {
            await db.query('UPDATE locations SET check_ins = check_ins + 1 WHERE id = ?', [payload.locationId]);
        }
        
        if (action === 'complete_game' && payload?.gameId && payload?.score !== undefined) {
             await db.query(
                `INSERT INTO user_game_scores (user_id, game_id, high_score) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE high_score = GREATEST(high_score, VALUES(high_score))`,
                [userId, payload.gameId, payload.score]
            );
        }

        const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        const dbUser = userRows[0];
        const { updatedUser, notifications } = processAction(dbUser, action, payload);

        await db.query(
            'UPDATE users SET points = ?, last_login = ?, stats = ?, unlocked_achievements = ? WHERE id = ?',
            [
                updatedUser.points,
                updatedUser.last_login,
                JSON.stringify(updatedUser.stats),
                JSON.stringify(updatedUser.unlocked_achievements),
                userId
            ]
        );
        
        for (const notif of notifications) {
            if (notif.type === 'achievement' && notif.achievementId) {
                await db.query(
                    'INSERT INTO notifications (user_id, type, achievement_id) VALUES (?, ?, ?)',
                    [userId, 'achievement', notif.achievementId]
                );
            }
        }
        
        const [refetchedUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        res.status(200).json({
            updatedUser: formatUserForFrontend(refetchedUserRows[0]),
            notifications
        });

    } catch (error) {
        console.error('[USER ACTION] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al procesar la acción.' });
    }
});

app.get('/api/users/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        
        const formattedUser = formatUserForFrontend(users[0]);
        if (!formattedUser) {
            return res.status(500).json({ message: 'Error al procesar los datos del usuario.' });
        }

        res.status(200).json(formattedUser);
    } catch (error) {
        console.error('[GET USER PROFILE] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al obtener el perfil del usuario.' });
    }
});

app.put('/api/users/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fieldsToUpdate = req.body;

        if (Object.keys(fieldsToUpdate).length === 0) return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
        
        const columnMapping = {
            name: 'name', points: 'points', kgRecycled: 'kg_recycled', title: 'title', bio: 'bio', bannerUrl: 'banner_url', profilePictureUrl: 'profile_picture_url',
        };

        const setClauses = [], values = [];
        for (const key in fieldsToUpdate) {
            if (columnMapping[key]) {
                setClauses.push(`${columnMapping[key]} = ?`);
                values.push(fieldsToUpdate[key]);
            }
        }
        if (setClauses.length === 0) return res.status(400).json({ message: 'Ninguno de los campos proporcionados es válido.' });
        
        values.push(id);
        const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
        await db.query(sql, values);

        const [updatedUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (updatedUserRows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado después de la actualización.' });
        
        res.status(200).json(formatUserForFrontend(updatedUserRows[0]));
    } catch (error) {
        console.error('[UPDATE PROFILE] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al actualizar el perfil.' });
    }
});

app.put('/api/users/favorites', async (req, res) => {
    try {
        const { userId, locationId } = req.body;
        
        const [users] = await db.query('SELECT favorite_locations FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if(typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue;
            } catch {
                return fallbackValue;
            }
        }
        let favorites = safeParseJson(users[0].favorite_locations, []) || [];
        const index = favorites.indexOf(locationId);
        if (index > -1) favorites.splice(index, 1); else favorites.push(locationId);
        
        await db.query('UPDATE users SET favorite_locations = ? WHERE id = ?', [JSON.stringify(favorites), userId]);

        const [updatedUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        res.status(200).json(formatUserForFrontend(updatedUserRows[0]));
    } catch (error) {
        console.error('[UPDATE FAVORITES] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al actualizar favoritos.' });
    }
});

// --- Rewards ---
app.get('/api/rewards', async (req, res) => {
    try {
        const [rewards] = await db.query('SELECT id, title, description, cost, category, image, stock FROM rewards ORDER BY cost ASC');
        res.json(rewards);
    } catch (error) {
        console.error("[GET REWARDS] ERROR:", error);
        res.status(500).json({ message: "Error al obtener las recompensas." });
    }
});

app.post('/api/redeem-reward', async (req, res) => {
    try {
        const { userId, rewardId } = req.body;
        if (!userId || !rewardId) {
            return res.status(400).json({ message: "Se requiere ID de usuario y de recompensa." });
        }
        
        const [[reward]] = await db.query('SELECT * FROM rewards WHERE id = ?', [rewardId]);
        if (!reward) {
            return res.status(404).json({ message: "Recompensa no encontrada." });
        }

        const [userRows] = await db.query('SELECT points FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        
        if (reward.stock !== null && reward.stock <= 0) {
            return res.status(403).json({ message: "Esta recompensa está agotada." });
        }

        const userPoints = userRows[0].points;
        if (userPoints < reward.cost) {
            return res.status(403).json({ message: "No tienes suficientes EcoPuntos para canjear esta recompensa." });
        }

        const newPoints = userPoints - reward.cost;
        await db.query('UPDATE users SET points = ? WHERE id = ?', [newPoints, userId]);

        if (reward.stock !== null) {
            await db.query('UPDATE rewards SET stock = stock - 1 WHERE id = ?', [rewardId]);
        }
        
        console.log(`[REDEEM] Usuario ${userId} canjeó ${reward.title} por ${reward.cost} puntos. Saldo restante: ${newPoints}.`);

        const [updatedUserRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const formattedUser = formatUserForFrontend(updatedUserRows[0]);

        if (reward.category === 'Digital') {
            const [[rewardWithFile]] = await db.query('SELECT file_name, file_data FROM rewards WHERE id = ?', [rewardId]);
            if (rewardWithFile && rewardWithFile.file_data) {
                return res.status(200).json({
                    updatedUser: formattedUser,
                    rewardWithFile: {
                        fileName: rewardWithFile.file_name,
                        fileData: rewardWithFile.file_data,
                    },
                });
            }
        }

        res.status(200).json({ updatedUser: formattedUser });

    } catch (error) {
        console.error('[REDEEM REWARD] ERROR:', error);
        res.status(500).json({ message: "Error en el servidor al canjear la recompensa." });
    }
});

const authAdminForRewards = async (req, res, next) => {
    const { adminUserId } = req.body;
    if (!adminUserId) return res.status(401).json({ message: 'Autenticación requerida.' });

    try {
        const [admins] = await db.query('SELECT role FROM users WHERE id = ?', [adminUserId]);
        if (admins.length > 0 && (admins[0].role === 'dueño' || admins[0].role === 'moderador')) {
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error de servidor al verificar permisos.' });
    }
};

app.post('/api/rewards', authAdminForRewards, async (req, res) => {
    try {
        const { id, title, description, cost, category, image, stock, fileName, fileData } = req.body;
        if (!id || !title || !description || cost === undefined || !category || !image) {
            return res.status(400).json({ message: 'Todos los campos son requeridos.' });
        }
        await db.query(
            'INSERT INTO rewards (id, title, description, cost, category, image, stock, file_name, file_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, cost, category, image, stock != null ? stock : null, fileName, fileData]
        );
        res.status(201).json({ message: 'Recompensa creada.' });
    } catch (error) {
        console.error("[CREATE REWARD] ERROR:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Ya existe una recompensa con ese ID." });
        }
        res.status(500).json({ message: "Error al crear la recompensa." });
    }
});

app.put('/api/rewards/:id', authAdminForRewards, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, cost, category, image, stock, fileName, fileData } = req.body;
        if (!title || !description || cost === undefined || !category || !image) {
            return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }
        const [result] = await db.query(
            'UPDATE rewards SET title = ?, description = ?, cost = ?, category = ?, image = ?, stock = ?, file_name = ?, file_data = ? WHERE id = ?',
            [title, description, cost, category, image, stock != null ? stock : null, fileName, fileData, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Recompensa no encontrada.' });
        res.status(200).json({ message: 'Recompensa actualizada.' });
    } catch (error) {
        console.error("[UPDATE REWARD] ERROR:", error);
        res.status(500).json({ message: "Error al actualizar la recompensa." });
    }
});

app.delete('/api/rewards/:id', authAdminForRewards, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM rewards WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Recompensa no encontrada.' });
        res.status(200).json({ message: 'Recompensa eliminada.' });
    } catch (error) {
        console.error("[DELETE REWARD] ERROR:", error);
        res.status(500).json({ message: "Error al eliminar la recompensa." });
    }
});


// --- Puntos Verdes & Reports ---
const updateLocationStatusAfterReportChange = async (locationId) => {
    try {
        const [[{ pending_count }]] = await db.query(
            'SELECT COUNT(*) as pending_count FROM reports WHERE location_id = ? AND status = ?',
            [locationId, 'pending']
        );

        if (Number(pending_count) === 0) {
            console.log(`[Location Status] No hay reportes pendientes para ${locationId}. Actualizando a 'serviced'.`);
            await db.query(
                "UPDATE locations SET status = 'serviced', last_serviced = NOW() WHERE id = ? AND status = 'reported'",
                [locationId]
            );
        } else {
            console.log(`[Location Status] Aún hay ${pending_count} reportes pendientes para ${locationId}. El estado permanece 'reported'.`);
        }
    } catch (error) {
        console.error(`[Location Status] Error al actualizar el estado de la ubicación ${locationId}:`, error);
    }
};

app.get('/api/locations', async (req, res) => {
    try {
        const [locations] = await db.query(`
            SELECT 
                l.*, 
                (SELECT COUNT(*) FROM reports WHERE location_id = l.id AND status = 'pending') as reportCount,
                (SELECT reason FROM reports WHERE location_id = l.id AND status = 'pending' ORDER BY reported_at DESC LIMIT 1) as latestReportReason
            FROM locations l
        `);
        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if (typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue
            } catch {
                return fallbackValue
            }
        };
        const formattedLocations = locations.map(loc => ({
            ...loc,
            schedule: safeParseJson(loc.schedule, []) || [],
            materials: safeParseJson(loc.materials, []) || [],
            map_data: safeParseJson(loc.map_data, {}) || {},
            image_urls: safeParseJson(loc.image_urls, []) || [],
            reportCount: Number(loc.reportCount) || 0,
            latestReportReason: loc.latestReportReason
        }));
        res.json(formattedLocations);
    } catch(error) {
        console.error("[GET LOCATIONS] ERROR:", error);
        res.status(500).json({ message: "Error al obtener los puntos verdes." });
    }
});

app.post('/api/locations', async (req, res) => {
    try {
        const newLocation = req.body;
        // Basic validation
        if (!newLocation.id || !newLocation.name || !newLocation.address) {
            return res.status(400).json({ message: 'ID, Nombre y Dirección son requeridos.' });
        }
        const [result] = await db.query(
            'INSERT INTO locations (id, name, address, description, hours, schedule, materials, map_data, status, last_serviced, check_ins, image_urls) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newLocation.id, newLocation.name, newLocation.address, newLocation.description, newLocation.hours, JSON.stringify(newLocation.schedule || []), JSON.stringify(newLocation.materials || []), JSON.stringify(newLocation.mapData || {}), newLocation.status || 'ok', newLocation.lastServiced || new Date(), 0, JSON.stringify(newLocation.imageUrls || [])]
        );
        const [insertedRow] = await db.query('SELECT * FROM locations WHERE id = ?', [newLocation.id]);
        res.status(201).json(insertedRow[0]);
    } catch(error) {
        console.error("[CREATE LOCATION] ERROR:", error);
        res.status(500).json({ message: "Error al crear la ubicación." });
    }
});

app.put('/api/locations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedLocation = req.body;
        // ... validation ...
        await db.query(
            'UPDATE locations SET name = ?, address = ?, description = ?, hours = ?, schedule = ?, materials = ?, map_data = ?, status = ?, last_serviced = ?, image_urls = ? WHERE id = ?',
            [updatedLocation.name, updatedLocation.address, updatedLocation.description, updatedLocation.hours, JSON.stringify(updatedLocation.schedule), JSON.stringify(updatedLocation.materials), JSON.stringify(updatedLocation.mapData), updatedLocation.status, updatedLocation.lastServiced, JSON.stringify(updatedLocation.imageUrls), id]
        );
        const [updatedRow] = await db.query('SELECT * FROM locations WHERE id = ?', [id]);
        res.status(200).json(updatedRow[0]);
    } catch(error) {
        console.error("[UPDATE LOCATION] ERROR:", error);
        res.status(500).json({ message: "Error al actualizar la ubicación." });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM reports WHERE location_id = ?', [id]);
        await db.query('DELETE FROM locations WHERE id = ?', [id]);
        res.status(200).json({ message: 'Ubicación eliminada.' });
    } catch(error) {
        console.error("[DELETE LOCATION] ERROR:", error);
        res.status(500).json({ message: "Error al eliminar la ubicación." });
    }
});

app.post('/api/locations/report', async (req, res) => {
    try {
        const { locationId, userId, reason, comment, imageUrl } = req.body;
        await db.query(
            'INSERT INTO reports (user_id, location_id, reason, comment, image_url) VALUES (?, ?, ?, ?, ?)',
            [userId, locationId, reason, comment, imageUrl]
        );
        await db.query("UPDATE locations SET status = 'reported' WHERE id = ?", [locationId]);
        
        const [updatedLocations] = await db.query('SELECT * FROM locations WHERE id = ?', [locationId]);
        res.status(201).json(updatedLocations[0]);
    } catch (error) {
        console.error("[REPORT LOCATION] ERROR:", error);
        res.status(500).json({ message: "Error al enviar el reporte." });
    }
});

// --- News Management ---
app.get('/api/news', async (req, res) => {
    try {
        const [articles] = await db.query('SELECT * FROM news_articles ORDER BY published_at DESC, id DESC');
        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if (typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue;
            } catch {
                return fallbackValue;
            }
        }
        const formattedArticles = articles.map(article => {
            const articleDate = new Date(article.published_at);
            return {
                ...article,
                date: !isNaN(articleDate.getTime()) ? articleDate.toISOString().split('T')[0] : null,
                content: safeParseJson(article.content, []) || [],
            };
        });
        res.json(formattedArticles);
    } catch (error) {
        console.error("[GET NEWS] ERROR:", error);
        res.status(500).json({ message: "Error al obtener las noticias." });
    }
});

app.post('/api/news', async (req, res) => {
    try {
        const { title, category, image, excerpt, content, featured, adminUserId } = req.body;
        const [result] = await db.query(
            `INSERT INTO news_articles (title, category, image, excerpt, content, featured, author_id, published_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [title, category, image, excerpt, JSON.stringify(content), featured, adminUserId]
        );
        res.status(201).json({ id: result.insertId, message: 'Noticia creada.' });
    } catch (error) {
        console.error("[CREATE NEWS] ERROR:", error);
        res.status(500).json({ message: "Error al crear la noticia." });
    }
});

app.put('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, image, excerpt, content, featured } = req.body;
        await db.query(
            `UPDATE news_articles SET title = ?, category = ?, image = ?, excerpt = ?, content = ?, featured = ?
             WHERE id = ?`,
            [title, category, image, excerpt, JSON.stringify(content), featured, id]
        );
        res.status(200).json({ message: 'Noticia actualizada.' });
    } catch (error) {
        console.error("[UPDATE NEWS] ERROR:", error);
        res.status(500).json({ message: "Error al actualizar la noticia." });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM news_articles WHERE id = ?', [id]);
        res.status(200).json({ message: 'Noticia eliminada.' });
    } catch (error) {
        console.error("[DELETE NEWS] ERROR:", error);
        res.status(500).json({ message: "Error al eliminar la noticia." });
    }
});

// --- Games Management ---
app.get('/api/games', async (req, res) => {
    try {
        const { userId } = req.query;
        let games;
        if (userId) {
            const [result] = await db.query(
                `SELECT g.*, ugs.high_score 
                 FROM games g 
                 LEFT JOIN user_game_scores ugs ON g.id = ugs.game_id AND ugs.user_id = ? 
                 ORDER BY g.id ASC`, 
                [userId]
            );
            games = result;
        } else {
            const [result] = await db.query('SELECT * FROM games ORDER BY id ASC');
            games = result;
        }
        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if (typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue
            } catch {
                return fallbackValue
            }
        };
        const formattedGames = games.map(g => ({
            ...g,
            payload: safeParseJson(g.payload, {}) || {},
            userHighScore: g.high_score !== null && g.high_score !== undefined ? g.high_score : 0,
        }));
        res.json(formattedGames);
    } catch (error) {
        console.error('[GET GAMES] ERROR:', error);
        res.status(500).json({ message: 'Error al obtener los juegos.' });
    }
});

app.post('/api/games', async (req, res) => {
    try {
        const { title, category, image, type, learningObjective, payload } = req.body;
        const [result] = await db.query(
            `INSERT INTO games (title, category, image, type, learningObjective, payload) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, category, image, type, learningObjective, JSON.stringify(payload)]
        );
        res.status(201).json({ id: result.insertId, message: 'Juego creado.' });
    } catch (error) {
        console.error('[CREATE GAME] ERROR:', error);
        res.status(500).json({ message: 'Error al crear el juego.' });
    }
});

app.put('/api/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, image, type, learningObjective, payload } = req.body;
        const [result] = await db.query(
            `UPDATE games SET title = ?, category = ?, image = ?, type = ?, learningObjective = ?, payload = ? WHERE id = ?`,
            [title, category, image, type, learningObjective, JSON.stringify(payload), id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Juego no encontrado.' });
        res.status(200).json({ message: 'Juego actualizado.' });
    } catch (error) {
        console.error('[UPDATE GAME] ERROR:', error);
        res.status(500).json({ message: 'Error al actualizar el juego.' });
    }
});

app.delete('/api/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM user_game_scores WHERE game_id = ?', [id]);
        const [result] = await db.query('DELETE FROM games WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Juego no encontrado.' });
        res.status(200).json({ message: 'Juego eliminado.' });
    } catch (error) {
        console.error('[DELETE GAME] ERROR:', error);
        res.status(500).json({ message: 'Error al eliminar el juego.' });
    }
});


// --- Community Endpoints ---
const isAdmin = async (req, res, next) => {
    const { userId, userRole } = req.body;
    if (userRole === 'dueño' || userRole === 'moderador') {
        return next();
    }
    if (userId) {
        try {
            const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
            if (users.length > 0 && (users[0].role === 'dueño' || users[0].role === 'moderador')) {
                return next();
            }
        } catch (e) {
            return res.status(500).json({ message: "Error de servidor." });
        }
    }
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción.' });
};

app.get('/api/community/channels', async (req, res) => {
    try {
        const { userId } = req.query;
        if (userId) {
            const [channels] = await db.query(
                `SELECT c.id, c.name, c.description, c.admin_only_write, COUNT(n.id) as unreadCount
                 FROM community_channels c
                 LEFT JOIN notifications n ON c.id = n.channel_id AND n.user_id = ? AND n.is_read = FALSE AND (n.type = 'mention' OR n.type = 'reply')
                 GROUP BY c.id, c.name, c.description, c.admin_only_write
                 ORDER BY c.id ASC`,
                [userId]
            );
            res.json(channels.map(c => ({...c, unreadCount: Number(c.unreadCount)})));
        } else {
            const [channels] = await db.query('SELECT * FROM community_channels ORDER BY id ASC');
            res.json(channels);
        }
    } catch (error) {
        console.error('[GET CHANNELS] ERROR:', error);
        res.status(500).json({ message: "Error al obtener canales." });
    }
});

app.post('/api/community/channels', isAdmin, async (req, res) => {
    try {
        const { name, description, admin_only_write } = req.body;
        if (!name || !description) return res.status(400).json({ message: 'Nombre y descripción son requeridos.' });
        const channelName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const [result] = await db.query(
            'INSERT INTO community_channels (name, description, admin_only_write) VALUES (?, ?, ?)',
            [channelName, description, !!admin_only_write]
        );
        res.status(201).json({ id: result.insertId, name: channelName, description, admin_only_write: !!admin_only_write });
    } catch (error) {
        console.error('[CREATE CHANNEL] ERROR:', error);
        res.status(500).json({ message: "Error al crear canal." });
    }
});

app.delete('/api/community/channels/:id', isAdmin, async (req, res) => {
    const channelId = parseInt(req.params.id, 10);
    if (channelId === 1) return res.status(400).json({ message: 'No se puede eliminar el canal #general.' });
    try {
        const [result] = await db.query('DELETE FROM community_channels WHERE id = ?', [channelId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Canal no encontrado.' });
        res.status(200).json({ message: 'Canal eliminado.' });
    } catch (error) {
        console.error(`[DELETE CHANNEL] Error:`, error);
        res.status(500).json({ message: "Error al eliminar canal." });
    }
});


app.get('/api/community/members', async (req, res) => {
     try {
        const [members] = await db.query("SELECT id, name, profile_picture_url, role, last_active FROM users ORDER BY name");
        const formattedMembers = members.map(m => ({
            id: m.id.toString(),
            name: m.name,
            profile_picture_url: m.profile_picture_url,
            is_admin: m.role === 'dueño' || m.role === 'moderador',
            is_online: m.last_active ? (new Date() - new Date(m.last_active)) < (5 * 60 * 1000) : false
        }));
        res.json(formattedMembers);
    } catch (error) {
        console.error('[GET MEMBERS] Error:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/community/messages/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const [messages] = await db.query(
            `SELECT 
                m.id, m.user_id, m.content, m.created_at, m.edited, m.reactions, m.replying_to_message_id, m.image_url,
                u.name as user, u.profile_picture_url as avatarUrl, u.role as userRole, u.title as userTitle
             FROM community_messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.channel_id = ? 
             ORDER BY m.created_at ASC`, [channelId]
        );
        
        const replyIds = messages.map(m => m.replying_to_message_id).filter(id => id);
        let repliesMap = {};
        if (replyIds.length > 0) {
            const [replyMessages] = await db.query(
                `SELECT m.id, m.content, u.name as user 
                 FROM community_messages m 
                 JOIN users u ON m.user_id = u.id 
                 WHERE m.id IN (?)`, [replyIds]
            );
            repliesMap = replyMessages.reduce((acc, reply) => {
                acc[reply.id] = { messageId: reply.id, user: reply.user, text: reply.content };
                return acc;
            }, {});
        }
        
        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if(typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue;
            } catch {
                return fallbackValue;
            }
        };

        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            user_id: msg.user_id.toString(),
            user: msg.user,
            avatarUrl: msg.avatarUrl,
            timestamp: msg.created_at,
            text: msg.content,
            imageUrl: msg.image_url,
            edited: msg.edited,
            reactions: safeParseJson(msg.reactions, {}) || {},
            replyingTo: msg.replying_to_message_id ? repliesMap[msg.replying_to_message_id] : null,
            userRole: msg.userRole,
            userTitle: msg.userTitle
        }));
        
        res.json(formattedMessages);
    } catch (error) {
        console.error(`[GET MESSAGES] Error:`, error);
        res.status(500).json({ message: 'Error al obtener mensajes.' });
    }
});

app.post('/api/community/messages', async (req, res) => {
    try {
        const { channelId, userId, content, replyingToId, imageUrl } = req.body;
        const [result] = await db.query(
            'INSERT INTO community_messages (channel_id, user_id, content, replying_to_message_id, image_url) VALUES (?, ?, ?, ?, ?)',
            [channelId, userId, content, replyingToId || null, imageUrl || null]
        );
        const newMessageId = result.insertId;

        // If this is a reply, mark the original notification as read for the replier
        if (replyingToId) {
            try {
                // Find notifications for the current user about the message they are replying to
                // and mark them as read. This handles both mentions and replies.
                await db.query(
                    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND community_message_id = ? AND is_read = FALSE',
                    [userId, replyingToId]
                );
                console.log(`[REPLY] Marked notification as read for user ${userId} regarding message ${replyingToId}.`);
            } catch(e) {
                console.error(`[REPLY] Failed to mark notification as read for user ${userId}:`, e);
            }
        }

        const [allUsers] = await db.query('SELECT id, name FROM users');
        const mentionedUserIds = new Set();
        const currentUserId = parseInt(userId, 10);

        allUsers.forEach(user => {
            const mentionRegex = new RegExp(`@${user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(?!\\w)`, 'g');
            if (content.match(mentionRegex)) {
                if (user.id !== currentUserId) {
                    mentionedUserIds.add(user.id);
                }
            }
        });

        for (const mentionedUserId of mentionedUserIds) {
            await db.query(
                'INSERT INTO notifications (user_id, type, related_user_id, community_message_id, channel_id) VALUES (?, ?, ?, ?, ?)',
                [mentionedUserId, 'mention', currentUserId, newMessageId, channelId]
            );
        }

        if (replyingToId) {
            const [[originalMessage]] = await db.query('SELECT user_id FROM community_messages WHERE id = ?', [replyingToId]);
            if (originalMessage) {
                const originalAuthorId = originalMessage.user_id;
                if (originalAuthorId !== currentUserId && !mentionedUserIds.has(originalAuthorId)) {
                   await db.query(
                       'INSERT INTO notifications (user_id, type, related_user_id, community_message_id, channel_id) VALUES (?, ?, ?, ?, ?)',
                       [originalAuthorId, 'reply', currentUserId, newMessageId, channelId]
                   );
                }
            }
        }

        res.status(201).json({ message: 'Mensaje enviado.' });
    } catch (error) {
        console.error("[POST MESSAGE] ERROR:", error);
        res.status(500).json({ message: "Error al enviar el mensaje." });
    }
});

app.put('/api/community/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content, userId, userRole } = req.body;
        
        const [messages] = await db.query('SELECT user_id FROM community_messages WHERE id = ?', [messageId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Mensaje no encontrado.' });

        const messageAuthorId = messages[0].user_id.toString();
        if (messageAuthorId !== userId && userRole !== 'dueño' && userRole !== 'moderador') {
            return res.status(403).json({ message: 'No tienes permiso para editar este mensaje.' });
        }
        
        await db.query(
            'UPDATE community_messages SET content = ?, edited = true WHERE id = ?',
            [content, messageId]
        );
        res.status(200).json({ message: 'Mensaje actualizado.' });
    } catch (error) {
        console.error("[EDIT MESSAGE] ERROR:", error);
        res.status(500).json({ message: "Error al editar el mensaje." });
    }
});

app.delete('/api/community/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId, userRole } = req.body;
        
        const [messages] = await db.query('SELECT user_id FROM community_messages WHERE id = ?', [messageId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Mensaje no encontrado.' });

        const messageAuthorId = messages[0].user_id.toString();
        if (messageAuthorId !== userId && userRole !== 'dueño' && userRole !== 'moderador') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este mensaje.' });
        }
        
        await db.query('DELETE FROM notifications WHERE community_message_id = ?', [messageId]);
        await db.query('DELETE FROM community_messages WHERE id = ?', [messageId]);
        res.status(200).json({ message: 'Mensaje eliminado.' });
    } catch (error) {
        console.error("[DELETE MESSAGE] ERROR:", error);
        res.status(500).json({ message: "Error al eliminar el mensaje." });
    }
});

app.post('/api/community/messages/:messageId/react', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userName, emoji } = req.body;

        const [messages] = await db.query('SELECT reactions FROM community_messages WHERE id = ?', [messageId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Mensaje no encontrado.' });

        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if(typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue;
            } catch {
                return fallbackValue;
            }
        };

        let reactions = safeParseJson(messages[0].reactions, {}) || {};

        if (!reactions[emoji]) {
            reactions[emoji] = [];
        }

        const userIndex = reactions[emoji].findIndex((u) => u === userName);
        if (userIndex > -1) {
            reactions[emoji].splice(userIndex, 1);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        } else {
            reactions[emoji].push(userName);
        }

        await db.query(
            'UPDATE community_messages SET reactions = ? WHERE id = ?',
            [JSON.stringify(reactions), messageId]
        );
        res.status(200).json({ message: 'Reacción actualizada.' });
    } catch (error) {
        console.error("[REACT MESSAGE] ERROR:", error);
        res.status(500).json({ message: "Error al reaccionar al mensaje." });
    }
});

// --- Notification Endpoints ---
app.get('/api/notifications/unread-count/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [[{ totalUnread }]] = await db.query(
            "SELECT COUNT(*) as totalUnread FROM notifications WHERE user_id = ? AND is_read = FALSE AND (type = 'mention' OR type = 'reply')",
            [userId]
        );
        res.json({ totalUnread: Number(totalUnread) });
    } catch (error) {
        console.error('[GET UNREAD COUNT] ERROR:', error);
        res.status(500).json({ message: "Error al obtener contador de no leídos." });
    }
});

app.get('/api/notifications/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { allAchievements } = require('./data/achievementsData.js');

        const [dbNotifications] = await db.query(
            `SELECT id, achievement_id, created_at
             FROM notifications
             WHERE user_id = ? AND type = 'achievement'
             ORDER BY created_at DESC`,
            [userId]
        );

        const achievementsMap = new Map(allAchievements.map(ach => [ach.id, ach]));

        const formattedNotifications = dbNotifications.map(n => {
            const achievement = achievementsMap.get(n.achievement_id);
            if (!achievement) return null;
            return {
                id: n.id,
                type: 'achievement',
                icon: achievement.icon,
                title: '¡Logro Desbloqueado!',
                message: `Conseguiste el logro: ${achievement.name}`,
                time: n.created_at
            };
        }).filter(Boolean);

        res.json(formattedNotifications);
    } catch (error) {
        console.error('[GET PROFILE NOTIFICATIONS] ERROR:', error);
        res.status(500).json({ message: "Error al obtener notificaciones de perfil." });
    }
});


app.get('/api/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [notifications] = await db.query(
            `SELECT
                n.id,
                n.type,
                n.is_read,
                n.created_at,
                n.community_message_id as messageId,
                n.channel_id as channelId,
                related_user.name as fromUser,
                cm.content as messageSnippet,
                replied_cm.content as repliedTo,
                ch.name as channel
            FROM notifications n
            LEFT JOIN users related_user ON n.related_user_id = related_user.id
            LEFT JOIN community_messages cm ON n.community_message_id = cm.id
            LEFT JOIN community_channels ch ON n.channel_id = ch.id
            LEFT JOIN community_messages replied_cm ON cm.replying_to_message_id = replied_cm.id
            WHERE n.user_id = ? AND (n.type = 'mention' OR n.type = 'reply')
            ORDER BY n.created_at DESC`,
            [userId]
        );
        const formatted = notifications.map(n => ({
            id: n.id,
            type: n.type,
            is_read: !!n.is_read,
            icon: n.type === 'mention' ? '@' : '💬',
            fromUser: n.fromUser,
            channel: n.channel,
            channelId: n.channelId,
            messageId: n.messageId,
            messageSnippet: n.messageSnippet,
            repliedTo: n.repliedTo || undefined,
            time: n.created_at
        }));
        res.json(formatted);
    } catch (error) {
        console.error('[GET NOTIFICATIONS] ERROR:', error);
        res.status(500).json({ message: "Error al obtener notificaciones." });
    }
});

app.put('/api/notifications/mark-all-read/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND (type = 'mention' OR type = 'reply')",
            [userId]
        );
        res.status(200).json({ message: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
        console.error('[MARK READ] ERROR:', error);
        res.status(500).json({ message: "Error al marcar notificaciones como leídas." });
    }
});


// --- Contact & Admin Panel Endpoints ---
const checkAdminRole = (role, requiredRole) => {
    if (requiredRole === 'dueño') return role === 'dueño';
    if (requiredRole === 'moderador') return role === 'dueño' || role === 'moderador';
    return false;
};

const authAdmin = async (req, res, requiredRole) => {
    const adminUserId = req.query.adminUserId || req.body.adminUserId;
    if (!adminUserId) {
        res.status(401).json({ message: 'Se requiere autenticación de administrador.' });
        return false;
    }
    try {
        const [admins] = await db.query('SELECT role FROM users WHERE id = ?', [adminUserId]);
        if (admins.length === 0 || !checkAdminRole(admins[0].role, requiredRole)) {
            res.status(403).json({ message: 'Acceso denegado.' });
            return false;
        }
        return true;
    } catch (error) {
        res.status(500).json({ message: 'Error de servidor al verificar permisos.' });
        return false;
    }
};

app.get('/api/admin/users', async (req, res) => {
    if (!await authAdmin(req, res, 'dueño')) return;
    try {
        const [users] = await db.query('SELECT * FROM users ORDER BY name ASC');
        res.json(users.map(formatUserForFrontend));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios.' });
    }
});

app.get('/api/admin/users/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'dueño')) return;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if(users.length === 0) return res.status(404).json({message: 'Usuario no encontrado'});
        res.json(formatUserForFrontend(users[0]));
    } catch(error) {
        res.status(500).json({ message: 'Error al obtener usuario.' });
    }
});

app.put('/api/admin/users/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'dueño')) return;
    try {
        const { id } = req.params;
        const { name, role, points } = req.body;
        await db.query('UPDATE users SET name = ?, role = ?, points = ? WHERE id = ?', [name, role, points, id]);
        const [updatedUsers] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (updatedUsers.length === 0) return res.status(404).json({ message: 'User not found after update.' });
        res.status(200).json(formatUserForFrontend(updatedUsers[0]));
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario.' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'dueño')) return;
    try {
        const { id } = req.params;
        await db.query('DELETE FROM community_messages WHERE user_id = ?', [id]);
        await db.query('DELETE FROM reports WHERE user_id = ?', [id]);
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.status(200).json({ message: 'Usuario eliminado permanentemente.' });
    } catch (error) {
        console.error("[DELETE USER] ERROR:", error);
        res.status(500).json({ message: 'Error al eliminar usuario.' });
    }
});

app.put('/api/admin/users/:id/achievements', async (req, res) => {
    if (!await authAdmin(req, res, 'dueño')) return;
    try {
        const { id } = req.params;
        const { achievementId, unlocked } = req.body;
        const [users] = await db.query('SELECT unlocked_achievements FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        const safeParseJson = (jsonString, fallbackValue) => {
            try {
                if(typeof jsonString === 'string') return JSON.parse(jsonString);
                return fallbackValue
            } catch {
                return fallbackValue
            }
        };
        let unlockedIds = new Set(safeParseJson(users[0].unlocked_achievements, []) || []);
        if (unlocked) {
            unlockedIds.add(String(achievementId));
        } else {
            unlockedIds.delete(String(achievementId));
        }
        
        await db.query('UPDATE users SET unlocked_achievements = ? WHERE id = ?', [JSON.stringify(Array.from(unlockedIds)), id]);
        
        const [updatedUsers] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (updatedUsers.length === 0) return res.status(404).json({ message: 'User not found after update.' });
        res.status(200).json(formatUserForFrontend(updatedUsers[0]));

    } catch (error) {
        console.error("[UPDATE ACHIEVEMENTS] ERROR:", error);
        res.status(500).json({ message: 'Error al actualizar logros.' });
    }
});


app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        console.log(`[CONTACT] Nuevo mensaje de ${name} (${email}). Asunto: ${subject}`);
        await db.query(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]
        );
        console.log('[CONTACT] Mensaje guardado en la DB.');
        res.status(201).json({ message: 'Mensaje enviado exitosamente.' });
    } catch (error) {
        console.error("[CONTACT] ERROR:", error);
        res.status(500).json({ message: "Error al enviar el mensaje." });
    }
});

app.get('/api/admin/messages', async (req, res) => {
    try {
        const [messages] = await db.query('SELECT * FROM contact_messages ORDER BY submitted_at DESC');
        res.json(messages);
    } catch (error) {
        console.error("[GET ADMIN MESSAGES] ERROR:", error);
        res.status(500).json({ message: "Error al obtener mensajes." });
    }
});
app.put('/api/admin/messages/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'moderador')) return;
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
        const [updatedMessages] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
        if (updatedMessages.length === 0) return res.status(404).json({ message: 'Message not found after update.' });
        res.status(200).json(updatedMessages[0]);
    } catch (error) {
         res.status(500).json({ message: "Error al actualizar mensaje." });
    }
});

app.delete('/api/admin/messages/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'moderador')) return;
    try {
        const { id } = req.params;
        await db.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        res.status(200).json({ message: 'Mensaje eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el mensaje.' });
    }
});

app.get('/api/admin/reports', async (req, res) => {
    if (!await authAdmin(req, res, 'moderador')) return;
    try {
        const [reports] = await db.query(
            `SELECT r.*, u.name as userName, u.email as userEmail, l.name as locationName 
             FROM reports r JOIN users u ON r.user_id = u.id 
             JOIN locations l ON r.location_id = l.id 
             ORDER BY r.reported_at DESC`
        );
        res.json(reports);
    } catch (error) {
        console.error("[GET ADMIN REPORTS] ERROR:", error);
        res.status(500).json({ message: "Error al obtener reportes." });
    }
});
app.put('/api/admin/reports/:id', async (req, res) => {
     if (!await authAdmin(req, res, 'moderador')) return;
     try {
        const { id } = req.params;
        const { status } = req.body;
        
        const [reports] = await db.query('SELECT location_id FROM reports WHERE id = ?', [id]);
        if (reports.length === 0) return res.status(404).json({ message: 'Reporte no encontrado.' });
        const { location_id } = reports[0];
        
        await db.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);

        if (status === 'resolved' || status === 'dismissed') {
            await updateLocationStatusAfterReportChange(location_id);
        }

        const [updatedReports] = await db.query(
            `SELECT r.*, u.name as userName, u.email as userEmail, l.name as locationName 
             FROM reports r JOIN users u ON r.user_id = u.id 
             JOIN locations l ON r.location_id = l.id 
             WHERE r.id = ?`,
            [id]
        );
        if (updatedReports.length === 0) return res.status(404).json({ message: 'Report not found after update.' });
        res.status(200).json(updatedReports[0]);
    } catch (error) {
         res.status(500).json({ message: "Error al actualizar reporte." });
    }
});

app.delete('/api/admin/reports/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'moderador')) return;
    try {
        const { id } = req.params;
        const [reports] = await db.query('SELECT location_id FROM reports WHERE id = ?', [id]);
        if (reports.length === 0) return res.status(404).json({ message: 'Reporte no encontrado.' });
        const { location_id } = reports[0];

        await db.query('DELETE FROM reports WHERE id = ?', [id]);
        await updateLocationStatusAfterReportChange(location_id);
        
        res.status(200).json({ message: 'Reporte eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el mensaje.' });
    }
});

app.post('/api/admin/reply', async (req, res) => {
    const { to, subject, body, adminUserId } = req.body;
    console.log('\n[ADMIN REPLY] Solicitud de respuesta recibida.');

    if (!await authAdmin(req, res, 'moderador')) return;

    if (!to || !subject || !body) {
        console.log('[ADMIN REPLY] Error: Faltan campos (to, subject, body).');
        return res.status(400).json({ message: 'Faltan campos requeridos para enviar la respuesta.' });
    }
    
    if (!transporter) {
        console.log('****************************************************');
        console.log('***     SIMULANDO ENVÍO DE EMAIL (NO CONFIG)     ***');
        console.log('****************************************************');
        console.log(`PARA: ${to}, ASUNTO: ${subject}`);
        console.log('-------------------- CUERPO --------------------');
        console.log(body);
        console.log('****************************************************');
        return res.status(200).json({ message: 'Respuesta enviada (simulación). Configura las variables de entorno de email para enviar correos reales.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"EcoGestión" <no-reply@ecogestion.com>',
        to: to,
        subject: subject,
        html: `<p>Hola,</p><p>Has recibido una respuesta de EcoGestión:</p><blockquote style="border-left: 2px solid #ccc; padding-left: 1rem; margin-left: 0;">${body.replace(/\n/g, '<br>')}</blockquote><p>Si tienes más preguntas, puedes responder a este correo.</p>`,
        text: `Hola,\n\nHas recibido una respuesta de EcoGestión:\n\n${body}\n\nSi tienes más preguntas, puedes responder a este correo.`,
    };

    try {
        console.log(`[ADMIN REPLY] Intentando enviar email a ${to}...`);
        await transporter.sendMail(mailOptions);
        console.log(`[ADMIN REPLY] Email enviado exitosamente a ${to}.`);
        res.status(200).json({ message: 'Respuesta enviada exitosamente.' });
    } catch (error) {
        console.error('----------------------------------------------------');
        console.error('>>> [ADMIN REPLY] ¡ERROR AL ENVIAR EL EMAIL! <<<');
        console.error('----------------------------------------------------');
        console.error(error);
        console.error('----------------------------------------------------');
        res.status(500).json({ message: 'Error en el servidor al enviar el email. Revisa la consola del backend.' });
    }
});


// --- Impact Stats Endpoints ---
app.get('/api/impact-stats', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM impact_stats WHERE id = 1');
        
        if (rows.length === 0) {
            console.warn("[GET IMPACT STATS] Fila no encontrada. Creando...");
            await db.query(`INSERT INTO impact_stats (id, recycled_kg, participants, points) VALUES (1, 14800, 5350, 48);`);
            const [newRows] = await db.query('SELECT * FROM impact_stats WHERE id = 1');
            res.json({ recycledKg: newRows[0].recycled_kg, participants: newRows[0].participants, points: newRows[0].points });
            return;
        }

        const stats = rows[0];
        res.json({
            recycledKg: stats.recycled_kg,
            participants: stats.participants,
            points: stats.points
        });
    } catch (error) {
        console.error("[GET IMPACT STATS] ERROR:", error);
        res.status(500).json({ message: "Error al obtener las estadísticas." });
    }
});


app.put('/api/impact-stats', async (req, res) => {
    if (!await authAdmin(req, res, 'moderador')) return;
    try {
        const { recycledKg, participants, points } = req.body;
        if (recycledKg === undefined || participants === undefined || points === undefined) {
            return res.status(400).json({ message: 'Todos los campos de estadísticas son requeridos.' });
        }
        const [result] = await db.query(
            'UPDATE impact_stats SET recycled_kg = ?, participants = ?, points = ? WHERE id = 1',
            [recycledKg, participants, points]
        );

        if (result.affectedRows === 0) {
            throw new Error("La fila de estadísticas no se encontró en la base de datos para actualizar. Intenta reiniciar el servidor.");
        }

        res.status(200).json({ message: 'Estadísticas actualizadas correctamente.' });
    } catch (error) {
        console.error("[UPDATE IMPACT STATS] ERROR:", error);
        res.status(500).json({ message: "Error al actualizar las estadísticas." });
    }
});


// --- Recycling Guide Endpoint ---
app.get('/api/recycling-guides', async (req, res) => {
    res.json(comoReciclarData);
});

// --- Start Server ---
const startServer = async () => {
    try {
        console.log('⏳ Inicializando la base de datos...');
        await initializeDatabase();
        
        app.listen(port, () => {
            console.log(`🚀 Servidor de EcoGestión escuchando en http://localhost:${port}`);
            console.log('✅ Base de datos y servidor listos.');
        });
    } catch (error) {
        console.error('❌ FATAL: No se pudo iniciar el servidor. La inicialización de la base de datos falló.');
        process.exit(1);
    }
};

startServer();