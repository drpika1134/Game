import { drawTiles } from './map/map.js'
import {
  getTile,
  updateDeployableRange,
  findDOM,
  refreshResource,
  isValidMove,
  canClaimTile
} from './utils'
import { MiltiaryCamp } from './building/MilitaryCamp'
import { defaultCamera } from './camera'
// Map properties
let map
let cols
let rows
let tileWidth
let origin = {}

let DOM = {
  military: {
    deployTroopPanel: null,
    deployTroopAmount: null,
    deployTroopButton: null
  },
  player: {
    resourcePanel: null,
    wood: null,
    stone: null,
    gold: null,
    civilian: null
  }
}

// Player
let player
const DELAY = {
  land: 500,
  mountain: 2000,
  forest: 700,
  water: 1500
}
// Variable to holds selected troops to move
let selectedUnit = null
let userPressed = false

let socket
const game = new p5(function(s) {
  s.setup = () => {
    socket = io('ws://localhost:3000/server1')
    findDOM(DOM)
    sockets(s)
    s.noLoop()
  }
  s.draw = () => {
    s.background('gray')
  }
  s.mouseReleased = e => {
    // Deploy troops and select troops to move
    if (e.button === 0 && e.target.tagName === 'CANVAS') {
      const mouse = { x: s.mouseX, y: s.mouseY }
      const mouseMap = { cols, rows, tileWidth, map }
      const tile = getTile(mouse, mouseMap)
      const tileInfo = tile.tileInfo

      console.log(tile)
      if (tileInfo.troops && tileInfo.troops.owner === socket.id) {
        if (tile.isTileTaken()) {
          const tilePosX = tile.x / tile.w
          const tilePosY = tile.y / tile.w
          if (selectedUnit !== null) {
            // Check if the previously selected troop is not the same troops being selected now
            if (
              selectedUnit.troops !== tileInfo.troops &&
              selectedUnit.x !== tilePosX &&
              selectedUnit.x !== tilePosY
            ) {
              userPressed = false
            }
          }
          selectedUnit = {
            x: tilePosX,
            y: tilePosY,
            troops: tileInfo.troops
          }
          return
        }
      }

      if (
        tile.canDeploy[socket.id] &&
        (tile.isEmpty() || tile.isTakenButEmpty(socket.id))
      ) {
        selectedUnit = null
        deployTroop(tile)
      }
    }
    // Build camps
    if (e.button === 2 && e.target.tagName === 'CANVAS') {
      const mouse = { x: s.mouseX, y: s.mouseY }
      const mouseMap = { cols, rows, tileWidth, map }
      const tile = getTile(mouse, mouseMap)
      if (tile.isTakenButEmpty(socket.id)) {
        militaryCamp(tile)
      }
    }
    // Village
    if (e.button === 1 && e.target.tagName === 'CANVAS') {
      const mouse = { x: s.mouseX, y: s.mouseY }
      const mouseMap = { cols, rows, tileWidth, map }
      const tile = getTile(mouse, mouseMap)

      if (tile.isTakenButEmpty(socket.id)) {
        buildVillage(tile)
      }
    }
  }
  s.keyPressed = function() {
    const key = s.keyCode
    if (selectedUnit !== null && userPressed === false) {
      // UP ARROW
      if (key === 38) {
        userPressed = true
        moveTroop('UP')
      }
      // DOWN ARROW
      if (key === 40) {
        userPressed = true
        moveTroop('DOWN')
      }
      // LEFT ARROW
      if (key === 37) {
        userPressed = true
        moveTroop('LEFT')
      }
      // RIGHT
      if (key === 39) {
        userPressed = true
        moveTroop('RIGHT')
      }
    }
    if (key === 72) {
      defaultCamera(origin.x, origin.y)
    }
  }
}, 'inner')

