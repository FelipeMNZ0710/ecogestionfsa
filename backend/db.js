const mysql = require('mysql2/promise');
require('dotenv').config(); // Asegúrate de que dotenv se cargue aquí también

// --- Configuración de la Conexión a la Base de Datos ---
// Se crea un "pool" de conexiones. Es más eficiente y seguro que crear
// una conexión nueva para cada consulta a la base de datos.
const dbConfig = {
  // Utiliza variables de entorno para la configuración, pero con valores por defecto para un desarrollo local sencillo.
  // En un entorno de producción, DEBES configurar estas variables de entorno por seguridad.
  host: process.env.DB_HOST || 'localhost',          // La dirección de tu servidor de base de datos (usualmente 'localhost')
  user: process.env.DB_USER || 'root',              // Tu usuario de la base de datos
  password: process.env.DB_PASSWORD || '',          // La contraseña de tu usuario (déjala vacía si no tiene)
  database: process.env.DB_NAME || 'ecogestion_db', // El nombre de tu base de datos, como solicitaste.
  
  // Opciones recomendadas para el pool de conexiones
  waitForConnections: true,
  connectionLimit: 10, // Número máximo de conexiones simultáneas
  queueLimit: 0        // Sin límite para consultas en cola
};

console.log('--- Intentando conectar a la base de datos con la siguiente configuración: ---');
console.log(`Host: ${dbConfig.host}`);
console.log(`Usuario: ${dbConfig.user}`);
console.log(`Contraseña: ${dbConfig.password ? '******' : '(vacía)'}`);
console.log(`Base de datos: ${dbConfig.database}`);
console.log('-----------------------------------------------------------------------------');
console.log('Si esta información no coincide con tu configuración de XAMPP,');
console.log('corrige el archivo .env en la carpeta /backend y reinicia el servidor.');
console.log('-----------------------------------------------------------------------------');

const pool = mysql.createPool(dbConfig);

// Exportamos el pool para que pueda ser utilizado en otros archivos (como server.js)
module.exports = pool;
