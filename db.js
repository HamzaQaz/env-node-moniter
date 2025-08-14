const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password123",
  database: "temp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the promise-based connection pool
module.exports = pool.promise();