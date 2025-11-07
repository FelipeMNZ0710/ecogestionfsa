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
// Render asigna el puerto dinámicamente a través de la variable de entorno PORT
const port = process.env.PORT || 3001;
const saltRounds = 10;

// --- Middlewares ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
        console.log('✅ Conexión a la base de datos PostgreSQL exitosa.');
        
        // --- Users Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              points INT DEFAULT 0,
              kg_recycled DECIMAL(10,2) DEFAULT 0.00,
              role VARCHAR(20) CHECK (role IN ('usuario','moderador','dueño')) DEFAULT 'usuario',
              unlocked_achievements TEXT DEFAULT NULL,
              stats TEXT DEFAULT NULL,
              last_login TIMESTAMP DEFAULT NULL,
              favorite_locations TEXT DEFAULT NULL,
              banner_url TEXT DEFAULT NULL,
              profile_picture_url TEXT DEFAULT NULL,
              title VARCHAR(255) DEFAULT NULL,
              bio TEXT DEFAULT NULL,
              socials TEXT DEFAULT NULL
            );
        `);
        console.log('✅ Tabla "users" asegurada.');

        // --- Locations Table ---
        await connection.query(`
             CREATE TABLE IF NOT EXISTS locations (
              id VARCHAR(255) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              address VARCHAR(255) NOT NULL,
              description TEXT,
              hours VARCHAR(255),
              schedule JSONB,
              materials JSONB,
              map_data JSONB,
              status VARCHAR(20) CHECK (status IN ('ok', 'reported', 'maintenance', 'serviced')) NOT NULL DEFAULT 'ok',
              last_serviced DATE,
              check_ins INT DEFAULT 0,
              image_urls JSONB
            );
        `);
        console.log('✅ Tabla "locations" asegurada.');
        
        // --- Impact Stats Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS impact_stats (
              id SERIAL PRIMARY KEY,
              recycled_kg INT NOT NULL DEFAULT 0,
              participants INT NOT NULL DEFAULT 0,
              points INT NOT NULL DEFAULT 0
            );
        `);
        console.log('✅ Tabla "impact_stats" asegurada.');
        const { rows: statsRows } = await db.query('SELECT * FROM impact_stats WHERE id = 1');
        if (statsRows.length === 0) {
            await db.query(`INSERT INTO impact_stats (id, recycled_kg, participants, points) VALUES (1, 14800, 5350, 48);`);
            console.log('✅ Datos iniciales de estadísticas insertados.');
        } else {
            console.log('✅ Fila de estadísticas verificada.');
        }

        // --- News Articles Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS news_articles (
              id SERIAL PRIMARY KEY,
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
        
        // --- Games Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS games (
              id SERIAL PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              category VARCHAR(100) NOT NULL,
              image VARCHAR(255) NOT NULL,
              type VARCHAR(50) NOT NULL,
              learningObjective TEXT NOT NULL,
              payload JSONB DEFAULT NULL,
              rating DECIMAL(3,2) DEFAULT 3.50,
              ratings_count INT DEFAULT 0
            );
        `);
        console.log('✅ Tabla "games" asegurada.');
        
        const { rows: gameRows } = await db.query('SELECT COUNT(*) as count FROM games');
        if (gameRows[0].count === '0') {
            console.log('⏳ La tabla "games" está vacía. Poblando con datos iniciales...');
            for (const g of gamesData) {
                await connection.query(
                    'INSERT INTO games (id, title, category, image, type, learningObjective, payload, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
                    [g.id, g.title, g.category, g.image, g.type, g.learningObjective, JSON.stringify(g.payload), g.rating]
                );
            }
            console.log(`✅ ¡${gamesData.length} juegos insertados/verificados en la base de datos!`);
        } else {
            console.log('✅ Tabla "games" verificada.');
        }

        // --- User Game Scores Table ---
        await connection.query(`
             CREATE TABLE IF NOT EXISTS user_game_scores (
              user_id INT NOT NULL,
              game_id INT NOT NULL,
              high_score INT NOT NULL DEFAULT 0,
              PRIMARY KEY (user_id, game_id),
              CONSTRAINT user_game_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              CONSTRAINT user_game_scores_game_id_fkey FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
            );
        `);
        await connection.query('CREATE INDEX IF NOT EXISTS idx_user_game_scores_game_id ON user_game_scores(game_id);');
        console.log('✅ Tabla "user_game_scores" asegurada.');

        // --- Reports Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reports (
              id SERIAL PRIMARY KEY,
              location_id VARCHAR(255) NOT NULL,
              user_id INT NOT NULL,
              reason VARCHAR(20) CHECK (reason IN ('full', 'dirty', 'damaged', 'other')) NOT NULL,
              comment TEXT,
              image_url TEXT,
              status VARCHAR(20) CHECK (status IN ('pending', 'resolved', 'dismissed')) NOT NULL DEFAULT 'pending',
              reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await connection.query('CREATE INDEX IF NOT EXISTS idx_reports_location_id ON reports(location_id);');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);');
        console.log('✅ Tabla "reports" asegurada.');

        // --- Contact Messages Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              subject VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              status VARCHAR(20) CHECK (status IN ('unread', 'read', 'archived')) NOT NULL DEFAULT 'unread',
              submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla "contact_messages" asegurada.');

        // --- Community Messages Table ---
        await connection.query(`
            CREATE TABLE IF NOT EXISTS community_messages (
              id SERIAL PRIMARY KEY,
              channel_id INT NOT NULL,
              user_id INT NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              edited BOOLEAN DEFAULT FALSE,
              reactions JSONB,
              replying_to_message_id INT DEFAULT NULL
            );
        `);
        await connection.query('CREATE INDEX IF NOT EXISTS idx_community_messages_channel_id ON community_messages(channel_id);');
        await connection.query('CREATE INDEX IF NOT EXISTS idx_community_messages_user_id ON community_messages(user_id);');
        console.log('✅ Tabla "community_messages" asegurada.');

    } catch (error) {
        console.error('❌ ERROR CRÍTICO durante la inicialización de la base de datos:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// --- Helper to format user for frontend ---
const formatUserForFrontend = (dbUser) => {
    if (!dbUser) return null;
    const { allAchievements } = require('./data/achievementsData');
    
    const unlockedIds = new Set(dbUser.unlocked_achievements ? JSON.parse(dbUser.unlocked_achievements) : []);
    
    const userAchievements = allAchievements.map(ach => ({
        ...ach,
        unlocked: unlockedIds.has(ach.id)
    }));

    return {
        id: dbUser.id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        points: dbUser.points,
        kgRecycled: parseFloat(dbUser.kg_recycled),
        role: dbUser.role,
        achievements: userAchievements,
        favoriteLocations: dbUser.favorite_locations ? JSON.parse(dbUser.favorite_locations) : [],
        lastLogin: dbUser.last_login ? new Date(dbUser.last_login).toISOString().split('T')[0] : null,
        bannerUrl: dbUser.banner_url,
        profilePictureUrl: dbUser.profile_picture_url,
        title: dbUser.title,
        bio: dbUser.bio,
        socials: dbUser.socials ? JSON.parse(dbUser.socials) : {},
        stats: dbUser.stats ? JSON.parse(dbUser.stats) : {
            messagesSent: 0, pointsVisited: 0, reportsMade: 0, dailyLogins: 0, completedQuizzes: [], quizzesCompleted: 0, gamesPlayed: 0, objectsIdentified: 0
        },
    };
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
        const { rows: existingUsers } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
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

        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, last_login, role, points, kg_recycled, stats) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            ['usuario', 0, 0, defaultStats]
        );
        const newUserId = result.rows[0].id;
        console.log(`[REGISTER] ¡ÉXITO! Usuario insertado en la DB con ID: ${newUserId}.`);

        console.log('[REGISTER] Obteniendo datos del nuevo usuario para devolver al frontend...');
        const { rows: newUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [newUserId]);
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
        
        const { rows: users } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
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
        await db.query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), dbUser.id]);
        
        const { rows: refetchedUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [dbUser.id]);

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
            await db.query('UPDATE locations SET check_ins = check_ins + 1 WHERE id = $1', [payload.locationId]);
        }
        
        if (action === 'complete_game' && payload?.gameId && payload?.score !== undefined) {
             await db.query(
                `INSERT INTO user_game_scores (user_id, game_id, high_score) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (user_id, game_id) 
                 DO UPDATE SET high_score = GREATEST(user_game_scores.high_score, EXCLUDED.high_score)`,
                [userId, payload.gameId, payload.score]
            );
        }

        const { rows: userRows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        const dbUser = userRows[0];
        // Parse JSON fields for the service
        dbUser.stats = dbUser.stats ? JSON.parse(dbUser.stats) : {};
        dbUser.unlocked_achievements = dbUser.unlocked_achievements ? JSON.parse(dbUser.unlocked_achievements) : [];

        const { updatedUser, notifications } = processAction(dbUser, action, payload);

        // Persist changes to DB
        await db.query(
            'UPDATE users SET points = $1, last_login = $2, stats = $3, unlocked_achievements = $4 WHERE id = $5',
            [
                updatedUser.points,
                updatedUser.last_login,
                JSON.stringify(updatedUser.stats),
                JSON.stringify(updatedUser.unlocked_achievements),
                userId
            ]
        );
        
        const { rows: refetchedUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        res.status(200).json({
            updatedUser: formatUserForFrontend(refetchedUserRows[0]),
            notifications
        });

    } catch (error) {
        console.error('[USER ACTION] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al procesar la acción.' });
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
        let paramIndex = 1;
        for (const key in fieldsToUpdate) {
            if (columnMapping[key]) {
                setClauses.push(`${columnMapping[key]} = $${paramIndex++}`);
                values.push(fieldsToUpdate[key]);
            }
        }
        if (setClauses.length === 0) return res.status(400).json({ message: 'Ninguno de los campos proporcionados es válido.' });
        
        values.push(id);
        const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;
        await db.query(sql, values);

        const { rows: updatedUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
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
        
        const { rows: users } = await db.query('SELECT favorite_locations FROM users WHERE id = $1', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        let favorites = users[0].favorite_locations ? JSON.parse(users[0].favorite_locations) : [];
        const index = favorites.indexOf(locationId);
        if (index > -1) favorites.splice(index, 1); else favorites.push(locationId);
        
        await db.query('UPDATE users SET favorite_locations = $1 WHERE id = $2', [JSON.stringify(favorites), userId]);

        const { rows: updatedUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        res.status(200).json(formatUserForFrontend(updatedUserRows[0]));
    } catch (error) {
        console.error('[UPDATE FAVORITES] ERROR:', error);
        res.status(500).json({ message: 'Error en el servidor al actualizar favoritos.' });
    }
});

// --- Puntos Verdes & Reports ---
const updateLocationStatusAfterReportChange = async (locationId) => {
    try {
        const { rows: [{ pending_count }] } = await db.query(
            'SELECT COUNT(*) as pending_count FROM reports WHERE location_id = $1 AND status = $2',
            [locationId, 'pending']
        );

        if (Number(pending_count) === 0) {
            console.log(`[Location Status] No hay reportes pendientes para ${locationId}. Actualizando a 'serviced'.`);
            await db.query(
                "UPDATE locations SET status = 'serviced', last_serviced = NOW() WHERE id = $1 AND status = 'reported'",
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
        const { rows: locations } = await db.query(`
            SELECT 
                l.*, 
                (SELECT COUNT(*) FROM reports WHERE location_id = l.id AND status = 'pending') as "reportCount",
                (SELECT reason FROM reports WHERE location_id = l.id AND status = 'pending' ORDER BY reported_at DESC LIMIT 1) as "latestReportReason"
            FROM locations l
        `);
        const formattedLocations = locations.map(loc => ({
            ...loc,
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
        const { rows: [insertedRow] } = await db.query(
            'INSERT INTO locations (id, name, address, description, hours, schedule, materials, map_data, status, last_serviced, check_ins, image_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [newLocation.id, newLocation.name, newLocation.address, newLocation.description, newLocation.hours, JSON.stringify(newLocation.schedule || []), JSON.stringify(newLocation.materials || []), JSON.stringify(newLocation.mapData || {}), newLocation.status || 'ok', newLocation.lastServiced || new Date(), 0, JSON.stringify(newLocation.imageUrls || [])]
        );
        res.status(201).json(insertedRow);
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
        const { rows: [updatedRow] } = await db.query(
            'UPDATE locations SET name = $1, address = $2, description = $3, hours = $4, schedule = $5, materials = $6, map_data = $7, status = $8, last_serviced = $9, image_urls = $10 WHERE id = $11 RETURNING *',
            [updatedLocation.name, updatedLocation.address, updatedLocation.description, updatedLocation.hours, JSON.stringify(updatedLocation.schedule), JSON.stringify(updatedLocation.materials), JSON.stringify(updatedLocation.mapData), updatedLocation.status, updatedLocation.lastServiced, JSON.stringify(updatedLocation.imageUrls), id]
        );
        res.status(200).json(updatedRow);
    } catch(error) {
        console.error("[UPDATE LOCATION] ERROR:", error);
        res.status(500).json({ message: "Error al actualizar la ubicación." });
    }
});

app.delete('/api/locations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM reports WHERE location_id = $1', [id]);
        await db.query('DELETE FROM locations WHERE id = $1', [id]);
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
            'INSERT INTO reports (user_id, location_id, reason, comment, image_url) VALUES ($1, $2, $3, $4, $5)',
            [userId, locationId, reason, comment, imageUrl]
        );
        await db.query("UPDATE locations SET status = 'reported' WHERE id = $1", [locationId]);
        
        const { rows: updatedLocations } = await db.query('SELECT * FROM locations WHERE id = $1', [locationId]);
        res.status(201).json(updatedLocations[0]);
    } catch (error) {
        console.error("[REPORT LOCATION] ERROR:", error);
        res.status(500).json({ message: "Error al enviar el reporte." });
    }
});

// --- News Management ---
app.get('/api/news', async (req, res) => {
    try {
        const { rows: articles } = await db.query('SELECT * FROM news_articles ORDER BY published_at DESC, id DESC');
        res.json(articles);
    } catch (error) {
        console.error("[GET NEWS] ERROR:", error);
        res.status(500).json({ message: "Error al obtener las noticias." });
    }
});

app.post('/api/news', async (req, res) => {
    try {
        const { title, category, image, excerpt, content, featured, adminUserId } = req.body;
        const { rows: [newArticle] } = await db.query(
            `INSERT INTO news_articles (title, category, image, excerpt, content, featured, author_id, published_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
            [title, category, image, excerpt, JSON.stringify(content), featured, adminUserId]
        );
        res.status(201).json({ id: newArticle.id, message: 'Noticia creada.' });
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
            `UPDATE news_articles SET title = $1, category = $2, image = $3, excerpt = $4, content = $5, featured = $6
             WHERE id = $7`,
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
        await db.query('DELETE FROM news_articles WHERE id = $1', [id]);
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
            const result = await db.query(
                `SELECT g.*, ugs.high_score 
                 FROM games g 
                 LEFT JOIN user_game_scores ugs ON g.id = ugs.game_id AND ugs.user_id = $1 
                 ORDER BY g.id ASC`, 
                [userId]
            );
            games = result.rows;
        } else {
            const result = await db.query('SELECT * FROM games ORDER BY id ASC');
            games = result.rows;
        }

        const formattedGames = games.map(g => ({
            ...g,
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
        const { rows: [newGame] } = await db.query(
            `INSERT INTO games (title, category, image, type, learningObjective, payload) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [title, category, image, type, learningObjective, JSON.stringify(payload)]
        );
        res.status(201).json({ id: newGame.id, message: 'Juego creado.' });
    } catch (error) {
        console.error('[CREATE GAME] ERROR:', error);
        res.status(500).json({ message: 'Error al crear el juego.' });
    }
});

app.put('/api/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, image, type, learningObjective, payload } = req.body;
        const result = await db.query(
            `UPDATE games SET title = $1, category = $2, image = $3, type = $4, learningObjective = $5, payload = $6 WHERE id = $7`,
            [title, category, image, type, learningObjective, JSON.stringify(payload), id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Juego no encontrado.' });
        res.status(200).json({ message: 'Juego actualizado.' });
    } catch (error) {
        console.error('[UPDATE GAME] ERROR:', error);
        res.status(500).json({ message: 'Error al actualizar el juego.' });
    }
});

app.delete('/api/games/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM user_game_scores WHERE game_id = $1', [id]);
        const result = await db.query('DELETE FROM games WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Juego no encontrado.' });
        res.status(200).json({ message: 'Juego eliminado.' });
    } catch (error) {
        console.error('[DELETE GAME] ERROR:', error);
        res.status(500).json({ message: 'Error al eliminar el juego.' });
    }
});


// --- Community Endpoints ---
let communityChannels = [
    { id: 1, name: 'general', description: 'Charlas generales' },
    { id: 2, name: 'dudas', description: 'Preguntas sobre reciclaje' },
    { id: 3, name: 'anuncios', description: 'Anuncios importantes', admin_only_write: true },
];
let nextChannelId = 4;

const isAdmin = async (req, res, next) => {
    const { userId, userRole } = req.body;
    if (userRole === 'dueño' || userRole === 'moderador') {
        return next();
    }
    if (userId) {
        try {
            const { rows: users } = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
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
    res.json(communityChannels);
});

app.post('/api/community/channels', isAdmin, async (req, res) => {
    const { name, description, admin_only_write } = req.body;
    if (!name || !description) {
        return res.status(400).json({ message: 'Nombre y descripción son requeridos.' });
    }
    const newChannel = {
        id: nextChannelId++,
        name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description,
        admin_only_write: !!admin_only_write
    };
    communityChannels.push(newChannel);
    res.status(201).json(newChannel);
});

app.delete('/api/community/channels/:id', isAdmin, async (req, res) => {
    const channelId = parseInt(req.params.id, 10);
    const channelIndex = communityChannels.findIndex(c => c.id === channelId);

    if (channelIndex === -1) return res.status(404).json({ message: 'Canal no encontrado.' });
    if (channelId === 1) return res.status(400).json({ message: 'No se puede eliminar el canal #general.' });

    communityChannels.splice(channelIndex, 1);
    
    try {
        await db.query('DELETE FROM community_messages WHERE channel_id = $1', [channelId]);
    } catch(error) {
        console.error(`[DELETE CHANNEL MESSAGES] Error:`, error);
    }
    
    res.status(200).json({ message: 'Canal eliminado.' });
});

app.get('/api/community/members', async (req, res) => {
     try {
        const { rows: members } = await db.query("SELECT id, name, profile_picture_url, role FROM users ORDER BY name");
        const formattedMembers = members.map(m => ({
            id: m.id.toString(),
            name: m.name,
            profile_picture_url: m.profile_picture_url,
            is_admin: m.role === 'dueño' || m.role === 'moderador'
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
        const { rows: messages } = await db.query(
            `SELECT 
                m.id, m.user_id, m.content, m.created_at, m.edited, m.reactions, m.replying_to_message_id,
                u.name as user, u.profile_picture_url as avatarUrl
             FROM community_messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.channel_id = $1 
             ORDER BY m.created_at ASC`, [channelId]
        );
        
        const replyIds = messages.map(m => m.replying_to_message_id).filter(id => id);
        let repliesMap = {};
        if (replyIds.length > 0) {
            const { rows: replyMessages } = await db.query(
                `SELECT m.id, m.content, u.name as user 
                 FROM community_messages m 
                 JOIN users u ON m.user_id = u.id 
                 WHERE m.id = ANY($1::int[])`, [replyIds]
            );
            repliesMap = replyMessages.reduce((acc, reply) => {
                acc[reply.id] = { messageId: reply.id, user: reply.user, text: reply.content };
                return acc;
            }, {});
        }
        
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            user_id: msg.user_id.toString(),
            user: msg.user,
            avatarUrl: msg.avatarUrl,
            timestamp: msg.created_at,
            text: msg.content,
            edited: msg.edited,
            reactions: msg.reactions || {},
            replyingTo: msg.replying_to_message_id ? repliesMap[msg.replying_to_message_id] : null
        }));
        
        res.json(formattedMessages);
    } catch (error) {
        console.error(`[GET MESSAGES] Error:`, error);
        res.status(500).json({ message: 'Error al obtener mensajes.' });
    }
});

app.post('/api/community/messages', async (req, res) => {
     try {
        const { channelId, userId, content, replyingToId } = req.body;
        await db.query(
            'INSERT INTO community_messages (channel_id, user_id, content, replying_to_message_id) VALUES ($1, $2, $3, $4)',
            [channelId, userId, content, replyingToId || null]
        );
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
        
        const { rows: messages } = await db.query('SELECT user_id FROM community_messages WHERE id = $1', [messageId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Mensaje no encontrado.' });

        const messageAuthorId = messages[0].user_id.toString();
        if (messageAuthorId !== userId && userRole !== 'dueño' && userRole !== 'moderador') {
            return res.status(403).json({ message: 'No tienes permiso para editar este mensaje.' });
        }
        
        await db.query(
            'UPDATE community_messages SET content = $1, edited = true WHERE id = $2',
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
        
        const { rows: messages } = await db.query('SELECT user_id FROM community_messages WHERE id = $1', [messageId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Mensaje no encontrado.' });

        const messageAuthorId = messages[0].user_id.toString();
        if (messageAuthorId !== userId && userRole !== 'dueño' && userRole !== 'moderador') {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este mensaje.' });
        }
        
        await db.query('DELETE FROM community_messages WHERE id = $1', [messageId]);
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

        const { rows: messages } = await db.query('SELECT reactions FROM community_messages WHERE id = $1', [messageId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Mensaje no encontrado.' });

        let reactions = messages[0].reactions || {};

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
            'UPDATE community_messages SET reactions = $1 WHERE id = $2',
            [JSON.stringify(reactions), messageId]
        );
        res.status(200).json({ message: 'Reacción actualizada.' });
    } catch (error) {
        console.error("[REACT MESSAGE] ERROR:", error);
        res.status(500).json({ message: "Error al reaccionar al mensaje." });
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
        const { rows: admins } = await db.query('SELECT role FROM users WHERE id = $1', [adminUserId]);
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
        const { rows: users } = await db.query('SELECT * FROM users ORDER BY name ASC');
        res.json(users.map(formatUserForFrontend));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios.' });
    }
});

app.get('/api/admin/users/:id', async (req, res) => {
    if (!await authAdmin(req, res, 'dueño')) return;
    try {
        const { rows: users } = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
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
        await db.query('UPDATE users SET name = $1, role = $2, points = $3 WHERE id = $4', [name, role, points, id]);
        const { rows: updatedUsers } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
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
        await db.query('DELETE FROM community_messages WHERE user_id = $1', [id]);
        await db.query('DELETE FROM reports WHERE user_id = $1', [id]);
        await db.query('DELETE FROM users WHERE id = $1', [id]);
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
        const { rows: users } = await db.query('SELECT unlocked_achievements FROM users WHERE id = $1', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        
        let unlockedIds = new Set(users[0].unlocked_achievements ? JSON.parse(users[0].unlocked_achievements) : []);
        if (unlocked) {
            unlockedIds.add(String(achievementId));
        } else {
            unlockedIds.delete(String(achievementId));
        }
        
        await db.query('UPDATE users SET unlocked_achievements = $1 WHERE id = $2', [JSON.stringify(Array.from(unlockedIds)), id]);
        
        const { rows: updatedUsers } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
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
            'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)',
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
        const { rows: messages } = await db.query('SELECT * FROM contact_messages ORDER BY submitted_at DESC');
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
        await db.query('UPDATE contact_messages SET status = $1 WHERE id = $2', [status, id]);
        const { rows: updatedMessages } = await db.query('SELECT * FROM contact_messages WHERE id = $1', [id]);
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
        await db.query('DELETE FROM contact_messages WHERE id = $1', [id]);
        res.status(200).json({ message: 'Mensaje eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el mensaje.' });
    }
});

app.get('/api/admin/reports', async (req, res) => {
    if (!await authAdmin(req, res, 'moderador')) return;
    try {
        const { rows: reports } = await db.query(
            `SELECT r.*, u.name as "userName", u.email as "userEmail", l.name as "locationName" 
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
        
        const { rows: reports } = await db.query('SELECT location_id FROM reports WHERE id = $1', [id]);
        if (reports.length === 0) return res.status(404).json({ message: 'Reporte no encontrado.' });
        const { location_id } = reports[0];
        
        await db.query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);

        if (status === 'resolved' || status === 'dismissed') {
            await updateLocationStatusAfterReportChange(location_id);
        }

        const { rows: updatedReports } = await db.query(
            `SELECT r.*, u.name as "userName", u.email as "userEmail", l.name as "locationName" 
             FROM reports r JOIN users u ON r.user_id = u.id 
             JOIN locations l ON r.location_id = l.id 
             WHERE r.id = $1`,
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
        const { rows: reports } = await db.query('SELECT location_id FROM reports WHERE id = $1', [id]);
        if (reports.length === 0) return res.status(404).json({ message: 'Reporte no encontrado.' });
        const { location_id } = reports[0];

        await db.query('DELETE FROM reports WHERE id = $1', [id]);
        await updateLocationStatusAfterReportChange(location_id);
        
        res.status(200).json({ message: 'Reporte eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el reporte.' });
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
        const { rows } = await db.query('SELECT * FROM impact_stats WHERE id = 1');
        
        if (rows.length === 0) {
            console.warn("[GET IMPACT STATS] Fila no encontrada. Creando...");
            await db.query(`INSERT INTO impact_stats (id, recycled_kg, participants, points) VALUES (1, 14800, 5350, 48) ON CONFLICT (id) DO NOTHING;`);
            const { rows: newRows } = await db.query('SELECT * FROM impact_stats WHERE id = 1');
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
        const result = await db.query(
            'UPDATE impact_stats SET recycled_kg = $1, participants = $2, points = $3 WHERE id = 1',
            [recycledKg, participants, points]
        );

        if (result.rowCount === 0) {
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