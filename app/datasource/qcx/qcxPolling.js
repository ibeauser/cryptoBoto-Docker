'use strict'

// Transaction Data Polling
// This file gathers data from the QuadrigaCX API on timer(10000, 10000) [10,000ms = 10 seconds],
// searching on query, qcxBooks
// adding book and exchange fields to the response stream,
// and sharing it through the exported rxjs Observable, QCXresponse.

// Powered by the QuadrigaCX API [https://www.quadrigacx.com/api_info]

const {
  timer,
  from,
  zip
} = require('rxjs')

const {
  concatAll,
  distinct,
  flatMap,
  map,
  repeat,
  share
} = require('rxjs/operators')

const https = require('https')
// const url = require('url')
const qcxURL = new URL('https://api.quadrigacx.com/v2/transactions?book=eth_cad&time=hour')

const qcxBooks = [ // currency data to request
  'eth_cad',
  'btc_cad',
  'eth_btc',
  'ltc_cad',
  'ltc_btc',
  'bsv_cad'
  // 'bch_cad',
  // 'bch_btc',
  // 'btg_cad',
  // 'btg_btc'
]

const requestHeaders = {
  'User-Agent': 'javascript'
}

const requests = zip(
  from(qcxRequest()),
  timer(10000, 10000),
  (requests, i) => { return requests }
)

const QCXresponse = requests.pipe(
  repeat(),
  map((request) => {
    let response = poll(request)
    return response
  }),
  flatMap((responses) => {
    return responses
  }),
  concatAll()
)

const QCXtransactions = QCXresponse.pipe(
  distinct((transactions) => {
    return transactions.tid
  }, timer(0, 960000)),
  share()
)

function qcxRequest () {
  let requests = []
  qcxBooks.forEach(book => {
    qcxURL.searchParams.set('book', book)
    // let urlOpts = url.parse(qcxURL.href)
    let urlOpts = new URL(qcxURL.href)
    urlOpts.headers = requestHeaders
    urlOpts.family = 4
    requests.push({ 'book': book, 'urlOpts': urlOpts })
  })
  return requests
}

function poll (request) {
  return from(
    new Promise((resolve, reject) => {
      let transRequest = https.request(request.urlOpts, (res) => {
        res.setEncoding('utf8')
        let QCXaccum = ''
        res.on('error', (e) => {
          console.error('transRequest response error message:', e)
          res.resume()
        })
        res.on('data', (chunk) => {
          QCXaccum += chunk
        })
        res.on('end', () => {
          let output = JSON.parse(QCXaccum)
          if (output.length > 0) {
            for (var i = 0; i < output.length; ++i) {
              output[i].book = request.book
              output[i].exchange = 'QCX'
            }
          }
          resolve(output)
        })
      })
      transRequest.on('error', (e) => {
        console.error('problem with transRequest:', e)
        // reject(e)
        reject(new Error('fail')).then(function () {
          // not called
        }, function (e) {
          console.log(e) // Stacktrace
        })
      })
      transRequest.end()
    })
  )
}

module.exports = {
  QCXtransactions: QCXtransactions
}
