import pool from "../config/database.js";

/**
 * Execute query with automatic retry on connection errors
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<any>} Query result
 */
export async function executeQuery(query, params = [], maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await pool.query(query, params);
            return result;
        } catch (error) {
            lastError = error;
            
            // Check if error is connection-related
            const isConnectionError = 
                error.code === 'ECONNRESET' ||
                error.code === 'PROTOCOL_CONNECTION_LOST' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.errno === -4077;
            
            if (isConnectionError && attempt < maxRetries) {
                console.log(`⚠️ Database connection error (attempt ${attempt}/${maxRetries}). Retrying...`);
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
            
            // If not a connection error or max retries reached, throw the error
            throw error;
        }
    }
    
    throw lastError;
}

/**
 * Get a connection from pool with retry logic
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<Connection>} Database connection
 */
export async function getConnection(maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const connection = await pool.getConnection();
            return connection;
        } catch (error) {
            lastError = error;
            
            const isConnectionError = 
                error.code === 'ECONNRESET' ||
                error.code === 'PROTOCOL_CONNECTION_LOST' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.errno === -4077;
            
            if (isConnectionError && attempt < maxRetries) {
                console.log(`⚠️ Failed to get connection (attempt ${attempt}/${maxRetries}). Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
            }
            
            throw error;
        }
    }
    
    throw lastError;
}

export default { executeQuery, getConnection };

