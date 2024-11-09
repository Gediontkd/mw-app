// backend/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'tournament_db',
    port: process.env.DB_PORT || 3306,
    
    // Connection pool settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    
    // Keep connection alive
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    
    // Handle timeouts
    connectTimeout: 10000,
    
    // Auto reconnect
    multipleStatements: true,
    namedPlaceholders: true
});

// Error handling
pool.on('connection', (connection) => {
    console.log('New connection established with threadId:', connection.threadId);
    
    connection.on('error', (err) => {
        console.error('Database connection error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed. Attempting to reconnect...');
        }
    });
});

// Test the connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database successfully');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
        // Wait and try to reconnect
        setTimeout(testConnection, 5000);
    }
};

testConnection();

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('Pool connections terminated');
        process.exit(0);
    } catch (err) {
        console.error('Error closing pool connections:', err);
        process.exit(1);
    }
});

module.exports = pool;