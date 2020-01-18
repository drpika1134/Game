const {
  updateDeployableRange,
  isTileTakenButEmpty,
  updateRedis,
  updateResource
} = require('../utils')
const MilitaryCamp = require('../building/MilitaryCamp')

function playerCamp(socket, client, mapProps) {
  socket.on('buildCamp', function({ x, y, w }) {
    client.hmget('server1', ['map', 'players'], function(err, redisData) {
      const posX = Math.floor(x / w)
      const posY = Math.floor(y / w)
      const map = JSON.parse(redisData[0])
      let tile = map[posX][posY]
      // Check if the camp is being placed on land
      if (isTileTakenButEmpty(tile, socket.id)) {
        // get the current player
        const playersList = JSON.parse(redisData[1])
        const player = playersList[socket.id]

        player.wood -= player.campCost
        player.stone -= player.campCost
        player.campCost += 100
        player.camp++

        const camp = new MilitaryCamp(socket.id, 'test')
        tile.tileInfo.building.camp = camp
        tile.occupied = {
          owner: socket.id
        }
        tile.color = player.color.camp

        const tilePos = { x: tile.x / tile.w, y: tile.y / tile.w }
        updateDeployableRange(tilePos, socket.id, {
          map,
          cols: mapProps.cols,
          rows: mapProps.rows
        })

        updateRedis(client, map, playersList)
        updateResource(player, socket)

        socket.broadcast.emit('camp', {
          posX,
          posY,
          camp: {
            name: camp.name
          },
          color: tile.color
        })
      }
    })
  })
}

module.exports = playerCamp
