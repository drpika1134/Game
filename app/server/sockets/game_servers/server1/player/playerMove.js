const { updateRedis, updateIncome } = require('../utils')

function playerMove(socket, client) {
  socket.on('moveTroop', function(destination, selectedUnit) {
    moveDelay(destination, selectedUnit, socket, client, io)
  })
}
function moveDelay(destination, selectedUnit, socket, client) {
  const _selectedUnit = Object.assign({}, selectedUnit)
  setTimeout(function() {
    client.hmget('server1', ['map', 'players'], function(err, data) {
      const _map = JSON.parse(data[0])
      const _players = JSON.parse(data[1])

      const currentPlayer = _players[socket.id]

      const destinationTile = _map[destination.x][destination.y]
      const destinationInfo = destinationTile.tileInfo
      const building = destinationInfo.building

      // The tile being moved (selected)
      const currentTile = _map[_selectedUnit.x][_selectedUnit.y]
      const currentTileInfo = currentTile.tileInfo
      // Check if the tile is occupied and if the player owns the troops
      if (
        canClaimTile(destinationTile, currentTileInfo, building, socket) &&
        isValidMove(destination, _selectedUnit)
      ) {
        updateSpawn(client, destination)

        destinationInfo.troops = currentTileInfo.troops
        currentTileInfo.troops = null

        if (destinationTile.occupied.owner !== socket.id) {
          destinationTile.occupied = {
            owner: socket.id
          }
          currentTile.occupied = {
            owner: socket.id
          }
          updateIncome(destinationTile, currentPlayer)
        }
        destinationTile.color = currentPlayer.color.troops
        currentTile.color = currentPlayer.color.land

        updateRedis(client, _map, _players)

        const current = {
          troops: destinationInfo.troops,
          x: _selectedUnit.x,
          y: _selectedUnit.y
        }
        const _destination = {
          x: destination.x,
          y: destination.y
        }
        socket.broadcast.emit('move', {
          current,
          _destination,
          id: socket.id,
          color: {
            land: currentTile.color,
            troops: destinationTile.color
          }
        })
      }
    })
  }, 500)
}
function updateSpawn(client, destination) {
  // New player cannot spawn on a claimed tile
  client.hget('server1', 'spawnPoints', function(err, _spawnPoints) {
    const spawnPoints = JSON.parse(_spawnPoints)
    for (let i = 0; i < spawnPoints.length; i++) {
      if (spawnPoints[i][0] !== destination.x) continue

      if (
        spawnPoints[i][0] == destination.x &&
        spawnPoints[i][1] == destination.y
      ) {
        spawnPoints.splice(i, 1)
        client.hset('server1', 'spawnPoints', JSON.stringify(spawnPoints))
        break
      }
    }
  })
}
// One army can only move to one tile away
function isValidMove(destination, _selectedUnit) {
  if (
    destination.x == _selectedUnit.x - 1 ||
    destination.x == _selectedUnit.x + 1 ||
    destination.y == _selectedUnit.y - 1 ||
    destination.y == _selectedUnit.y + 1
  ) {
    return true
  }
  return false
}
// Check if the army can occupy that tile
function canClaimTile(destinationTile, currentTileInfo, building, socket) {
  const destinationInfo = destinationTile.tileInfo

  // Check if the tile being moved has troops (fixed some weird bugs)
  if (!currentTileInfo.troops) {
    return false
  }
  if (currentTileInfo.troops.owner !== socket.id) {
    return false
  }

  if (
    !destinationTile.occupied ||
    (destinationTile.occupied &&
      !destinationInfo.troops &&
      !building.camp &&
      !building.village)
  ) {
    return true
  }
  return false
}
module.exports = playerMove
