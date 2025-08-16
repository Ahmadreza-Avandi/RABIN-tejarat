import mysql from 'mysql2/promise';

// Secure Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'mysql',
  user: process.env.DATABASE_USER || 'crm_app_user',
  password: process.env.DATABASE_PASSWORD || 'Cr@M_App_Us3r_2024!@#$%',
  database: process.env.DATABASE_NAME || 'crm_system',
  timezone: '+00:00',
  charset: 'utf8mb4',
  // Security settings
  ssl: false, // Set to true if using SSL
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
};

// Create connection pool for better performance
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Remove invalid options that cause warnings
  // acquireTimeout: 60000,
  // timeout: 60000,
});

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully to crm_system');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');

    // Try to create database if it doesn't exist
    if ((error as any)?.code === 'ER_BAD_DB_ERROR') {
      try {
        const tempConnection = await mysql.createConnection({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password,
        });

        await tempConnection.execute('CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await tempConnection.end();
        console.log('✅ Database crm_system created successfully');
        return true;
      } catch (createError) {
        console.error('❌ Failed to create database:', createError instanceof Error ? createError.message : 'Unknown error');
      }
    }

    return false;
  }
}

// Execute query with error handling
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    // Convert parameters to proper types for MySQL
    const processedParams = params.map(param => {
      if (param === undefined) return null;
      return param;
    });

    // For Docker environment, use query instead of execute for LIMIT/OFFSET
    if (query.includes('LIMIT ? OFFSET ?') && processedParams.length >= 2) {
      const limitIndex = query.indexOf('LIMIT ?');
      const modifiedQuery = query.substring(0, limitIndex) +
        `LIMIT ${processedParams[processedParams.length - 2]} OFFSET ${processedParams[processedParams.length - 1]}`;

      // Remove the last two parameters (limit and offset)
      const modifiedParams = processedParams.slice(0, -2);

      const [rows] = await pool.query(modifiedQuery, modifiedParams);
      return rows as T[];
    } else {
      const [rows] = await pool.execute(query, processedParams);
      return rows as T[];
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Database operation failed');
  }
}

// Execute single query (for inserts, updates, deletes)
export async function executeSingle(
  query: string,
  params: any[] = []
): Promise<any> {
  try {
    console.log('Executing query:', query);
    console.log('With params:', params);

    // Convert parameters to proper types for MySQL
    const processedParams = params.map(param => {
      if (param === undefined) return null;
      return param;
    });

    // For Docker environment, use query instead of execute for LIMIT/OFFSET
    if (query.includes('LIMIT ? OFFSET ?') && processedParams.length >= 2) {
      const limitIndex = query.indexOf('LIMIT ?');
      const modifiedQuery = query.substring(0, limitIndex) +
        `LIMIT ${processedParams[processedParams.length - 2]} OFFSET ${processedParams[processedParams.length - 1]}`;

      // Remove the last two parameters (limit and offset)
      const modifiedParams = processedParams.slice(0, -2);

      const [result] = await pool.query(modifiedQuery, modifiedParams);
      return result;
    } else {
      const [result] = await pool.execute(query, processedParams);
      return result;
    }
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query was:', query);
    console.error('Params were:', params);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Database operation failed: ${errorMessage}`);
  }
}