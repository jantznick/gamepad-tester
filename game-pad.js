document.getElementById('game').width = document.getElementsByTagName('body')[0].offsetWidth * .8;
document.getElementById('game').height = document.getElementsByTagName('body')[0].offsetHeight * .8;

const blockSize = 20;
var canvas = document.getElementById('game');
const cHeight = document.getElementById('game').height;
const cWidth = document.getElementById('game').width;
let widthStart = cWidth * 0.5 - 10;
let heightStart = cHeight * 0.5 - 10;

heartX = getRandomInt(cWidth);
heartY = getRandomInt(cHeight);
let currentScore = 0;
let character = 'moana';
var gamepadInfo = document.getElementById('gamepad-info');

function draw() {
	if (canvas.getContext) {
		checkWinner();
		var ctx = canvas.getContext('2d');
		const image = document.getElementById(character);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(image, widthStart, heightStart);
		drawHeart(heartX, heartY);
		// ctx.fillRect(widthStart, heightStart, blockSize, blockSize);
	}
	gamepadInfo.innerText = `Score: ${currentScore}`
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function setCharacter(name) {
	character = name.replace(/\s+/g, '');
	draw();
};

function resetGame() {
	currentScore = 0;
	let character = 'moana';
	draw();
}

function checkWinner() {
	if (heartX < widthStart + 200 &&
		heartX > widthStart + 20 &&
		heartY < heightStart + 200 &&
		heartY > heightStart + 20) {
		console.log('winner');
		currentScore += 1;
		heartX = getRandomInt(cWidth);
		heartY = getRandomInt(cHeight);
	}
}

function drawHeart(x, y) {
	if (canvas.getContext) {
		var ctx = canvas.getContext('2d');
		const heart = document.getElementById('heart');
		ctx.drawImage(heart, x, y, 50, 50);
		// ctx.fillRect(widthStart, heightStart, blockSize, blockSize);
	}
}

draw()

window.addEventListener("gamepadconnected", function (e) {
	var gp = navigator.getGamepads()[e.gamepad.index];
	gamepadInfo.innerHTML = "Gamepad connected at index " + gp.index + ": " + gp.id + ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.";
	setInterval(pollGamepad, 10);
});

var interval;

const checkBlockBounds = () => {
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
}

const pollGamepad = (e) => {
	var gamepads = navigator.getGamepads();
	for (var i = 0; i < gamepads.length; i++) {
		var gp = gamepads[i];
		if (gp) {
			widthStart += gp.axes[0] * 10;
			heightStart += gp.axes[1] * 10;
			checkBlockBounds();
			draw();
			// gp.axes[0] = -1 is left
			// gp.axes[0] = 1 is right
			// gp.axes[1] = -1 is up
			// gp.axes[1] = 1 is down
		}
	}
}

document.addEventListener('keydown', logKey);

function logKey(e) {
	switch (e.code) {
		case 'ArrowLeft':
			widthStart -= 10;
			break;
		case 'ArrowRight':
			widthStart += 10;
			break;
		case 'ArrowUp':
			heightStart -= 10;
			break;
		case 'ArrowDown':
			heightStart += 10;
			break;
	}
	console.log(widthStart, heightStart)
	checkBlockBounds();
	draw();
}

if (!('ongamepadconnected' in window)) {
	interval = setInterval(pollGamepad, 500);
}

const gameLoop = () => {
	console.log('game');
}