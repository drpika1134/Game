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
  getSpawnLocation,
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
    var clientIp = socket.conn.remoteAddress

    console.log('test', clientIp)
    try {
      const player = new Player(socket.id, null, null, null, color)
      let randomLocation

      // Check if there is a game going on
      if (!data) {
        console.time('server init')
        mapProps.seed = getRandomInt(1, 1000)
        let mapInit = makeMap(mapProps)

        map = mapInit[0]
        possibleSpawnPoints = mapInit[1]
        // getSpawnLocation will return random x and y coords
        // and the location of the el in array to remove
        randomLocation = getSpawnLocation(possibleSpawnPoints)
        const location = randomLocation.location

        setSpawn(map, location, player, socket.id)

        // Removing the coordinates because player is spawned there
        possibleSpawnPoints.splice(randomLocation.positionInArray, 1)
        // Updating troops deploy range
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
            } else {
              console.log('server init error')
            }
          }
        )
        console.timeEnd('server init')
      } else {
        map = JSON.parse(data.map)

        const spawnPoints = JSON.parse(data.spawnPoints)
        randomLocation = getSpawnLocation(spawnPoints)
        const location = randomLocation.location

        setSpawn(map, location, player, socket.id)
        spawnPoints.splice(randomLocation.positionInArray, 1)

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
          JSON.stringify(spawnPoints),
          'players',
          JSON.stringify({
            [socket.id]: player,
            ...JSON.parse(data.players)
          })
        )
      }
      const newPlayerPos = { x: player.x, y: player.y }
      const playerProps = {
        ...newPlayerPos,
        wood: player.wood,
        stone: player.stone,
        gold: player.gold,
        civilian: player.civilian
      }
      socket.broadcast.emit('new player', {
        newPlayerPos,
        color,
        id: socket.id
      })
      socket.emit('init', {
        id: player.id,
        colors: player.color,
        playerProps,
        map,
        mapProps
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

function setSpawn(map, location, player, id) {
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
module.exports = onConnect
