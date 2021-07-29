const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const pg = require('pg-promise')({});

const db = pg({
    host: 'localhost',
    port: parseInt(process.env.HOST_PORT),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
});

module.exports = { db };
