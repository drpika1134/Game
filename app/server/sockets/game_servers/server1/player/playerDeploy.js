const {
  updateRedis,
  updateResource,
  isTileTakenButEmpty,
  updateIncome
} = require('../utils')

function playerDeploy(socket, client) {
  socket.on('deployTroop', function({ x, y, w, troops }) {
    client.hmget('server1', ['map', 'players'], function(err, redisData) {
      const posX = Math.floor(x / w)
      const posY = Math.floor(y / w)
      const map = JSON.parse(redisData[0])

      let tile = map[posX][posY]
      let tileInfo = tile.tileInfo
      // Check if the player can deploy troop at the tile
      if (
        isTileEmptyAndInRange(tile, socket.id) ||
        isTileTakenButEmpty(tile, socket.id)
      ) {
        const playersList = JSON.parse(redisData[1])
        const player = playersList[socket.id]

        // TODO: Check if the player has enough resources

        player.wood -= 100
        player.stone -= 100

        tileInfo.troops = troops

        // Check for terrain type
        if (!tile.occupied) {
          updateIncome(tile, player)
        }
        tile.occupied = {
          owner: socket.id
        }
        tile.color = player.color.troops

        updateRedis(client, map, playersList)
        updateResource(player, socket)

        socket.broadcast.emit('deploy', {
          posX,
          posY,
          troops,
          color: tile.color
        })
      }
    })
  })
}

function isTileEmptyAndInRange(tile, id) {
  if (tile.canDeploy[id] && !tile.tileInfo.playerBase && !tile.occupied) {
    return true
  }
  return false
}
module.exports = playerDeploy
