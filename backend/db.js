const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('--- Intentando conectar a la base de datos MySQL (XAMPP) ---');

// Configuración por defecto para XAMPP si no hay .env
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Por defecto en XAMPP es vacío
  database: process.env.DB_NAME || 'ecogestion_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test the connection
async function testConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`✅ Conexión a MySQL exitosa (BD: ${dbConfig.database})`);
    } catch (err) {
        console.error('-----------------------------------------------------------------------------');
        console.error('❌ ERROR DE CONEXIÓN A MYSQL:');
        console.error(err.message);
        console.error('-----------------------------------------------------------------------------');
        console.error('Asegúrate de:');
        console.error('1. Tener XAMPP/MySQL corriendo.');
        console.error('2. Haber creado la base de datos vacía llamada "ecogestion_db" en phpMyAdmin.');
        console.error('-----------------------------------------------------------------------------');
    } finally {
        if (connection) connection.release();
    }
}
testConnection();

module.exports = {
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection(),
};