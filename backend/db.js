const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('--- Intentando conectar a la base de datos MySQL (XAMPP) ---');

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  console.error('-----------------------------------------------------------------------------');
  console.error('❌ ERROR CRÍTICO: Faltan variables de entorno para la base de datos MySQL.');
  console.error('Asegúrate de tener un archivo .env en la carpeta /backend con DB_HOST, DB_USER, DB_PASSWORD y DB_NAME.');
  console.error('Ejemplo para XAMPP:');
  console.error('DB_HOST=localhost');
  console.error('DB_NAME=ecogestion_db');
  console.error('DB_USER=root');
  console.error('DB_PASSWORD=');
  console.error('-----------------------------------------------------------------------------');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
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
        console.log('✅ Pool de conexiones de MySQL conectado.');
    } catch (err) {
        console.error('❌ Error al conectar con la base de datos MySQL:', err);
        process.exit(-1);
    } finally {
        if (connection) connection.release();
    }
}
testConnection();


module.exports = {
  // mysql2 usa '?' como placeholders en lugar de '$1, $2', etc.
  // El pool de promesas ya maneja las consultas correctamente.
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection(),
};