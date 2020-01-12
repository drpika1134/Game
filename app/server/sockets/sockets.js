const socketio = require('socket.io')
const server1_onConnect = require('./game_servers/server1/server1')

module.exports.startSockerServer = function(server, client) {
  io = socketio.listen(server)
  const server1 = io.of('/server1')

  server1.on('connection', socket => {
    server1_onConnect(io, socket, client)
  })
}
