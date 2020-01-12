class Tile {
  constructor(x, y, w, color, t) {
    // Tile position, color and size
    this.x = x
    this.y = y
    this.w = w
    this.color = color
    this.terrain = t
    this.canDeploy = {}
    this.occupied = false
    this.tileInfo = {
      playerBase: false,
      troops: null,
      building: {
        village: null,
        camp: null
      }
    }
  }
}
module.exports = Tile
