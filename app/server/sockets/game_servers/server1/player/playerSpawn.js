function playerSpawn(socket, map, client) {
  socket.on('spawn', function(position) {
    client.hget('server1', 'players', function(err, players) {
      const player = JSON.parse(players)[socket.id]
      // console.log(pla/yers)
      if (!player.spawned) {
        player.spawned = true
        player.x = position[0]
        player.y = position[1]

        map[player.x][player.y].tileInfo.playerBase = true

        socket.broadcast.emit('new player', position)
        client.hmset(
          'server1',
          'map',
          JSON.stringify(map),
          'players',
          JSON.stringify({ ...JSON.parse(players), [socket.id]: player }),
          function(err) {
            if (err) console.log('spawn error')
          }
        )
      }
    })
  })
}
module.exports = playerSpawn
