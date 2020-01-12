const express = require('express')
const redis = require('redis')
// Redis
const REDIS_PORT = process.env.REDIS_PORT || 6379
const client = redis.createClient(REDIS_PORT)
client.on('connect', () => {
  console.log('Connected to Redis...')
})

// App
const app = express()
const server = app.listen(3000)
const path = require('path')

require('./sockets/sockets').startSockerServer(server, client)
app.use('/static', express.static(path.resolve(__dirname, '../client/dist')))

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/index.html'))
})
