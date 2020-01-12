let offX
let offY
let canvas

export function addListeners(playerX, playerY) {
  canvas = document.getElementById('inner')

  canvas.addEventListener('mousedown', mouseDown, false)
  window.addEventListener('mouseup', mouseUp, false)
  defaultCamera(playerX, playerY)
}

export function defaultCamera(playerX, playerY) {
  canvas.style.position = 'absolute'
  canvas.style.top = 0 - playerY + 350 + 'px'
  canvas.style.left = 0 - playerX + 500 + 'px'
}

function mouseUp() {
  window.removeEventListener('mousemove', divMove, true)
}

function mouseDown(e) {
  if (e.button == 0 || e.button == 2) {
    offY = e.clientY - parseInt(canvas.offsetTop)
    offX = e.clientX - parseInt(canvas.offsetLeft)
    window.addEventListener('mousemove', divMove, true)
  }
}

function divMove(e) {
  canvas.style.position = 'absolute'
  canvas.style.top = e.clientY - offY + 'px'
  canvas.style.left = e.clientX - offX + 'px'
}
