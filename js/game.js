// Main game logic
import gameState from './state.js';
import { Player } from './player.js';
import { Prize } from './prize.js';
import { CONFIG, CHARACTER_DATA } from './config.js';
import { getPlayerMovement } from './input.js';
import { updateScoreDisplay } from './ui.js';
import { stopSelectionCountdown, autoAssignForManualStart } from './selection.js';
import { initGameMode, updateRaceProgress, stopGameTimer } from './gamemode.js';

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
	
	// Check if at least one player is ready to play
	const readyPlayers = state.players.filter(p => p.gameState === 'waitingToStart' || p.gameState === 'playing');
	if (readyPlayers.length === 0) {
		alert('At least one player must be ready to play!');
		return;
	}
	
	// Move all waitingToStart players to playing
	const newPlayers = state.players.map(p => {
		if (p.gameState === 'waitingToStart') {
			return { ...p, gameState: 'playing' };
		}
		return p;
	});
	gameState.updateState('players', newPlayers);
	
	doStartGame();
}

function doStartGame() {
	const state = gameState.getState();
	
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
	
	// Reset player positions - only for players who are playing
	const finalState = gameState.getState();
	let positionOffset = 0;
	const newPlayers = finalState.players.map((player, index) => {
		// Only reset position if player is in playing state
		if (player.gameState === 'playing') {
			const updated = {
				...player,
				x: 100 + (positionOffset * 200),
				y: 100,
				score: player.score || 0
			};
			positionOffset++;
			return updated;
		}
		// Keep non-playing players as-is (they won't be drawn or controlled)
		return player;
	});
	
	gameState.updateState('players', newPlayers);
	
	// Setup canvas
	setupCanvas();
	
	// Generate prizes
	generatePrizes();
	
	// Update UI
	updateScoreDisplay(newPlayers);
	
	// Initialize game mode
	initGameMode();
	
	// Start game loop
	gameLoop();
	
	// Fullscreen functionality (commented out - using full browser window instead)
	// Uncomment below if you want to enable fullscreen mode
	// enterFullscreen();
}

let isPaused = false;
let pausedAnimationFrame = null;

export function requestExitGame() {
	const state = gameState.getState();
	
	// If game is playing, pause it and show confirmation
	if (state.phase === 'playing') {
		isPaused = true;
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			pausedAnimationFrame = animationFrame;
			animationFrame = null;
		}
		
		// Show confirmation modal
		const modal = document.getElementById('exit-confirmation-modal');
		if (modal) {
			modal.classList.remove('hidden');
		}
	} else {
		// Not playing, just exit
		exitGame();
	}
}

export function confirmExitGame() {
	// Hide modal
	const modal = document.getElementById('exit-confirmation-modal');
	if (modal) {
		modal.classList.add('hidden');
	}
	
	isPaused = false;
	pausedAnimationFrame = null;
	
	// Exit the game
	exitGame();
}

export function cancelExitGame() {
	// Hide modal
	const modal = document.getElementById('exit-confirmation-modal');
	if (modal) {
		modal.classList.add('hidden');
	}
	
	// Resume game
	isPaused = false;
	if (pausedAnimationFrame) {
		animationFrame = pausedAnimationFrame;
		pausedAnimationFrame = null;
		gameLoop();
	}
}

