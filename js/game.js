// Main game logic
import gameState from './state.js';
import { Player } from './player.js';
import { Prize } from './prize.js';
import { CONFIG, CHARACTER_DATA } from './config.js';
import { getPlayerMovement } from './input.js';
import { updateScoreDisplay } from './ui.js';
import { stopSelectionCountdown, autoAssignForManualStart } from './selection.js';

let canvas, ctx;
let animationFrame = null;
let prizeImages = {};

export function initGame() {
	canvas = document.getElementById('game');
	ctx = canvas.getContext('2d');
	setupCanvas();
}

function setupCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

export function startGame() {
	const state = gameState.getState();
	
	// Check if at least one player has selected
	if (!state.players[0].character && !state.players[1].character) {
		alert('At least one player must select a character!');
		return;
	}
	
	// Don't auto-assign on manual start - only when countdown expires
	// The user should be able to start with just one player if they want
	// Auto-assignment only happens when countdown expires (handled in selection.js)
	
	// Stop countdown if running
	stopSelectionCountdown();
	
	// Update phase
	gameState.updateState('phase', 'playing');
	
	// Hide start screen, show game screen
	const startScreen = document.getElementById('start-screen');
	const gameScreen = document.getElementById('game-screen');
	if (startScreen) startScreen.classList.add('hidden');
	if (gameScreen) gameScreen.classList.remove('hidden');
	
	// Reset player positions
	const finalState = gameState.getState();
	const newPlayers = finalState.players.map((player, index) => ({
		...player,
		x: 100 + (index * 200),
		y: 100,
		score: player.score || 0
	}));
	
	gameState.updateState('players', newPlayers);
	
	// Setup canvas
	setupCanvas();
	
	// Generate prizes
	generatePrizes();
	
	// Update UI
	updateScoreDisplay(newPlayers);
	
	// Start game loop
	gameLoop();
	
	// Fullscreen functionality (commented out - using full browser window instead)
	// Uncomment below if you want to enable fullscreen mode
	// enterFullscreen();
}

export function exitGame() {
	gameState.updateState('phase', 'start');
	
	if (animationFrame) {
		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}
	
	stopSelectionCountdown();
	
	// Fullscreen functionality (commented out)
	// Uncomment below if you want to enable fullscreen mode
	// exitFullscreen();
	
	const startScreen = document.getElementById('start-screen');
	const gameScreen = document.getElementById('game-screen');
	if (startScreen) startScreen.classList.remove('hidden');
	if (gameScreen) gameScreen.classList.add('hidden');
}

function generatePrizes() {
	const state = gameState.getState();
	const prizes = [];
	
	// Only generate prizes for players that have selected characters
	state.players.forEach((player) => {
		if (player.character) {
			const charData = CHARACTER_DATA[player.character];
			if (charData) {
				const prizeType = charData.prizeType;
				// Use prize image if available, otherwise use prizeType as fallback
				const prizeImageId = charData.prize ? charData.prize.replace('.png', '') : prizeType;
				
				for (let i = 0; i < CONFIG.numPrizes; i++) {
					prizes.push(new Prize(
						Math.random() * (canvas.width - CONFIG.prizeSize),
						Math.random() * (canvas.height - CONFIG.prizeSize),
						prizeType,
						prizeImageId
					));
				}
			}
		}
	});
	
	// Fallback: if no prizes generated, create some default ones
	if (prizes.length === 0) {
		for (let i = 0; i < CONFIG.numPrizes; i++) {
			prizes.push(new Prize(
				Math.random() * (canvas.width - CONFIG.prizeSize),
				Math.random() * (canvas.height - CONFIG.prizeSize),
				'heart',
				'heart'
			));
		}
	}
	
	gameState.updateState('prizes', prizes);
}

function gameLoop() {
	const state = gameState.getState();
	if (state.phase !== 'playing') return;
	
	updateMovement();
	checkCollisions();
	draw();
	
	animationFrame = requestAnimationFrame(gameLoop);
}

function updateMovement() {
	const state = gameState.getState();
	const newPlayers = state.players.map((player, index) => {
		if (!player.character) return player;
		
		const { dx, dy } = getPlayerMovement(index);
		
		if (dx !== 0 || dy !== 0) {
			let newX = (player.x || 100) + dx;
			let newY = (player.y || 100) + dy;
			
			// Check bounds
			if (newX < 0) newX = canvas.width;
			if (newX > canvas.width) newX = 0;
			if (newY < 0) newY = canvas.height;
			if (newY > canvas.height) newY = 0;
			
			return { ...player, x: newX, y: newY };
		}
		
		return player;
	});
	
	gameState.updateState('players', newPlayers);
}

function checkCollisions() {
	const state = gameState.getState();
	let prizes = state.prizes.filter(prize => !prize.isExpired);
	
	// Update prize timers
	prizes.forEach(prize => prize.update());
	
	// Check collisions
	prizes.forEach((prize) => {
		if (prize.isExpired) return;
		
		state.players.forEach((player) => {
			if (!player.character) return;
			
			const charData = CHARACTER_DATA[player.character];
			const prizeType = charData.prizeType;
			
			// Check collision
			const charWidth = CONFIG.characterSize;
			const charHeight = CONFIG.characterSize;
			const prizeSize = CONFIG.prizeSize;
			
			const collision = (
				prize.x < (player.x || 0) + charWidth &&
				prize.x + prizeSize > (player.x || 0) &&
				prize.y < (player.y || 0) + charHeight &&
				prize.y + prizeSize > (player.y || 0)
			);
			
			if (collision && prize.type === prizeType) {
				// Update player score
				const newPlayers = state.players.map(p => 
					p.id === player.id ? { ...p, score: (p.score || 0) + 1 } : p
				);
				gameState.updateState('players', newPlayers);
				updateScoreDisplay(newPlayers);
				
				// Respawn prize
				prize.x = Math.random() * (canvas.width - CONFIG.prizeSize);
				prize.y = Math.random() * (canvas.height - CONFIG.prizeSize);
				prize.lifetime = 10000 + Math.random() * 5000;
				prize.spawnTime = Date.now();
				prize.isExpired = false;
			}
		});
	});
	
	// Remove expired prizes
	prizes = prizes.filter(prize => !prize.isExpired);
	
	// Keep minimum number of prizes
	if (prizes.length < CONFIG.numPrizes) {
		generateAdditionalPrizes(prizes);
	}
	
	gameState.updateState('prizes', prizes);
}

