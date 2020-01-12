export function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min //The maximum is exclusive and the minimum is inclusive
}

export function getTile({ x, y }, { cols, rows, tileWidth, map }) {
  const xPosInArray = Math.floor(x / tileWidth)
  const yPosInArray = Math.floor(y / tileWidth)
  if (
    xPosInArray > cols ||
    xPosInArray < 0 ||
    yPosInArray > rows ||
    yPosInArray < 0
  ) {
    return false
  }
  return map[xPosInArray][yPosInArray]
}

export function updateDeployableRange(id, tile, map, cols, rows) {
  for (let i = tile.x - 4; i <= tile.x + 4; i++) {
    for (let y = tile.y - 4; y <= tile.y + 4; y++) {
      if (i >= 0 && i <= rows && y >= 0 && y < cols) {
        map[i][y].canDeploy = { [id]: true }
      }
    }
  }
}
export function isValidMove(destination, _selectedUnit) {
  if (
    destination.x / destination.w == _selectedUnit.x - 1 ||
    destination.x / destination.w == _selectedUnit.x + 1 ||
    destination.y / destination.w == _selectedUnit.y - 1 ||
    destination.y / destination.w == _selectedUnit.y + 1
  ) {
    return true
  }
  return false
}
// Check if the army can occupy that tile
export function canClaimTile(destinationTile, currentTileInfo, building, id) {
  const destinationInfo = destinationTile.tileInfo

  // Check if the tile being moved has troops (fixed some weird bugs)
  if (!currentTileInfo.troops) {
    return false
  }
  if (currentTileInfo.troops.owner !== id) {
    return false
  }
  if (
    !destinationTile.occupied ||
    (destinationTile.occupied &&
      !destinationInfo.troops &&
      !building.camp &&
      !building.village)
  ) {
    console.log('pass', destinationInfo.troops)
    return true
  }
  return false
}
// DOM
export function findDOM(DOM) {
  // MILITARY
  DOM.military.deployTroopPanel = document.getElementById('deployTroopPanel')
  DOM.military.deployTroopAmount = document.getElementById('deployTroopAmount')
  DOM.military.deployTroopButton = document.getElementById('deployButton')

  // PLAYER INFO
  DOM.player.resourcePanel = document.getElementById('resourcePanel')
  DOM.player.wood = document.getElementById('wood')
  DOM.player.stone = document.getElementById('stone')
  DOM.player.gold = document.getElementById('gold')
  DOM.player.civilian = document.getElementById('civilian')
}
export function refreshResource(DOM, newResource) {
  DOM.player.civilian.textContent = newResource.civilian
  DOM.player.wood.textContent = newResource.wood
  DOM.player.stone.textContent = newResource.stone
  DOM.player.gold.textContent = newResource.gold
}