export function exitGame() {
	const state = gameState.getState();
	
	// Reset scores and clear character selections, but keep gamepad assignments
	const resetPlayers = state.players.map(player => ({
		...player,
		score: 0,
		character: null, // Clear character selection
		gameState: 'characterSelection', // Reset to character selection
		x: player.id === 0 ? 100 : 300,
		y: 100
		// Keep gamepadIndex - don't clear it
	}));
	
	gameState.updateState('phase', 'start');
	gameState.updateState('players', resetPlayers);
	gameState.updateState('gameMode', null); // Reset game mode to null
	
	if (animationFrame) {
		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}
	
	isPaused = false;
	pausedAnimationFrame = null;
	
	stopSelectionCountdown();
	stopGameTimer();
	
	// Hide game over overlay
	document.getElementById('game-over-overlay').classList.add('hidden');
	
	// Hide exit confirmation modal
	const modal = document.getElementById('exit-confirmation-modal');
	if (modal) {
		modal.classList.add('hidden');
	}
	
	// Clear game mode selection styling
	import('./gamemode.js').then(module => {
		module.clearGameModeSelection();
	});
	
	// Update UI
	import('./ui.js').then(module => {
		module.updateScoreDisplay(resetPlayers);
		module.updateSelectedDisplay(resetPlayers);
		// Regenerate character buttons to show first available highlighted
		module.updateCharacterSelectionUI();
	});
	
	// Reset race progress bars
	const player1Progress = document.getElementById('player1-progress');
	const player2Progress = document.getElementById('player2-progress');
	if (player1Progress) player1Progress.style.width = '0%';
	if (player2Progress) player2Progress.style.width = '0%';
	
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
	
	// Generate prizes for each player that has selected a character
	// Each player gets CONFIG.numPrizes prizes of their prize type
	const playersWithChars = state.players.filter(p => p.character);
	
	playersWithChars.forEach((player) => {
		const charData = CHARACTER_DATA[player.character];
		if (charData) {
			const prizeType = charData.prizeType;
			// Use prize image if available, otherwise use prizeType as fallback
			// Extract just the filename without path and extension (e.g., "images/prizes/heart.png" -> "heart")
			const prizeImageId = charData.prize ? charData.prize.split('/').pop().replace('.png', '') : prizeType;
			
			for (let i = 0; i < CONFIG.numPrizes; i++) {
				prizes.push(new Prize(
					Math.random() * (canvas.width - CONFIG.prizeSize),
					Math.random() * (canvas.height - CONFIG.prizeSize),
					prizeType,
					prizeImageId
				));
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
	if (state.phase !== 'playing') {
		// Stop the loop if game ended
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
		return;
	}
	
	updateMovement();
	checkCollisions();
	draw();
	
	// Update race progress if in race mode (checkCollisions already calls this, but keep for safety)
	if (state.gameMode === 'race') {
		updateRaceProgress();
	}
	
	animationFrame = requestAnimationFrame(gameLoop);
}

function updateMovement() {
	const state = gameState.getState();
	const newPlayers = state.players.map((player, index) => {
		// Only update movement for players who are playing
		if (player.gameState !== 'playing') return player;
		
		const { dx, dy } = getPlayerMovement(index);
		
		if (dx !== 0 || dy !== 0) {
			// Don't use || here - 0 is a valid position!
			const oldX = player.x !== undefined && player.x !== null ? player.x : 100;
			const oldY = player.y !== undefined && player.y !== null ? player.y : 100;
			let newX = oldX + dx;
			let newY = oldY + dy;
			
			const charSize = CONFIG.characterSize;
			
			// DEBUG: Log when approaching edges or would go negative
			if (dx < 0) {
				if (newX < 50 || newX < 0) {
					console.log(`MOVING LEFT: oldX=${oldX}, dx=${dx}, newX=${newX}, newX+charSize=${newX + charSize}, canvas.width=${canvas.width}, charSize=${charSize}`);
					console.log(`  -> Would be negative? ${newX < 0}, Condition: newX < -charSize? ${newX < -charSize} (${newX} < ${-charSize})`);
				}
			}
			if (dx > 0 && newX > canvas.width - 50) {
				console.log(`MOVING RIGHT: oldX=${oldX}, dx=${dx}, newX=${newX}, newX+charSize=${newX + charSize}, canvas.width=${canvas.width}, charSize=${charSize}`);
				console.log(`  -> Condition: newX > canvas.width + charSize? ${newX > canvas.width + charSize} (${newX} > ${canvas.width + charSize})`);
			}
			
			// Horizontal wrapping: allow character to go completely off screen, then wrap
			if (newX > canvas.width + charSize) {
				console.log(`WRAP RIGHT->LEFT: oldX=${oldX}, newX=${newX}, canvas.width=${canvas.width}, charSize=${charSize}`);
				// Completely off right side, wrap to left (coming in from left)
				newX = -charSize;
				console.log(`  -> Wrapped to: newX=${newX}`);
			} else if (newX < -charSize) {
				console.log(`WRAP LEFT->RIGHT: oldX=${oldX}, newX=${newX}, canvas.width=${canvas.width}, charSize=${charSize}`);
				// Completely off left side, wrap to right (coming in from right)
				newX = canvas.width;
				console.log(`  -> Wrapped to: newX=${newX}`);
			}
			
			// DEBUG: Check if newX would be negative but isn't
			if (dx < 0 && oldX + dx < 0 && newX >= 0) {
				console.log(`WOULD BE NEGATIVE BUT ISN'T: oldX=${oldX}, dx=${dx}, calculated=${oldX + dx}, actual newX=${newX}`);
			}
			
			// DEBUG: Log the actual value being returned when near left edge
			if (dx < 0 && newX <= 10) {
				console.log(`RETURNING POSITION: x=${newX}, y=${newY} (was oldX=${oldX}, dx=${dx})`);
			}
			
			// Vertical wrapping: allow character to go completely off screen, then wrap
			// Moving DOWN: wrap when completely off bottom, appear coming in from top
			if (newY > canvas.height + charSize) {
				newY = -charSize;
			}
			// Moving UP: wrap when completely off top, appear coming in from bottom
			else if (newY < -charSize) {
				newY = canvas.height;
			}
			
			// DEBUG: Log final position if it changed significantly
			if (Math.abs(newX - oldX) > 100 || Math.abs(newY - oldY) > 100) {
				console.log(`LARGE POSITION CHANGE: oldX=${oldX}, newX=${newX}, oldY=${oldY}, newY=${newY}`);
			}
			
			return { ...player, x: newX, y: newY };
		}
		
		return player;
	});
	
	gameState.updateState('players', newPlayers);
}

function checkCollisions() {
	const state = gameState.getState();
	let prizes = [...state.prizes];
	
	// Update prize timers and mark expired ones
	prizes.forEach(prize => prize.update());
	
	// Check collisions
	prizes.forEach((prize) => {
		if (prize.isExpired) return;
		
		state.players.forEach((player) => {
			// Only check collisions for players who are playing
			if (player.gameState !== 'playing') return;
			
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
				
				// Check for race mode win condition
				if (state.gameMode === 'race') {
					updateRaceProgress();
				}
				
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
	
	// Always ensure we have the correct number of prizes per player type
	prizes = generateAdditionalPrizes(prizes);
	
	gameState.updateState('prizes', prizes);
}

function generateAdditionalPrizes(existingPrizes) {
	const state = gameState.getState();
	const playersWithChars = state.players.filter(p => p.character);
	if (playersWithChars.length === 0) return existingPrizes;
	
	// Count how many prizes of each type we currently have
	const prizeCountsByType = {};
	existingPrizes.forEach(prize => {
		prizeCountsByType[prize.type] = (prizeCountsByType[prize.type] || 0) + 1;
	});
	
	// Determine how many prizes each player type should have
	const targetPrizesPerPlayer = CONFIG.numPrizes;
	const newPrizes = [...existingPrizes];
	
	// For each player, ensure they have the target number of prizes
	playersWithChars.forEach((player) => {
		const charData = CHARACTER_DATA[player.character];
		if (!charData) return;
		
		const prizeType = charData.prizeType;
		const currentCount = prizeCountsByType[prizeType] || 0;
		const needed = targetPrizesPerPlayer - currentCount;
		
		if (needed > 0) {
			// Use prize image if available, otherwise use prizeType as fallback
			const prizeImageId = charData.prize ? charData.prize.replace('.png', '') : prizeType;
			
			for (let i = 0; i < needed; i++) {
				newPrizes.push(new Prize(
					Math.random() * (canvas.width - CONFIG.prizeSize),
					Math.random() * (canvas.height - CONFIG.prizeSize),
					prizeType,
					prizeImageId
				));
			}
			
			// Update count for next iteration
			prizeCountsByType[prizeType] = targetPrizesPerPlayer;
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
		
		// Try to get the prize image from loaded images
		let prizeImg = prizeImages[prize.prizeImage];
		
		// If not found in prizeImages, try to get from DOM (for heart.png that's in HTML)
		if (!prizeImg && prize.prizeImage === 'heart') {
			prizeImg = document.getElementById('heart');
		}
		
		ctx.save();
		
		if (prize.shouldThrob()) {
			const remaining = prize.getRemainingTime();
			const opacity = Math.max(0.3, remaining / 5000);
			ctx.globalAlpha = opacity;
		}
		
		// If we have a valid prize image, draw it
		if (prizeImg && prizeImg.complete) {
			ctx.drawImage(prizeImg, prize.x + offset, prize.y + offset, size, size);
		} else {
			// Fallback: draw colored star based on which player's prize type it is
			const currentState = gameState.getState();
			const player = currentState.players.find(p => {
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

