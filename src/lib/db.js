var config = require('./config.js');

// importing mysql module
const mysql = require('mysql2/promise');

// configurations for creating mysql connection
console.log(config.mysql.database);
const pool = mysql.createPool({
    host: config.mysql.host,                  // host for connection
    port: config.mysql.port,                  // default port for mysql is 3306
    database: config.mysql.db,                // database from which we want to connect our node application
    user: config.mysql.db_user,              // username of the mysql connection
    password: config.mysql.db_password,       // password of the mysql connection

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;