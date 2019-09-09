'use strict'

// Transaction Data Interface
// This file selects transaction data and renders the '/' index page, emitting updates via websockets when triggered by connection or db INSERT events.

const {
  from
} = require('rxjs')

const {
  map
} = require('rxjs/operators')

const {
  transInsertEvent
} = require('../database/qcx/qcxData')

const {
  query
} = require('../database/db')

const io = require('../websockets/socketAPI')
const express = require('express')
const indexRouter = express.Router()
const format = require('pg-format')
 const moment = require('moment')

const socketDataSelectStatement = format('SELECT exchange, book, tid, side, api_date, price, amount FROM %I', 'moving_price_chart_data')

const bookSelectStatement = format( // pug variables for currencyPairs radiobuttons
  "SELECT UPPER(REPLACE(book,'_', '/')) AS pair FROM %I",
  'currency_pairs')

let currencyPairs = []

renderPage(bookSelectStatement, currencyPairs)

io
  .of('/')
  .on('connection', async () => { // emit transaction data on websocket connection event
    from(socketDataSelect()).pipe(
      map((socketData) => {
        io.emit('connectdata', socketData)
        // console.log('index.js on connection transactions emitted at:', moment().toISOString(true), 'Data length:', socketData.length, socketData)
        return socketData.length
      })
    ).subscribe(
      undefined,
      (e) => console.error(e),
      undefined
    )
  })

transInsertEvent.pipe( // emit transaction data on INSERT event from qcxData.js
  map((tid) => {
    from(socketDataSelect()).pipe(
      map((socketData) => {
        io.emit('data', socketData)
        console.log('index.js on update by transInsertEvent, emitted at:', moment().toISOString(true), 'TID:', tid, 'Data length:', socketData.length, socketData)
        // could have data for 'top-of-screen' ticker emitted from here (also see qcxData.js)
        // return socketData.length
      })
    ).subscribe(
      undefined,
      // (x) => console.log('from(socketDataSelect()', x),
      (e) => console.error(e),
      undefined
    )
  })
).subscribe(
  // () => { console.log('index.js transInsertEvent next() fired at', moment().toISOString(true)) },
  undefined,
  (error) => { console.log('transInsertEvent io.emit subscribe error', error) },
  () => { console.log('transInsertEvent unsubscribed') }
)

function socketDataSelect () {
  return from(
    new Promise((resolve, reject) => {
      query(socketDataSelectStatement, function (err, res) {
        if (err) {
          console.log(err.stack)
          reject(err)
        }
        let socketData = res.rows
        resolve(socketData)
      })
    })
  )
}

function renderPage (bookSelectStatement) {
  (async () => {
    await query(bookSelectStatement, function (err, res) {
      if (err) {
        console.log(err.stack)
        return
      }
      let currencyPairs = res.rows
      indexRouter.get('/', (req, res) => {
        res.render('index', {
          pairs: currencyPairs
        })
      })
    })
  })()
}

module.exports = indexRouter
