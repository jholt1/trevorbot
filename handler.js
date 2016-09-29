'use strict';

var http = require('http')
var https = require('https')

var makeRequest = (protocol, host, path, callback) => {
  var req = protocol.get({ host, path }, (res) => {
    let body = ''

    res.on('data', (d) => {
      if (connectTimeout) { clearTimeout(connectTimeout) }
      body += d
    })
    res.on('end', () => {
      try {
        callback(null, JSON.parse(body))
      } catch (e) {
        callback('json parse error')
      }
    })
  })

  req.on('socket', (socket) => {
    socket.setTimeout(5000)
    socket.on('timeout', () => {
      // console.log('socket timeout');
      req.abort()
    })
  })

  const connectTimeout = setTimeout(() => {
    // console.log('connect timeout')
    req.abort()
  }, 5000)

  req.on('error', callback)

  req.end()
}

var sanitizeChars = (s) => { return s.replace(/[^ a-zA-Z]/g, '?') }

// Your first function handler
module.exports.trevorbot = (event, context, cb) => {
  var text = event.body.text.toLowerCase()
  console.log(text)
  if (text.indexOf('where') > -1) {
    if (text.replace('trevorbot', '').indexOf('trevor') > -1 ||
      event.body.user_name.toLowerCase().indexOf('trevor') > -1 && text.indexOf(' i') > -1) {
      makeRequest(https, 'nomadlist.com', '/trevorgerhardt.json', (err, data) => {
        if (err) { return cb(null, { text: 'I couldn\'t figure that out right now :astonished:' }) }
        var city = sanitizeChars(data.location.now.city)
        var country = sanitizeChars(data.location.now.country)
        cb(null, { text: `Trevor is in ${city}, ${country} (https://nomadlist.com/trevorgerhardt)` })
      })
    } else {
      cb(null, { text: 'I only know where Trevor is.' })
    }
  } else if (text.indexOf('chuck norris') > -1) {
    makeRequest(http, 'api.icndb.com', '/jokes/random', (err, data) => {
      if (err) { return cb(null, { text: 'I don\'t feel like doing that right now :pensive:' }) }
      cb(null, { text: data.value.joke })
    })
  } else {
    cb(null, { text: 'I don\'t understand, I\'m afraid :thinking_face:' })
  }
}
