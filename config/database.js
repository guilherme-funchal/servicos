require('dotenv').config();

module.exports = {
dialect:  process.env.DB_DIALECT,
username: process.env.DB_USER,
host: process.env.DB_HOST,
database: process.env.DB_DATABASE,
password: process.env.DB_PASSWORD,
port: process.env.DB_PORT
};