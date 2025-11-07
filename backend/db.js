const { Pool } = require('pg');
require('dotenv').config();

console.log('--- Intentando conectar a la base de datos PostgreSQL ---');

if (!process.env.DATABASE_URL) {
  console.error('-----------------------------------------------------------------------------');
  console.error('❌ ERROR CRÍTICO: La variable de entorno DATABASE_URL no está definida.');
  console.error('Asegúrate de tener un archivo .env en la carpeta /backend con la URL de tu base de datos PostgreSQL.');
  console.error('Ejemplo: DATABASE_URL="postgresql://user:password@host:port/database"');
  console.error('Para despliegue en Render, esta variable se configura automáticamente.');
  console.error('-----------------------------------------------------------------------------');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En producción (como en Render), es común necesitar SSL.
  // Render gestiona esto a través de la URL de conexión, pero añadirlo explícitamente es una buena práctica.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('✅ Pool de conexiones de PostgreSQL conectado.');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente del pool de PostgreSQL', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getConnection: () => pool.connect(), // Para mantener consistencia con la API anterior
};