'use strict'

const pg = require('pg')

const pool = new pg.Pool({
  database: 'cryptoboto',
  ssl: false
})

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

module.exports.query = (text, values) => {
  return pool.query(text, values)
}

module.exports.connect = () => {
  return pool.connect()
}
