'use strict'
/* global Chart io moment */

// Transaction Data Chart
// This file builds and refreshes a chart that plots price by date, highlighting buy vs. sell transactions.
// User selects currency; the default is 'ETH/CAD'.

const socket = io({ transports: ['websocket'], upgrade: false }) // Thanks to https://stackoverflow.com/a/41953165

let data = {}
let qcxBook = 'ETH/CAD'
document.getElementById(qcxBook).checked = true

let ctx = document.getElementById('chart').getContext('2d')
const cryptoChart = new Chart(ctx, { // new instance of Chart from chart.j
  type: 'line',
  data: {
  },
  options: {
    title: {
      display: true,
      text: 'cryptoBoto Prices'
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        boxWidth: 0,
        fontColor: 'blue',
        fontSize: 20
      }
    },
    tooltips: {
      displayColors: true,
      callbacks: {
        label: function (tooltipItem) {
          return tooltipItem.yLabel
        }
      }
    },
    scales: {
      xAxes: [{
        type: 'time',
        distribution: 'linear',
        bounds: 'data',
        time: {
          unit: 'day',
          round: 'millisecond',
          tooltipFormat: 'll HH:mm'
        },
        scaleLabel: {
          display: true,
          labelString: 'Date'
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Price'
        }
      }]
    },
    animation: {
      duration: 0 // general animation time
    },
    hover: {
      animationDuration: 0 // duration of animations when hovering an item
    },
    responsive: true,
    maintainAspectRatio: false,
    responsiveAnimationDuration: 0 // animation duration after a resize
  }
})

socket.on('connectdata', async (socketData) => {
  if (socketData === null) { return }
  data = await transformData(socketData)
  // console.log('connect data length:', data.length, 'at', moment().toISOString(true))
  updateChart(data)
})

socket.on('data', async (socketData) => { // data received on interval set by database transaction inserts.
  if (socketData === null) { return }
  data = await transformData(socketData)
  console.log('update data length:', data.length, 'at', moment().toISOString(true))
  updateChart(data)
})

setTimeout(async function run () { // hack to update Legend's price age
  await updateChart(data)
  // console.log('price age updated at:', moment().toISOString(true))
  setTimeout(run, 60000)
}, 2000)

function transformData (socketData) { // for updateChart
  let data = socketData.map((d) => {
    let tid = parseInt(d.tid)
    let exchange = d.exchange
    let book = d.book
    let side = d.side
    let chartdate = d.api_date
    let price = parseFloat(d.price)
    let amount = parseFloat(d.amount)
    return { tid: tid, exchange: exchange, book: book, side: side, chartdate: chartdate, price: price, amount: amount }
  })
  return data
}

function updateChart (data) { // complete the Chart instance
  if (Object.keys(data).length === 0 && data.constructor === Object) { return }
  qcxBook = document.querySelector('input[name=currencyPairs]:checked').value
console.log('updateChart', data)
  let fromCurrency = qcxBook.split('/')[0]
  let inCurrency = qcxBook.split('/').pop().toUpperCase()
  let decimalPlaces = 0
  switch (inCurrency) {
    case 'CAD':
      decimalPlaces = 2
      break
    default:
      decimalPlaces = 8
  }
  let maxtid = data.filter(x => { return x.book === qcxBook }).map(x => x.tid).reduce((a, b) => { return Math.max(a, b) })
  let lastprice = data.filter(x => { return x.tid === maxtid }).map(x => x.price).toString()
  let lastamount = data.filter(x => { return x.tid === maxtid }).map(x => x.amount).toString()
  let lastside = data.filter(x => { return x.tid === maxtid }).map(x => x.side).toString()
  let lasttimestamp = data.filter(x => { return x.tid === maxtid }).map(x => x.chartdate).toString()
  let lastcolour = data.filter(x => { return x.tid === maxtid }).map(x => { return buysellColours(x.side) })
  cryptoChart.data = {
    labels: data.filter(x => { return x.book === qcxBook }).map(x => x.chartdate),
    datasets: [{
      data: data.filter(x => { return x.book === qcxBook }).map(x => x.price),
      label: 'The last ' + qcxBook + ' transaction was a ' + lastside.toUpperCase() + ' of ' + parseFloat(lastamount).toFixed(8) + ' ' + fromCurrency + ' at a unit price of ' + parseFloat(lastprice).toFixed(decimalPlaces) + ' ' + inCurrency + ', about ' + moment(lasttimestamp).fromNow(),
      showLine: false,
      pointStyle: 'crossRot',
      pointBackgroundColor: data.filter(x => { return x.book === qcxBook }).map(x => { return buysellColours(x.side) }),
      pointBorderColor: data.filter(x => { return x.book === qcxBook }).map(x => { return buysellColours(x.side) }),
      radius: 3
    }]
  }
  cryptoChart.options = {
    title: {
      display: true,
      text: 'CryptoBoto Prices'
    },
    legend: {
      display: true,
      position: 'top',
      labels: {
        boxWidth: 0,
        fontColor: lastcolour
      }
    },
    tooltips: {
      displayColors: true,
      callbacks: {
        label: function (tooltipItem) {
          return tooltipItem.yLabel
        }
      }
    },
    scales: {
      xAxes: [{
        type: 'time',
        distribution: 'linear',
        bounds: 'data',
        time: {
          unit: 'day',
          round: 'millisecond',
          tooltipFormat: 'll HH:mm'
        },
        scaleLabel: {
          display: true,
          labelString: 'Date'
        }
      }],
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Price'
        }
      }]
    },
    animation: {
      duration: 0 // general animation time
    },
    hover: {
      animationDuration: 0 // duration of animations when hovering an item
    },
    responsive: true,
    maintainAspectRatio: false,
    responsiveAnimationDuration: 0 // animation duration after a resize
  }
  cryptoChart.update()
}

function buysellColours (side) {
  switch (side) {
    case 'buy':
      return '#123524' // Phthalo green
      // eslint-disable-next-line no-unreachable
      break
    case 'sell':
      return '#E30022' // cadmium red
  }
}
