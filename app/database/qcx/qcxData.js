'use strict'

// Transaction Data Capture
// This file receives transaction data from qcxPolling.js, loading it as a jsonb object in a Postgres database table.
// Successful insert event flags are shared through the rxjs Observable transInsertEvent.

const {
  filter,
  map,
  mergeAll
} = require('rxjs/operators')

const {
  QCXtransactions
} = require('../../datasource/qcx/qcxPolling')

const {
  connect
} = require('../db')

// const moment = require('moment')
const format = require('pg-format')

const transInsertEvent = QCXtransactions.pipe( // successful INSERT events will trigger a chart refresh in index.js
  map((transaction) => {
    let dbEvent = (async () => {
      let tid
      const client = await connect()
      try {
        await client.query('BEGIN')
        const insertTrans = format('INSERT INTO transaction(data) VALUES (%L) ON CONFLICT DO NOTHING RETURNING *', transaction)
        await client.query(insertTrans, (err, res) => {
          if (err) {
            console.log(err.stack)
          } else if (res.rowCount > 0) {
            tid = JSON.stringify(res.rows[0].data.tid)
            // console.log('qcxData.js transInsertEvent TID:', tid, 'at:', moment().toISOString(true))
            // could have data for 'top-of-screen' ticker collected here (also see index.js)
          }
        })
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        console.error('db INSERT catch e:', e)
        throw e
      } finally {
        client.release()
      }
      return tid
    })()
    return dbEvent
  }),
  mergeAll(),
  filter(tid => tid !== undefined)
)

module.exports = {
  transInsertEvent: transInsertEvent
}
