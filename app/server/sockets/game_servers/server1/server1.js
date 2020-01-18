const randomColor = require('randomcolor')

const makeMap = require('./map/map')

const Player = require('./player/Player')
const playerDeployTroop = require('./player/playerDeploy')
const playerCamp = require('./player/playerCamp')
const playerVillage = require('./player/playerVillage')
const playerMove = require('./player/playerMove')

const battle = require('./battle')

const {
  getRandomInt,
  getSpawnCoordinates,
  updateDeployableRange
} = require('./utils')

let mapProps = {
  cols: 40,
  rows: 40,
  tileSize: 40,
  seed: 1
}
let setResourceInterval = false
let interval
let color
function onConnect(io, socket, client) {
  console.log('a user has connected!')
  if (!setResourceInterval) {
    resourceInterval(io, client)
    setResourceInterval = true

    // Clear interval after match ends
    setTimeout(() => {
      clearInterval(interval)
      setResourceInterval = false
    }, 100000)
  }
  // base, troops, land, village, camp
  color = randomColor({
    count: 5
  })
  // Retrieve data from server1 on redis
  client.hgetall('server1', function(err, data) {
    let map
    let possibleSpawnPoints
    let playersList
    let randomLocation

    try {
      console.time('server init')
      const player = new Player(socket.id, 'test', null, null, color)
      const playerProps = {
        wood: player.wood,
        stone: player.stone,
        gold: player.gold,
        civilian: player.civilian
      }
      // Check if there is a game going on
      if (!data) {
        mapProps.seed = getRandomInt(1, 1000)
        let [grid, spawnPoints] = makeMap(mapProps)

        map = grid
        possibleSpawnPoints = spawnPoints

        randomLocation = getSpawnCoordinates(possibleSpawnPoints)
        const location = randomLocation.coordinates

        playerSpawn(map, location, player, socket.id)
        playerProps.x = player.x
        playerProps.y = player.y

        possibleSpawnPoints.splice(randomLocation.positionInArray, 1)

        updateDeployableRange({ x: location[0], y: location[1] }, socket.id, {
          map,
          cols: mapProps.cols,
          rows: mapProps.rows
        })
        client.hmset(
          'server1',
          'map',
          JSON.stringify(map),
          'spawnPoints',
          JSON.stringify(possibleSpawnPoints),
          'players',
          JSON.stringify({ [socket.id]: player }),
          function(err) {
            if (!err) {
              client.expire('server1', 120)
              socket.emit('init', {
                id: player.id,
                colors: player.color,
                playerProps,
                map,
                mapProps
              })
            } else {
              console.log('server init error')
            }
          }
        )
      } else {
        map = JSON.parse(data.map)
        possibleSpawnPoints = JSON.parse(data.spawnPoints)
        playersList = JSON.parse(data.players)

        randomLocation = getSpawnCoordinates(possibleSpawnPoints)
        const location = randomLocation.coordinates

        playerSpawn(map, location, player, socket.id)
        playerProps.x = player.x
        playerProps.y = player.y

        possibleSpawnPoints.splice(randomLocation.positionInArray, 1)

        updateDeployableRange({ x: location[0], y: location[1] }, socket.id, {
          map,
          cols: mapProps.cols,
          rows: mapProps.rows
        })
        client.hmset(
          'server1',
          'map',
          JSON.stringify(map),
          'spawnPoints',
          JSON.stringify(possibleSpawnPoints),
          'players',
          JSON.stringify({
            [socket.id]: player,
            ...playersList
          }),
          function() {
            if (data.players) {
              removePlayerIds(playersList, map)
              removeAllEnemyId(playersList, map, socket.id)
              socket.emit('init', {
                id: player.id,
                colors: player.color,
                playerProps,
                map,
                mapProps
              })
            }
          }
        )
      }
      const newPlayerPos = { x: player.x, y: player.y }

      console.timeEnd('server init')

      socket.broadcast.emit('new player', {
        newPlayerPos,
        color,
        name: 'test'
      })

      playerCamp(socket, client, mapProps)
      playerVillage(socket, client)

      playerDeployTroop(socket, client)
      playerMove(socket, client)

      battle(io, socket, client)
    } catch (error) {
      console.log(error)
      return
    }
  })
}

function playerSpawn(map, location, player, id) {
  let tile = map[location[0]][location[1]]
  // Spawning the player at the spot
  tile.tileInfo.playerBase = {
    id,
    color: color[0]
  }
  tile.occupied = {
    owner: id
  }
  player.x = location[0]
  player.y = location[1]
}
function resourceInterval(io, client) {
  interval = setInterval(() => {
    client.hget('server1', 'players', function(err, players) {
      if (players !== null) {
        const _players = JSON.parse(players)

        Object.keys(_players).forEach(key => {
          const player = _players[key]
          player.wood += player.claimedTile.wood
          player.stone += player.claimedTile.stone
          player.gold += player.claimedTile.land
          player.civilian += player.village
          const newResources = {
            wood: player.wood,
            stone: player.stone,
            gold: player.gold,
            civilian: player.civilian
          }
          client.hset('server1', 'players', JSON.stringify(_players))
          io.of('/server1')
            .to(`${key}`)
            .emit('resource', newResources)
        })
      }
    })
  }, 1000)
}
function removePlayerIds(playersList, map) {
  Object.keys(playersList).forEach(function(id) {
    let playerTile = map[playersList[id].x][playersList[id].y]
    let playerTileInfo = playerTile.tileInfo
    playerTileInfo.playerBase = {
      color: playerTileInfo.playerBase.color
    }
    playerTile.occupied = {
      owner: 'test'
    }
  })
}
function removeAllEnemyId(players, map, id) {
  // for (let i = 0; i < map.length; i++) {
  //   for (let y = 0; y < map[i].length; y++) {
  //     let tile = map[i][y]
  //     let troops = tile.tileInfo.troops
  //     let camp = tile.tileInfo.building.camp
  //     let village = tile.tileInfo.building.village
  //     let occupied = tile.occupied
  //     if (troops) {
  //       if (troops.owner !== id) {
  //         tile.tileInfo.troops.owner = players[troops.owner].name
  //       }
  //     }
  //     // if (camp) {
  //     //   if (players[camp.owner]) {
  //     //     camp.owner = players[camp.owner].name
  //     //   }
  //     // }
  //     // if (village) {
  //     //   if (players[village.owner]) {
  //     //     village.owner = players[village.owner].name
  //     //   }
  //     // }
  //     if (occupied) {
  //       if (players[occupied.owner]) {
  //         occupied.owner = players[occupied.owner].name
  //       }
  //     }
  //     // if (!tile.canDeploy[socket.id]) {
  //     //   tile.canDeploy = {}
  //     //   // console.log('tile can deploy', tile)
  //     //   // tile.canDeploy = { [socket.id]: true }
  //     //   continue
  //     // }
  //     // let canDeploy = Object.keys(tile.canDeploy).length
  //     // if (tile.tileInfo.playerBase || canDeploy === 0) {
  //     //   continue
  //     // }
  //   }
  // }
}

module.exports = onConnect
