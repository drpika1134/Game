class Player {
  constructor(id, name, x, y, color) {
    this.id = id
    this.name = name
    this.x = x
    this.y = y
    //personal resources
    this.wood = 1000
    this.stone = 1000
    this.gold = 1000
    this.civilian = 1000

    // Other properies
    this.claimedTile = {
      land: 0,
      wood: 0,
      stone: 0
    }

    this.campCost = 100
    this.camp = 0

    this.village = 0

    this.troopsDeployed = 0
    this.deployMax = 100

    this.color = {
      base: color[0],
      troops: color[1],
      land: color[2],
      village: color[3],
      camp: color[4]
    }
  }
}
module.exports = Player
