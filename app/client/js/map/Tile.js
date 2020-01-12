export class Tile {
  constructor(data, s) {
    // Tile position, color and size
    this.x = data.x
    this.y = data.y
    this.w = data.w
    this.color = data.color
    // Properties
    this.occupied = data.occupied
    this.terrain = data.terrain
    this.canDeploy = data.canDeploy
    this.tileInfo = data.tileInfo

    // p5 object
    this.fillColor = function(color) {
      s.fill(color)
    }
    this.drawRect = function(x, y, w) {
      s.rect(x, y, w, w)
    }

    this.showTroops = function() {
      s.textAlign(s.CENTER)
      s.fill('black')
      s.textSize(16)
      s.text(
        this.tileInfo.troops.count,
        this.x + this.w * 0.5,
        this.y + this.w - 13
      )
    }
  }
  initialize(colorToRender, playerColors) {
    const tileInfo = this.tileInfo

    if (tileInfo.playerBase) {
      // player base
      this.setColor(tileInfo.playerBase.color, playerColors)
    } else if (this.occupied.owner) {
      // claimed tile
      this.setColor(colorToRender, playerColors)
    } else if (tileInfo.troops) {
      if (tileInfo.troops.count > 0) {
        this.setColor(colorToRender, playerColors)
      }
      // troops
    } else if (tileInfo.building.camp) {
      // camp
      this.setColor(colorToRender, playerColors)
    } else if (tileInfo.building.village) {
      // village
      this.setColor(colorToRender, playerColors)
    }

    this.fillColor(this.color)
    this.drawRect(this.x, this.y, this.w, this.w)
    if (this.tileInfo.troops) {
      this.showTroops()
    }
  }
}
Tile.prototype.setColor = function(color, playerColors) {
  if (!color) {
    switch (this.terrain) {
      case 'water':
        this.color = this.occupied ? playerColors.land : 'blue'
        break
      case 'forest':
        this.color = this.occupied ? playerColors.land : '#26660f'
        break
      case 'mountain':
        this.color = this.occupied ? playerColors.land : '#ad4315'
        break
      case 'land':
        this.color = this.occupied ? playerColors.land : 'green'
        break
      default:
        return
    }
    return
  }
  this.color = color
}
Tile.prototype.isEmpty = function() {
  if (!this.occupied.owner && !this.tileInfo.playerBase) {
    return true
  }
}
Tile.prototype.isTileTaken = function() {
  if (this.occupied.owner || this.tileInfo.playerBase) {
    return true
  }
  return false
}
Tile.prototype.isTakenButEmpty = function(playerId) {
  const building = this.tileInfo.building
  if (
    this.occupied.owner === playerId &&
    !this.tileInfo.playerBase &&
    !building.camp &&
    !building.village &&
    !this.tileInfo.troops
  ) {
    return true
  }
  return false
}
Tile.prototype.isDestinationEmpty = function() {
  const destinationInfo = this.tileInfo
  const building = destinationInfo.building

  if (
    !this.occupied ||
    (this.occupied &&
      !destinationInfo.troops &&
      !building.village &&
      !building.camp)
  ) {
    return true
  }
  return false
}
