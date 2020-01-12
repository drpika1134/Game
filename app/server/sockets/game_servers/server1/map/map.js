const { noise, noiseSeed } = require('./PerlinNoise')
const Tile = require('./Tile')
function make2DArray(cols, rows) {
  let array = new Array(cols)
  for (let i = 0; i < cols; i++) {
    array[i] = new Array(rows)
  }
  return array
}
function makeMap(mapProps) {
  let map = make2DArray(mapProps.cols, mapProps.rows)
  let possibleSpawnPoints = []
  noiseSeed(mapProps.seed)
  for (let i = 0; i < mapProps.rows; i++) {
    for (let x = 0; x < mapProps.cols; x++) {
      const r = noise(i * 0.3, x * 0.3)
      let color
      let terrain
      if (r <= 0.37) {
        terrain = 'water'
        color = 'blue'
      } else if (r <= 0.52 && r >= 0.47) {
        terrain = 'forest'
        color = '#26660f' // forests
      } else if (r <= 0.65) {
        terrain = 'land'
        color = 'green'
      } else if (r <= 0.97) {
        terrain = 'mountain'
        color = '#ad4315' // mountains
      }
      let tile = new Tile(
        i * mapProps.tileSize,
        x * mapProps.tileSize,
        mapProps.tileSize,
        color,
        terrain
      )
      map[i][x] = tile
      if (tile.terrain === 'land') {
        possibleSpawnPoints.push([tile.x / tile.w, tile.y / tile.w])
      }
    }
  }
  return [map, possibleSpawnPoints]
}
module.exports = makeMap
