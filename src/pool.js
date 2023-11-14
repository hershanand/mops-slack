const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;

console.log('---> db url : ', connectionString);

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
    });


module.exports = pool;

