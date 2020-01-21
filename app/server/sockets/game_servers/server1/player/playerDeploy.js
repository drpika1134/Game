const {
  updateRedis,
  updateResource,
  isTileTakenButEmpty,
  updateIncome
} = require('../utils')

function playerDeploy(io, socket, client) {
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

        if (player.troopsDeployed + troops.count >= player.deployMax) {
          return
        }
        // TODO: Check if the player has enough resources

        player.wood -= 100
        player.stone -= 100
        player.troopsDeployed += troops.count

        tileInfo.troops = troops

        // Check for terrain type
        if (!tile.occupied) {
          updateIncome(tile, player)
        }
        tile.occupied = {
          owner: socket.id
        }
        tile.color = player.color.troops
        updateResource(player, socket)
        const newVisibileTiles = []
        for (let i = posX - 2; i <= posX + 2; i++) {
          for (let y = posY - 2; y <= posY + 2; y++) {
            if (i >= 0 && i <= map.length && y >= 0 && y < map[0].length) {
              let tile = map[i][y]
              if (tile.visibility[socket.id]) continue

              tile.visibility = { ...tile.visibility, [socket.id]: true }
              newVisibileTiles.push(tile)
            }
          }
        }
        updateRedis(client, map, playersList)

        Object.keys(tile.visibility).forEach(function(id) {
          if (id !== socket.id) {
            io.of('server1')
              .to(`${id}`)
              .emit('deploy', {
                posX,
                posY,
                troops: {
                  owner: player.name,
                  type: 'INFANTRY',
                  count: troops.count
                },
                color: tile.color
              })
          } else {
            socket.emit('new tiles', newVisibileTiles)
          }
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
