const { isTileTakenButEmpty, updateRedis, updateResource } = require('../utils')

function playerVillage(socket, client) {
  socket.on('buildVillage', function(tilePos) {
    client.hmget('server1', ['map', 'players'], function(err, data) {
      const map = JSON.parse(data[0])
      const players = JSON.parse(data[1])

      const player = players[socket.id]

      const tile = map[tilePos.x][tilePos.y]

      if (isTileTakenButEmpty(tile, socket.id)) {
        tile.tileInfo.building.village = { owner: socket.id }
        tile.occupied = {
          owner: socket.id
        }
        player.village++

        player.wood -= 100
        player.stone -= 100
        player.gold -= 100

        tile.color = player.color.village

        updateRedis(client, map, players)
        updateResource(player, socket)

        socket.broadcast.emit('village', {
          tilePos,
          name: player.name,
          color: tile.color
        })
      }
    })
  })
}

module.exports = playerVillage
