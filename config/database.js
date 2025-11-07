import mysql from "mysql2/promise";
import { initializePromptPayTable } from '../utils/init-promptpay-table.js';

// MySQL Connection Pool Configuration
const pool = mysql.createPool({
    host: "210.246.215.19",
    user: "oxy_user",
    password: "OxyStrong123!",
    database: "oxy",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000, // 60 seconds
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000, // 10 seconds
    // Handle connection errors
    charset: "utf8mb4"
});

// Test database connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        console.log("✅ Database connected successfully!");
        connection.release();
        
        // Initialize PromptPay table after successful connection
        await initializePromptPayTable();
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
}

// Test connection when module is loaded
testConnection();

// Handle pool errors
pool.on('connection', (connection) => {
    console.log('📡 New database connection established');
});

pool.on('error', (err) => {
    console.error('❌ Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('🔄 Attempting to reconnect...');
        testConnection();
    }
});

export default pool;

