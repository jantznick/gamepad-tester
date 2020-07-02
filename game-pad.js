document.getElementById('game').width = document.getElementsByTagName('body')[0].offsetWidth * .8;
document.getElementById('game').height = document.getElementsByTagName('body')[0].offsetHeight * .8;

const blockSize = 20;
var canvas = document.getElementById('game');
const cHeight = document.getElementById('game').height;
const cWidth = document.getElementById('game').width;
let widthStart = cWidth * 0.5 - 10;
let heightStart = cHeight * 0.5 - 10;

function draw() {
	if (canvas.getContext) {
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillRect(widthStart, heightStart, blockSize, blockSize);
	}
}

window.addEventListener("gamepadconnected", function(e) {
	var gamepadInfo = document.getElementById('gamepad-info');
	var gp = navigator.getGamepads()[e.gamepad.index];
	gamepadInfo.innerHTML = "Gamepad connected at index " + gp.index + ": " + gp.id + ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.";
	setInterval(pollGamepad, 10);
});

var interval;

const pollGamepad = (e) => {
	var gamepads = navigator.getGamepads();
	for (var i = 0; i < gamepads.length; i++) {
		var gp = gamepads[i];
		if (gp) {
			widthStart += gp.axes[0] * 10;
			heightStart += gp.axes[1] * 10;
			if (widthStart < 0) {
				widthStart = cWidth;
			}
			if (heightStart < 0) {
				heightStart = cHeight;
			}
			if (widthStart > cWidth) {
				widthStart = 0;
			}
			if (heightStart > cHeight) {
				heightStart = 0;
			}
			draw();
			// gp.axes[0] = -1 is left
			// gp.axes[0] = 1 is right
			// gp.axes[1] = -1 is up
			// gp.axes[1] = 1 is down
		}
	}
}

if (!('ongamepadconnected' in window)) {
	interval = setInterval(pollGamepad, 500);
}

const gameLoop = () => {
	console.log('game');
}

draw()
