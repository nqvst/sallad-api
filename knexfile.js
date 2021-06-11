const parse = require('pg-connection-string').parse
// Parse the environment variable into an object
const connection = parse(process.env.DATABASE_URL)
// Add SSL setting to default environment variable
connection.ssl = { rejectUnauthorized: false }

module.exports = {
  development: {
    client: 'pg',
    connection,
    migrations: {
      directory: './data/migrations',
    },
    seeds: { directory: './data/seeds' },
    ssl: { rejectUnauthorized: false },
  },

  production: {
    client: 'pg',
    connection,
    migrations: {
      directory: './data/migrations',
    },
    seeds: { directory: './data/seeds' },
    ssl: { rejectUnauthorized: false },
  },
}
