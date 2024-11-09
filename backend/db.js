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
    
    // Increase timeouts for better stability
    connectTimeout: 60000,        // Increased to 60 seconds
    acquireTimeout: 60000,        // Added explicit acquire timeout
    timeout: 60000,              // Added general timeout
    
    // Connection retry settings
    maxRetries: 3,               // Added max retries
    retryDelay: 5000,           // Added delay between retries
    
    // Existing settings
    multipleStatements: true,
    namedPlaceholders: true
});

// Enhanced connection management
const createConnection = async (retries = 3) => {
    try {
        const connection = await pool.getConnection();
        console.log(`New connection established with threadId: ${connection.threadId}`);
        
        connection.on('error', async (err) => {
            console.error('Database connection error:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Database connection was closed. Attempting to reconnect...');
                await createConnection();
            }
        });
        
        return connection;
    } catch (err) {
        console.error(`Connection attempt failed (${retries} retries left):`, err);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            return createConnection(retries - 1);
        }
        throw err;
    }
};

// Enhanced test connection with retry logic
const testConnection = async (retries = 3) => {
    try {
        const connection = await createConnection();
        console.log('Connected to MySQL database successfully');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
        if (retries > 0) {
            console.log(`Retrying connection in 5 seconds... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return testConnection(retries - 1);
        } else {
            console.error('Max retries reached. Could not establish database connection.');
            process.exit(1);
        }
    }
};

// Pool error handling with reconnection logic
pool.on('error', async (err) => {
    console.error('Unexpected error on idle client', err);
    if (err.code === 'POOL_CLOSED') {
        console.log('Attempting to recreate pool...');
        await testConnection();
    } else {
        process.exit(-1);
    }
});

// Enhanced graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} signal received. Closing pool connections...`);
    try {
        await pool.end();
        console.log('Pool connections terminated successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error closing pool connections:', err);
        process.exit(1);
    }
};

// Handle multiple termination signals
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
    process.on(signal, () => gracefulShutdown(signal));
});

// Export a wrapper function for queries with retry logic
const executeQuery = async (queryFn, retries = 3) => {
    try {
        return await queryFn(pool);
    } catch (err) {
        if (err.code === 'ETIMEDOUT' && retries > 0) {
            console.log(`Query timed out. Retrying... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return executeQuery(queryFn, retries - 1);
        }
        throw err;
    }
};

// Initialize connection
testConnection();

module.exports = {
    pool,
    executeQuery
};