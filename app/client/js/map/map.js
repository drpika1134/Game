import { Tile } from './Tile'
import { addListeners } from '../camera'

// Drawing the tiles and spawning the player?
export function drawTiles(map, s, x, y) {
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      let tile = map[i][j]
      let color = map[i][j].color

      map[i][j] = new Tile(tile, s)

      tile = map[i][j]
      tile.initialize(color)
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
