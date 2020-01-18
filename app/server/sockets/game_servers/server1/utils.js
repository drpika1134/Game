// MAP
function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //The maximum is exclusive and the minimum is inclusive
}
function getSpawnCoordinates(possibleSpawnPoints) {
  let random = getRandomInt(5, possibleSpawnPoints.length / 4)
  return {
    coordinates: possibleSpawnPoints[random],
    positionInArray: random
  }
}
function updateDeployableRange(tile, id, { map, cols, rows }) {
  for (let i = tile.x - 4; i <= tile.x + 4; i++) {
    for (let y = tile.y - 4; y <= tile.y + 4; y++) {
      if (i >= 0 && i <= rows && y >= 0 && y < cols) {
        let currentTile = map[i][y]
        if (currentTile.tileInfo.playerBase || currentTile.canDeploy[id]) {
          continue
        }

        currentTile.canDeploy = { ...currentTile.canDeploy, [id]: true }
      }
    }
  }
  return map
}
function updateDeployableRangeClient(tile, id, { map, cols, rows }) {
  for (let i = tile.x - 4; i <= tile.x + 4; i++) {
    for (let y = tile.y - 4; y <= tile.y + 4; y++) {
      if (i >= 0 && i <= rows && y >= 0 && y < cols) {
        let currentTile = map[i][y]
        let canDeploy = Object.keys(currentTile.canDeploy).length
        if (currentTile.canDeploy[id]) {
          currentTile.canDeploy = { [id]: true }
          continue
        }

        if (currentTile.tileInfo.playerBase || canDeploy === 0) {
          continue
        }

        currentTile.canDeploy = {}
      }
    }
  }
  return map
}
// PLAYERS FUNCTIONS

// Check if it is the player's tile (land) but has nothing on it
function isTileTakenButEmpty(tile, playerId) {
  const building = tile.tileInfo.building
  if (
    tile.occupied.owner === playerId &&
    !tile.tileInfo.playerBase &&
    !building.camp &&
    !building.village &&
    !tile.tileInfo.troops
  ) {
    return true
  }
  return false
}
function updateRedis(client, map, players) {
  client.hmset(
    'server1',
    'map',
    JSON.stringify(map),
    'players',
    JSON.stringify(players)
  )
}
function updateResource(player, socket) {
  const newResources = {
    wood: player.wood,
    stone: player.stone,
    gold: player.civilian,
    civilian: player.civilian
  }
  socket.emit('resource', newResources)
}
function updateIncome(tile, player) {
  switch (tile.terrain) {
    case 'forest':
      player.claimedTile.wood++
      break
    case 'mountain':
      player.claimedTile.stone++
      break
    case 'land':
      player.claimedTile.land++
      break
    default:
      break
  }
}

module.exports = {
  getRandomInt,
  getSpawnCoordinates,
  updateDeployableRange,
  updateDeployableRangeClient,
  isTileTakenButEmpty,
  updateRedis,
  updateResource,
  updateIncome
}