function sockets(s) {
  // server data
  socket.on('init', function(data) {
    console.log('server data arrives', data)
    const playerProps = data.playerProps
    player = {
      id: data.id,
      colors: data.colors,
      name: null,
      troopsDeployed: playerProps.troopsDeployed,
      deployMax: playerProps.deployMax
    }
    map = data.map

    const mapProps = data.mapProps

    cols = mapProps.cols
    rows = mapProps.rows
    tileWidth = mapProps.tileSize
    s.createCanvas(rows * tileWidth, cols * tileWidth)

    origin = drawTiles(map, s, playerProps.x, playerProps.y)
    refreshResource(DOM, playerProps)
  })
  // new player spawns
  socket.on('new player', function(data) {
    const tile = map[data.newPlayerPos.x][data.newPlayerPos.y]
    tile.tileInfo.playerBase = {
      color: data.color[0]
    }
    tile.occupied = {
      owner: data.name
    }
    tile.initialize(data.color[0])
    return false
  })
  // enemies deploy troops
  socket.on('deploy', function({ posX, posY, troops, color }) {
    console.log('enemy deploy', color)
    let tile = map[posX][posY]
    tile.tileInfo.troops = troops
    tile.occupied = {
      owner: troops.owner
    }
    tile.initialize(color)
    return false
  })
  socket.on('warProgress', function({
    attacker,
    defender,
    defenderCount,
    defenderColor,
    attackerCount,
    attackerColor
  }) {
    let attackerTile = map[attacker.x][attacker.y]
    let defenderTile = map[defender.x][defender.y]

    let attackerTroops = attackerTile.tileInfo.troops
    let defenderTroops = defenderTile.tileInfo.troops

    if (attackerTroops && defenderTroops) {
      attackerTroops.count = attackerCount
      defenderTroops.count = defenderCount

      defenderTile.initialize(defenderTile.color)
      attackerTile.initialize(attackerTile.color)
    }

    // Make troops disappear if count is 0
    if (
      attackerCount <= 0 ||
      (!attackerTroops && attackerTile.occupied.owner === socket.id)
    ) {
      attackerTile.tileInfo.troops = null
      attackerTile.initialize(null, attackerColor)
    }
    if (defenderCount <= 0 || !defenderTroops) {
      defenderTile.tileInfo.troops = null
      defenderTile.initialize(null, defenderColor)
    }
  })
  // enemies build camp
  socket.on('camp', function({ posX, posY, camp, color }) {
    let tile = map[posX][posY]
    tile.tileInfo.building.camp = camp
    tile.occupied = {
      owner: camp.name
    }
    tile.initialize(color)
    return false
  })
  // enemies build village
  socket.on('village', function({ tilePos, name, color }) {
    const tile = map[tilePos.x][tilePos.y]
    tile.tileInfo.building.village = { owner: name }
    tile.initialize(color)
    return false
  })
  // enemies move troop
  socket.on('move', function({ current, _destination, name, color }) {
    const currentTile = map[current.x][current.y]
    currentTile.tileInfo.troops = null

    const destinationTile = map[_destination.x][_destination.y]
    destinationTile.tileInfo.troops = current.troops

    destinationTile.occupied = {
      owner: name
    }
    currentTile.occupied = {
      owner: name
    }
    currentTile.initialize(color.land)
    destinationTile.initialize(color.troops)
  })
  // resources
  socket.on('resource', function(resource) {
    refreshResource(DOM, resource)
  })
  // end game
  socket.on('end', function() {
    console.log('match end')
  })
}

