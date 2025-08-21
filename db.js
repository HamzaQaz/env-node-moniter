const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "new_password",
  database: "temp",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the promise-based connection pool
module.exports = pool.promise();