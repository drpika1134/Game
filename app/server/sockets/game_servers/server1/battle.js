const { updateRedis, updateIncome, getRandomInt } = require('./utils')

function battle(io, socket, client) {
  socket.on('battle', function({ player, enemy }) {
    client.hmget('server1', ['map', 'players'], function(err, data) {
      const map = JSON.parse(data[0])
      const players = JSON.parse(data[1])

      const attackerTroopsTile = map[player.x][player.y]
      const defenderTroopsTile = map[enemy.x][enemy.y]

      const attackerTroops = attackerTroopsTile.tileInfo.troops
      const defenderTroops = defenderTroopsTile.tileInfo.troops

      const _enemyColors = players[defenderTroops.owner].color
      const _playerColors = players[socket.id].color

      if (
        checkValidTroops(attackerTroops, defenderTroops, socket.id) &&
        checkValidPosition(player, enemy)
      ) {
        // duke it out bois
        battleInterval(player, enemy, _enemyColors, _playerColors, io, client)
      }
    })
  })
}
function battleInterval(
  attacker,
  defender,
  _enemyColors,
  _playerColors,
  io,
  client
) {
  let battle

  battle = setInterval(function() {
    client.hget('server1', 'map', function(err, data) {
      const map = JSON.parse(data)

      const attackerTroopsTile = map[attacker.x][attacker.y]
      const defenderTroopsTile = map[defender.x][defender.y]

      let attackerTroops = attackerTroopsTile.tileInfo.troops
      let defenderTroops = defenderTroopsTile.tileInfo.troops

      if (attackerTroops && defenderTroops) {
        if (attackerTroops.count <= 0 || defenderTroops.count <= 0) {
          if (attackerTroops.count <= 0) {
            attackerTroopsTile.tileInfo.troops = null
            attackerTroopsTile.color = _playerColors.land
          }
          if (defenderTroops.count <= 0) {
            defenderTroopsTile.tileInfo.troops = null
            defenderTroopsTile.color = _enemyColors.land
          }
          client.hset('server1', 'map', JSON.stringify(map))
          clearInterval(battle)

          return
        }

        let playerDamage = getRandomInt(1, 10)
        let enemyDamage = getRandomInt(1, 10)

        attackerTroops.count -= enemyDamage
        defenderTroops.count -= playerDamage

        let attacker = {
          x: attackerTroopsTile.x / attackerTroopsTile.w,
          y: attackerTroopsTile.y / attackerTroopsTile.w
        }
        let defender = {
          x: defenderTroopsTile.x / defenderTroopsTile.w,
          y: defenderTroopsTile.y / defenderTroopsTile.w
        }
        io.of('server1').emit('warProgress', {
          attacker,
          defender,
          defenderCount: defenderTroops.count,
          defenderColor: _enemyColors,
          attackerCount: attackerTroops.count,
          attackerColor: _playerColors
        })
        client.hset('server1', 'map', JSON.stringify(map))
      } else {
        client.hset('server1', 'map', JSON.stringify(map))
        clearInterval(battle)
      }
    })
  }, 1000)
}
function checkValidTroops(playerTroops, enemyTroops, id) {
  if (playerTroops && enemyTroops) {
    if (playerTroops.owner === id && enemyTroops.owner !== id) {
      return true
    }
  }
  return false
}
function checkValidPosition(playerTile, enemyTile) {
  if (
    playerTile.x + 1 === enemyTile.x ||
    playerTile.x - 1 === enemyTile.x ||
    playerTile.y + 1 === enemyTile.y ||
    playerTile.y - 1 === enemyTile.y
  ) {
    return true
  }
  return false
}
module.exports = battle