// MILITARY OPERATIONS
function moveDelay(destination, selectedUnit) {
  const _selectedUnit = Object.assign({}, selectedUnit)
  selectedUnit.x = null
  selectedUnit.y = null
  selectedUnit.troops = null

  setTimeout(function() {
    const currentTile = map[_selectedUnit.x][_selectedUnit.y]

    if (
      canClaimTile(
        destination,
        currentTile.tileInfo,
        destination.tileInfo.building,
        socket.id
      ) &&
      isValidMove(destination, _selectedUnit)
    ) {
      destination.tileInfo.troops = _selectedUnit.troops
      currentTile.tileInfo.troops = null

      destination.occupied = {
        owner: socket.id
      }
      currentTile.occupied = {
        owner: socket.id
      }
      selectedUnit.x = destination.x / destination.w
      selectedUnit.y = destination.y / destination.w

      selectedUnit.troops = destination.tileInfo.troops
      currentTile.initialize(player.colors.land)

      destination.initialize(player.colors.troops)
      userPressed = false
    } else {
      userPressed = false
    }
  }, DELAY[destination.terrain])
}
function moveTroop(dir) {
  let directionY
  let directionX
  if (!selectedUnit.x && !selectedUnit.y && !selectedUnit.troops) {
    userPressed = false
    return
  }
  switch (dir) {
    case 'UP':
      if (selectedUnit.y - 1 >= 0) {
        directionY = selectedUnit.y - 1
        directionX = selectedUnit.x
        break
      }
      userPressed = false
      return
    case 'DOWN':
      if (selectedUnit.y + 1 <= cols) {
        directionY = selectedUnit.y + 1
        directionX = selectedUnit.x
        break
      }
      userPressed = false
      return
    case 'LEFT':
      if (selectedUnit.x - 1 >= 0) {
        directionY = selectedUnit.y
        directionX = selectedUnit.x - 1
        break
      }
      userPressed = false
      return
    case 'RIGHT':
      if (selectedUnit.x + 1 <= rows) {
        directionY = selectedUnit.y
        directionX = selectedUnit.x + 1
        break
      }
      userPressed = false
      return
    default:
      return
  }
  const destination = map[directionX][directionY]
  const destinationInfo = destination.tileInfo
  const destinationTroops = destinationInfo.troops
  if (!destinationInfo.playerBase) {
    // Check if the army belongs to a different player
    if (destinationTroops) {
      // Battle
      if (destinationTroops.owner !== socket.id) {
        console.log(destinationTroops)
        const playerTroops = {
          x: selectedUnit.x,
          y: selectedUnit.y
        }
        const enemyTroops = {
          x: directionX,
          y: directionY
        }
        socket.emit('battle', { player: playerTroops, enemy: enemyTroops })
        userPressed = false
        return
      }
    }
    // Check if the tile is not occupied
    // or if the tile is occupied but is empty
    if (destination.isDestinationEmpty()) {
      const destinationPos = {
        x: directionX,
        y: directionY,
        terrain: destination.terrain
      }
      const selectedPos = {
        x: selectedUnit.x,
        y: selectedUnit.y
      }
      socket.emit('moveTroop', destinationPos, selectedPos)
      moveDelay(destination, selectedUnit)
      return
    }
    userPressed = false
  } else {
    userPressed = false
  }
}
function deployTroop(tile) {
  const troops = { owner: socket.id, type: 'INFANTRY', count: 30 }
  if (player.troopsDeployed + troops.count >= player.deployMax) {
    return
  }

  player.troopsDeployed += troops.count

  tile.tileInfo.troops = troops
  tile.occupied = { owner: socket.id }
  tile.initialize(player.colors.troops)

  socket.emit('deployTroop', { x: tile.x, y: tile.y, w: tile.w, troops })
}
// BUILDING
function militaryCamp(tile) {
  tile.tileInfo.building.camp = new MiltiaryCamp(player.id)
  tile.occupied = {
    owner: socket.id
  }
  tile.initialize(player.colors.camp)
  updateDeployableRange(
    player.id,
    { x: tile.x / tile.w, y: tile.y / tile.w },
    map,
    cols,
    rows
  )

  socket.emit('buildCamp', { x: tile.x, y: tile.y, w: tile.w })
}
function buildVillage(tile) {
  tile.tileInfo.building.village = { owner: socket.id }
  tile.occupied = {
    owner: socket.id
  }
  tile.initialize(player.colors.village)

  const tilePos = { x: tile.x / tile.w, y: tile.y / tile.w }
  socket.emit('buildVillage', tilePos)
}