function generateAdditionalPrizes(existingPrizes) {
	const state = gameState.getState();
	const needed = CONFIG.numPrizes - existingPrizes.length;
	if (needed <= 0) return existingPrizes;
	
	const playersWithChars = state.players.filter(p => p.character);
	if (playersWithChars.length === 0) return existingPrizes;
	
	const prizesPerPlayer = Math.ceil(needed / playersWithChars.length);
	const newPrizes = [...existingPrizes];
	
	playersWithChars.forEach((player) => {
		const charData = CHARACTER_DATA[player.character];
		if (!charData) return;
		const prizeType = charData.prizeType;
		// Use prize image if available, otherwise use prizeType as fallback
		const prizeImageId = charData.prize ? charData.prize.replace('.png', '') : prizeType;
		
		for (let i = 0; i < prizesPerPlayer && newPrizes.length < CONFIG.numPrizes; i++) {
			newPrizes.push(new Prize(
				Math.random() * (canvas.width - CONFIG.prizeSize),
				Math.random() * (canvas.height - CONFIG.prizeSize),
				prizeType,
				prizeImageId
			));
		}
	});
	
	return newPrizes;
}

function draw() {
	const state = gameState.getState();
	
	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// Draw background
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, '#e0f2fe');
	gradient.addColorStop(1, '#fce7f3');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	// Draw prizes
	state.prizes.forEach((prize) => {
		if (prize.isExpired) return;
		
		const scale = prize.getThrobScale();
		const size = CONFIG.prizeSize * scale;
		const offset = (CONFIG.prizeSize - size) / 2;
		
		let prizeImg = prizeImages[prize.prizeImage];
		if (!prizeImg) {
			prizeImg = document.getElementById('heart');
		}
		
		ctx.save();
		
		if (prize.shouldThrob()) {
			const remaining = prize.getRemainingTime();
			const opacity = Math.max(0.3, remaining / 5000);
			ctx.globalAlpha = opacity;
		}
		
		if (prizeImg && prizeImg.complete) {
			ctx.drawImage(prizeImg, prize.x + offset, prize.y + offset, size, size);
		} else {
			// Fallback: draw colored star based on which player's prize type it is
			const state = gameState.getState();
			const player = state.players.find(p => {
				if (!p.character) return false;
				const charData = CHARACTER_DATA[p.character];
				return charData && charData.prizeType === prize.type;
			});
			
			// Use player color: blue for player 1, green for player 2
			const starColor = player && player.id === 0 ? '#3B82F6' : player && player.id === 1 ? '#10B981' : '#FF69B4';
			
			// Draw a star shape
			drawStar(ctx, prize.x + CONFIG.prizeSize/2, prize.y + CONFIG.prizeSize/2, size/2, starColor);
		}
		
		ctx.restore();
	});
	
	// Draw players - only draw if they have a character selected
	state.players.forEach((player) => {
		if (!player.character) return; // Skip players without characters
		
		const charImg = document.getElementById(player.character);
		if (charImg && charImg.complete) {
			ctx.drawImage(charImg, player.x || 100, player.y || 100, CONFIG.characterSize, CONFIG.characterSize);
		} else {
			// Fallback rectangle
			ctx.fillStyle = player.id === 0 ? '#3B82F6' : '#10B981';
			ctx.fillRect(player.x || 100, player.y || 100, CONFIG.characterSize, CONFIG.characterSize);
		}
	});
}

function enterFullscreen() {
	const element = document.documentElement;
	if (element.requestFullscreen) {
		element.requestFullscreen().catch(err => console.log('Fullscreen not available:', err));
	} else if (element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.msRequestFullscreen) {
		element.msRequestFullscreen();
	}
}

function exitFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	}
}

// Export prize images setter
export function setPrizeImages(images) {
	prizeImages = images;
}

// Window resize handler
window.addEventListener('resize', () => {
	const state = gameState.getState();
	if (state.phase === 'playing') {
		setupCanvas();
		generatePrizes();
	}
});

// Helper function to draw a star (SVG-like, drawn directly to canvas)
function drawStar(ctx, x, y, radius, color) {
	ctx.save();
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.beginPath();
	
	const spikes = 5;
	const outerRadius = radius;
	const innerRadius = radius * 0.4; // Make inner radius smaller for better star shape
	
	for (let i = 0; i < spikes * 2; i++) {
		const angle = (Math.PI * i) / spikes - Math.PI / 2; // Start from top
		const r = i % 2 === 0 ? outerRadius : innerRadius;
		const px = x + Math.cos(angle) * r;
		const py = y + Math.sin(angle) * r;
		
		if (i === 0) {
			ctx.moveTo(px, py);
		} else {
			ctx.lineTo(px, py);
		}
	}
	
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}

// Make exitGame available globally
window.exitGame = exitGame;

