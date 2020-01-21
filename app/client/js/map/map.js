import { Tile } from './Tile'
import { addListeners } from '../camera'
export function make2DArray(cols, rows) {
  let array = new Array(cols)
  for (let i = 0; i < cols; i++) {
    array[i] = new Array(rows)
  }
  return array
}
// Drawing the tiles and spawning the player?
export function drawTiles(map, tiles, cols, rows, x, y, s) {
  let temp = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let tile = tiles[temp]
      if (tile !== undefined) {
        let tileX = tile.x / tile.w
        let tileY = tile.y / tile.w
        map[tileX][tileY] = new Tile(tile, s)
        if (tile.tileInfo.playerBase) {
          map[tileX][tileY].initialize(tile.tileInfo.playerBase.color)
        } else {
          map[tileX][tileY].initialize(tile.color)
        }
        temp++
      }
      if (map[i][j] === undefined) {
        s.fill('gray')
        s.strokeWeight(2)
        s.stroke('black')
        s.rect(i * 40, j * 40, 40, 40)
      }
    }
  }

  let player = {
    x: map[x][y].x,
    y: map[x][y].y
  }
  addListeners(player.x, player.y)
  return player
}
// Spawn the player in a random location
export function spawn(map, randomLocation, socket, player) {
  const tile = map[randomLocation[0]][randomLocation[1]]
  tile.tileInfo.playerBase = {
    name: 'test',
    id: socket.id
  }
  tile.initialize()

  player.name = 'test'

  addListeners(tile.x, tile.y)
  socket.emit('spawn', randomLocation)
}
