const mysql = require('mysql2');
require('dotenv').config();

// --- LOGS DE DEBUG (Para vermos no Railway se as variáveis chegaram) ---
console.log("--- CONECTANDO AO BANCO ---");
console.log("Host:", process.env.MYSQLHOST ? "Ok (Carregado)" : "ERRO: Vazio");
console.log("User:", process.env.MYSQLUSER);
console.log("Database:", process.env.MYSQLDATABASE ? "Ok (Carregado)" : "ERRO: Vazio");

// Criação do Pool de Conexão usando as variáveis CORRETAS do Railway
const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exporta já com suporte a Promises (async/await)
module.exports = pool.promise();