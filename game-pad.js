// Game Configuration - will be loaded from config.json
let CONFIG = {
	characterSize: 200,
	prizeSize: 50,
	moveSpeed: 10,
	gamepadPollInterval: 10,
	characters: [],
	gameSettings: {},
};

// Character data loaded from config
let CHARACTER_DATA = {};

// Prize Class
class Prize {
	constructor(x, y, type, prizeImage) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.prizeImage = prizeImage;
		// Prize lifetime: 10-15 seconds (random)
		this.lifetime = 10000 + Math.random() * 5000; // 10-15 seconds in milliseconds
		this.spawnTime = Date.now();
		this.isExpired = false;
	}
	
	getRemainingTime() {
		const elapsed = Date.now() - this.spawnTime;
		return Math.max(0, this.lifetime - elapsed);
	}
	
	getTimeRemainingPercent() {
		return this.getRemainingTime() / this.lifetime;
	}
	
	update() {
		if (this.getRemainingTime() <= 0) {
			this.isExpired = true;
		}
	}
	
	shouldThrob() {
		const remaining = this.getRemainingTime();
		// Throb in last 3-5 seconds
		return remaining <= 5000 && remaining > 0;
	}
	
	getThrobScale() {
		if (!this.shouldThrob()) return 1;
		const remaining = this.getRemainingTime();
		const throbTime = 5000 - remaining; // 0 to 2000ms
		// Pulse between 0.7 and 1.0
		return 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(throbTime / 100));
	}
}

// Player Class
class Player {
	constructor(id, startX, startY, color) {
		this.id = id;
		this.x = startX;
		this.y = startY;
		this.color = color;
		this.character = null; // Will be set during character selection
		this.score = 0;
		this.gamepadIndex = null;
		this.keys = {
			left: false,
			right: false,
			up: false,
			down: false,
		};
	}

	setCharacter(name) {
		if (CHARACTER_DATA[name] && CONFIG.availableCharacters.includes(name)) {
			this.character = name;
			return true;
		}
		return false;
	}

	getCharacterData() {
		return CHARACTER_DATA[this.character] || null;
	}

	getPrizeType() {
		const data = this.getCharacterData();
		return data ? data.prizeType : 'heart';
	}

	getPlayerName() {
		const data = this.getCharacterData();
		return data ? data.playerName : 'Player';
	}

	move(dx, dy, canvasWidth, canvasHeight) {
		this.x += dx;
		this.y += dy;
		this.checkBounds(canvasWidth, canvasHeight);
	}

	checkBounds(canvasWidth, canvasHeight) {
		if (this.x < 0) this.x = canvasWidth;
		if (this.x > canvasWidth) this.x = 0;
		if (this.y < 0) this.y = canvasHeight;
		if (this.y > canvasHeight) this.y = 0;
	}

	checkPrizeCollision(prizeX, prizeY) {
		const charWidth = CONFIG.characterSize;
		const charHeight = CONFIG.characterSize;
		const prizeSize = CONFIG.prizeSize;

		return (
			prizeX < this.x + charWidth &&
			prizeX + prizeSize > this.x &&
			prizeY < this.y + charHeight &&
			prizeY + prizeSize > this.y
		);
	}
}

// Game Class
class Game {
	constructor() {
		this.canvas = document.getElementById('game');
		this.ctx = this.canvas.getContext('2d');
		this.startScreen = document.getElementById('start-screen');
		this.gameScreen = document.getElementById('game-screen');
		this.startButton = document.getElementById('start-button');
		
		this.players = [
			new Player(0, 100, 100, '#3B82F6'), // Player 1 - Blue
			new Player(1, 300, 100, '#10B981'), // Player 2 - Green
		];

		this.prizes = [];
		this.numPrizes = 5;
		this.gamepads = [];
		this.animationFrame = null;
		this.isPlaying = false;
		this.prizeImages = {}; // Cache for prize images
		
		// Countdown timer
		this.selectionCountdown = null;
		this.countdownTime = 15; // 15 seconds
		this.countdownInterval = null;

		// Load config first, then initialize
		this.loadConfig();
	}

	async loadConfig() {
		try {
			const response = await fetch('config.json');
			const config = await response.json();
			
			// Update CONFIG with game settings
			CONFIG.characterSize = config.gameSettings.characterSize || 200;
			CONFIG.prizeSize = config.gameSettings.prizeSize || 50;
			CONFIG.moveSpeed = config.gameSettings.moveSpeed || 10;
			CONFIG.numPrizes = config.gameSettings.numPrizes || 5;
			
			// Build character data map
			config.characters.forEach(char => {
				CHARACTER_DATA[char.id] = char;
			});
			
			// Load character images
			await this.loadCharacterImages();
			
			// Load prize images
			await this.loadPrizeImages();
			
			// Update UI with available characters
			this.updateCharacterSelectionUI();
			
			// Now initialize
			this.init();
		} catch (error) {
			console.error('Error loading config:', error);
			// Fallback initialization
			this.init();
		}
	}

	async loadCharacterImages() {
		const promises = Object.values(CHARACTER_DATA).map(char => {
			return new Promise((resolve) => {
				const img = new Image();
				img.id = char.id;
				img.src = char.image;
				img.alt = char.playerName;
				img.onload = () => {
					// Add to hidden images container if not already there
					const existing = document.getElementById(char.id);
					if (!existing) {
						let container = document.querySelector('div[style*="display:none"]');
						if (!container) {
							container = document.createElement('div');
							container.style.display = 'none';
							document.body.appendChild(container);
						}
						container.appendChild(img);
					}
					resolve({ success: true, char });
				};
				img.onerror = () => {
					console.warn(`Character image ${char.image} not found for ${char.playerName}`);
					resolve({ success: false, char });
				};
			});
		});
		
		const results = await Promise.all(promises);
		// Filter to only include characters with successfully loaded images
		const availableChars = results.filter(r => r.success).map(r => r.char.id);
		// Update available characters list
		CONFIG.availableCharacters = availableChars;
	}

	async loadPrizeImages() {
		const prizeTypes = new Set();
		Object.values(CHARACTER_DATA).forEach(char => {
			prizeTypes.add(char.prize);
		});
		
		const promises = Array.from(prizeTypes).map(prizeFile => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				const prizeId = prizeFile.replace('.png', '');
				img.id = `prize-${prizeId}`;
				img.src = prizeFile;
				img.onload = () => {
					this.prizeImages[prizeId] = img;
					// Add to hidden images container if not already there
					const existing = document.getElementById(`prize-${prizeId}`);
					if (!existing) {
						const container = document.querySelector('div[style*="display:none"]') || document.body;
						container.appendChild(img);
					}
					resolve();
				};
				img.onerror = () => {
					// If prize image doesn't exist, fallback to heart
					console.warn(`Prize image ${prizeFile} not found, using heart as fallback`);
					if (!this.prizeImages['heart']) {
						const heartImg = document.getElementById('heart');
						if (heartImg) {
							this.prizeImages[prizeId] = heartImg;
						}
					}
					resolve(); // Don't fail, just use fallback
				};
			});
		});
		
		await Promise.all(promises);
	}

	updateCharacterSelectionUI() {
		// Update character buttons based on available characters - using images for kids
		[0, 1].forEach(playerIndex => {
			const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
			if (buttonContainer) {
				// Clear existing buttons
				buttonContainer.innerHTML = '';
				
				// Add image buttons for each character in config
				Object.values(CHARACTER_DATA).forEach(char => {
					const button = document.createElement('button');
					button.onclick = () => this.selectCharacter(playerIndex, char.id);
					button.setAttribute('data-character', char.id);
					
					// Check if character image is available
					const isAvailable = CONFIG.availableCharacters.includes(char.id);
					
					// Create image element
					const img = document.createElement('img');
					img.src = char.image;
					img.alt = char.playerName;
					img.className = 'w-24 h-24 object-contain';
					
					// Style the button with image
					if (isAvailable) {
						button.className = 'character-btn p-2 rounded-xl border-4 border-transparent hover:border-purple-400 transition-all transform hover:scale-110 cursor-pointer bg-white shadow-md';
					} else {
						button.className = 'character-btn p-2 rounded-xl border-4 border-transparent opacity-50 cursor-not-allowed bg-gray-200';
						button.disabled = true;
						img.style.filter = 'grayscale(100%)';
					}
					
					button.appendChild(img);
					buttonContainer.appendChild(button);
				});
			}
		});
	}

	init() {
		this.setupCanvas();
		this.setupEventListeners();
		this.updateCharacterButtons();
		this.updateGamepadStatus();
		this.updateStartButton();
	}

	setupCanvas() {
		// Set canvas to full viewport size
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	setupEventListeners() {
		// Keyboard controls
		document.addEventListener('keydown', (e) => this.handleKeyDown(e));
		document.addEventListener('keyup', (e) => this.handleKeyUp(e));

		// ESC key to exit game
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.isPlaying) {
				this.exitGame();
			}
		});

		// Gamepad support
		window.addEventListener('gamepadconnected', (e) => this.handleGamepadConnected(e));
		window.addEventListener('gamepaddisconnected', (e) => this.handleGamepadDisconnected(e));

		// Poll for gamepads (fallback for browsers without events)
		if (!('ongamepadconnected' in window)) {
			setInterval(() => this.pollGamepads(), 500);
		}

		// Window resize
		window.addEventListener('resize', () => {
			if (this.isPlaying) {
				this.setupCanvas();
				this.generatePrizes();
			}
		});
	}

	handleKeyDown(e) {
		if (!this.isPlaying) return;

		// Player 1: Arrow keys
		if (e.code === 'ArrowLeft') this.players[0].keys.left = true;
		if (e.code === 'ArrowRight') this.players[0].keys.right = true;
		if (e.code === 'ArrowUp') this.players[0].keys.up = true;
		if (e.code === 'ArrowDown') this.players[0].keys.down = true;

		// Player 2: WASD keys
		if (e.code === 'KeyA') this.players[1].keys.left = true;
		if (e.code === 'KeyD') this.players[1].keys.right = true;
		if (e.code === 'KeyW') this.players[1].keys.up = true;
		if (e.code === 'KeyS') this.players[1].keys.down = true;
	}

	handleKeyUp(e) {
		if (!this.isPlaying) return;

		// Player 1: Arrow keys
		if (e.code === 'ArrowLeft') this.players[0].keys.left = false;
		if (e.code === 'ArrowRight') this.players[0].keys.right = false;
		if (e.code === 'ArrowUp') this.players[0].keys.up = false;
		if (e.code === 'ArrowDown') this.players[0].keys.down = false;

		// Player 2: WASD keys
		if (e.code === 'KeyA') this.players[1].keys.left = false;
		if (e.code === 'KeyD') this.players[1].keys.right = false;
		if (e.code === 'KeyW') this.players[1].keys.up = false;
		if (e.code === 'KeyS') this.players[1].keys.down = false;
	}

	handleGamepadConnected(e) {
		const gamepad = navigator.getGamepads()[e.gamepad.index];
		const playerIndex = this.gamepads.length < 2 ? this.gamepads.length : null;
		
		if (playerIndex !== null) {
			this.players[playerIndex].gamepadIndex = gamepad.index;
			this.gamepads.push(gamepad.index);
		}

		this.updateGamepadStatus();
	}

	handleGamepadDisconnected(e) {
		const index = this.gamepads.indexOf(e.gamepad.index);
		if (index !== -1) {
			this.players[index].gamepadIndex = null;
			this.gamepads.splice(index, 1);
		}
		this.updateGamepadStatus();
	}

	pollGamepads() {
		const gamepads = navigator.getGamepads();
		for (let i = 0; i < gamepads.length; i++) {
			const gp = gamepads[i];
			if (gp && !this.gamepads.includes(i)) {
				// Auto-assign to first available player
				const playerIndex = this.gamepads.length < 2 ? this.gamepads.length : null;
				if (playerIndex !== null) {
					this.players[playerIndex].gamepadIndex = i;
					this.gamepads.push(i);
					this.updateGamepadStatus();
				}
			}
		}
	}

	updateGamepadStatus() {
		const statusEl = document.getElementById('gamepad-status');
		if (!statusEl) return;
		
		const connected = this.gamepads.length;
		if (connected > 0) {
			statusEl.textContent = `${connected} gamepad(s) connected`;
			statusEl.className = 'text-center text-sm text-green-600';
		} else {
			statusEl.textContent = 'No gamepads connected. Use keyboard controls (Arrow keys for Player 1, WASD for Player 2)';
			statusEl.className = 'text-center text-sm text-gray-600';
		}
	}

	generatePrizes() {
		this.prizes = [];
		
		// Generate a mix of prizes - each player's prize type appears on screen
		this.players.forEach((player) => {
			if (player.character) {
				const charData = player.getCharacterData();
				const prizeType = player.getPrizeType();
				const prizeImageId = charData.prize.replace('.png', '');
				
				for (let i = 0; i < this.numPrizes; i++) {
					this.prizes.push(new Prize(
						Math.random() * (this.canvas.width - CONFIG.prizeSize),
						Math.random() * (this.canvas.height - CONFIG.prizeSize),
						prizeType,
						prizeImageId
					));
				}
			}
		});
		
		// Ensure we have at least some prizes
		if (this.prizes.length === 0) {
			// Fallback: generate some default hearts
			for (let i = 0; i < this.numPrizes; i++) {
				this.prizes.push(new Prize(
					Math.random() * (this.canvas.width - CONFIG.prizeSize),
					Math.random() * (this.canvas.height - CONFIG.prizeSize),
					'heart',
					'heart'
				));
			}
		}
	}

	updateMovement() {
		// Handle keyboard movement
		this.players.forEach((player, index) => {
			if (!player.character) return;

			let dx = 0;
			let dy = 0;

			if (player.keys.left) dx -= CONFIG.moveSpeed;
			if (player.keys.right) dx += CONFIG.moveSpeed;
			if (player.keys.up) dy -= CONFIG.moveSpeed;
			if (player.keys.down) dy += CONFIG.moveSpeed;

			// Handle gamepad movement
			if (player.gamepadIndex !== null) {
				const gamepad = navigator.getGamepads()[player.gamepadIndex];
				if (gamepad) {
					dx += gamepad.axes[0] * CONFIG.moveSpeed;
					dy += gamepad.axes[1] * CONFIG.moveSpeed;
				}
			}

			if (dx !== 0 || dy !== 0) {
				player.move(dx, dy, this.canvas.width, this.canvas.height);
			}
		});
	}

	checkCollisions() {
		// Remove expired prizes first
		this.prizes = this.prizes.filter(prize => !prize.isExpired);
		
		// Check collisions with remaining prizes
		this.prizes.forEach((prize, prizeIndex) => {
			// Update prize timer
			prize.update();
			
			this.players.forEach((player) => {
				if (!player.character) return;
				
				// Only collect prizes that match the player's character type and aren't expired
				if (!prize.isExpired && 
					prize.type === player.getPrizeType() && 
					player.checkPrizeCollision(prize.x, prize.y)) {
					player.score++;
					// Respawn prize in new location with new timer
					prize.x = Math.random() * (this.canvas.width - CONFIG.prizeSize);
					prize.y = Math.random() * (this.canvas.height - CONFIG.prizeSize);
					prize.lifetime = 10000 + Math.random() * 5000;
					prize.spawnTime = Date.now();
					prize.isExpired = false;
					this.updateUI();
				}
			});
		});
		
		// Keep minimum number of prizes on screen
		if (this.prizes.length < this.numPrizes) {
			this.generateAdditionalPrizes();
		}
	}
	
	generateAdditionalPrizes() {
		const needed = this.numPrizes - this.prizes.length;
		if (needed <= 0) return;
		
		// Generate prizes for each player's character type
		const playersWithChars = this.players.filter(p => p.character);
		if (playersWithChars.length === 0) return;
		
		// Distribute prizes evenly between player types
		const prizesPerPlayer = Math.ceil(needed / playersWithChars.length);
		
		playersWithChars.forEach((player) => {
			const charData = player.getCharacterData();
			const prizeType = player.getPrizeType();
			const prizeImageId = charData.prize.replace('.png', '');
			
			for (let i = 0; i < prizesPerPlayer && this.prizes.length < this.numPrizes; i++) {
				this.prizes.push(new Prize(
					Math.random() * (this.canvas.width - CONFIG.prizeSize),
					Math.random() * (this.canvas.height - CONFIG.prizeSize),
					prizeType,
					prizeImageId
				));
			}
		});
	}

	draw() {
		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw background gradient
		const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
		gradient.addColorStop(0, '#e0f2fe');
		gradient.addColorStop(1, '#fce7f3');
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw prizes
		this.prizes.forEach((prize) => {
			if (prize.isExpired) return;
			
			// Calculate throb scale if needed
			const scale = prize.getThrobScale();
			const size = CONFIG.prizeSize * scale;
			const offset = (CONFIG.prizeSize - size) / 2;
			
			// Try to get the prize image, fallback to heart
			let prizeImg = this.prizeImages[prize.prizeImage];
			if (!prizeImg) {
				prizeImg = document.getElementById('heart');
			}
			
			// Save context for transformation
			this.ctx.save();
			
			// Apply throb effect with opacity
			if (prize.shouldThrob()) {
				const remaining = prize.getRemainingTime();
				const opacity = Math.max(0.3, remaining / 5000); // Fade out in last 5 seconds
				this.ctx.globalAlpha = opacity;
			}
			
			if (prizeImg && prizeImg.complete) {
				this.ctx.drawImage(prizeImg, prize.x + offset, prize.y + offset, size, size);
			} else {
				// Fallback: draw colored circle
				this.ctx.fillStyle = '#FF69B4';
				this.ctx.beginPath();
				this.ctx.arc(prize.x + CONFIG.prizeSize/2, prize.y + CONFIG.prizeSize/2, size/2, 0, Math.PI * 2);
				this.ctx.fill();
			}
			
			this.ctx.restore();
		});

		// Draw players
		this.players.forEach((player) => {
			if (!player.character) return;

			const charImg = document.getElementById(player.character);
			if (charImg && charImg.complete) {
				this.ctx.drawImage(charImg, player.x, player.y, CONFIG.characterSize, CONFIG.characterSize);
			} else {
				// Fallback rectangle if image not loaded
				this.ctx.fillStyle = player.color;
				this.ctx.fillRect(player.x, player.y, CONFIG.characterSize, CONFIG.characterSize);
			}
		});
	}

	gameLoop() {
		if (!this.isPlaying) return;

		this.updateMovement();
		this.checkCollisions();
		this.draw();
		this.animationFrame = requestAnimationFrame(() => this.gameLoop());
	}

	selectCharacter(playerIndex, characterName) {
		if (playerIndex >= 0 && playerIndex < this.players.length) {
			if (this.players[playerIndex].setCharacter(characterName)) {
				this.updateCharacterButtons();
				this.updateStartButton();
				this.updateSelectedDisplay();
				
				// Check if both players have selected
				const bothSelected = this.players[0].character && this.players[1].character;
				
				if (bothSelected) {
					// Both selected - stop countdown
					this.stopSelectionCountdown();
				} else {
					// Start countdown if this is the first selection
					const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
					if (!this.players[otherPlayerIndex].character && !this.selectionCountdown) {
						this.startSelectionCountdown();
					}
				}
			}
		}
	}
	
	startSelectionCountdown() {
		this.selectionCountdown = this.countdownTime;
		this.updateCountdownDisplay();
		
		// Update countdown every second
		this.countdownInterval = setInterval(() => {
			this.selectionCountdown--;
			this.updateCountdownDisplay();
			
			if (this.selectionCountdown <= 0) {
				this.stopSelectionCountdown();
				// Auto-assign a random character to the other player if not selected
				const unselectedPlayer = this.players.find(p => !p.character);
				if (unselectedPlayer) {
					const availableChars = CONFIG.availableCharacters;
					if (availableChars.length > 0) {
						const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
						unselectedPlayer.setCharacter(randomChar);
						this.updateCharacterButtons();
						this.updateSelectedDisplay();
					}
				}
				// Auto-start the game
				setTimeout(() => {
					if (this.players[0].character && this.players[1].character) {
						this.startGame();
					}
				}, 500);
			}
		}, 1000);
	}
	
	stopSelectionCountdown() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
		this.selectionCountdown = null;
		this.updateCountdownDisplay();
	}
	
	updateCountdownDisplay() {
		const countdownEl = document.getElementById('selection-countdown');
		if (countdownEl) {
			if (this.selectionCountdown !== null && this.selectionCountdown > 0) {
				countdownEl.textContent = `Game starting in ${this.selectionCountdown}...`;
				countdownEl.classList.remove('hidden');
				countdownEl.classList.add('text-red-600', 'font-bold', 'text-xl');
			} else {
				countdownEl.classList.add('hidden');
			}
		}
	}

	updateCharacterButtons() {
		// Update active state for character buttons - visual feedback for kids
		this.players.forEach((player, playerIndex) => {
			const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
			if (buttonContainer) {
				const buttons = buttonContainer.querySelectorAll('.character-btn');
				buttons.forEach((btn) => {
					const charName = btn.getAttribute('data-character');
					if (charName === player.character) {
						// Selected: big border, scale up, shadow
						btn.classList.remove('border-transparent', 'hover:border-purple-400');
						btn.classList.add('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
					} else {
						// Not selected: reset to normal
						btn.classList.remove('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
						if (!btn.disabled) {
							btn.classList.add('border-transparent', 'hover:border-purple-400');
						}
					}
				});
			}
		});
	}

	updateSelectedDisplay() {
		// Update Player 1
		const player1Selected = document.getElementById('player1-selected');
		const player1Box = document.getElementById('player1-box');
		const player1Title = document.getElementById('player1-title');
		
		if (player1Selected) {
			const charData = this.players[0].getCharacterData();
			player1Selected.textContent = charData 
				? `✓ ${charData.playerName} selected!`
				: 'Tap a character!';
			player1Selected.className = charData 
				? 'text-lg font-semibold text-blue-700 mb-2'
				: 'text-lg font-semibold text-gray-600 mb-2';
		}
		
		// Update Player 1 box styling
		if (player1Box && player1Title) {
			const charData = this.players[0].getCharacterData();
			if (charData) {
				// Character selected - show blue colors
				player1Box.className = 'border-4 border-blue-400 rounded-lg p-4 bg-blue-50 transition-all';
				player1Title.className = 'font-bold text-blue-600 mb-4 text-2xl text-center';
			} else {
				// No character selected - show neutral gray
				player1Box.className = 'border-4 border-gray-300 rounded-lg p-4 bg-gray-50 transition-all';
				player1Title.className = 'font-bold text-gray-600 mb-4 text-2xl text-center';
			}
		}
		
		// Update Player 2
		const player2Selected = document.getElementById('player2-selected');
		const player2Box = document.getElementById('player2-box');
		const player2Title = document.getElementById('player2-title');
		
		if (player2Selected) {
			const charData = this.players[1].getCharacterData();
			player2Selected.textContent = charData 
				? `✓ ${charData.playerName} selected!`
				: 'Tap a character!';
			player2Selected.className = charData 
				? 'text-lg font-semibold text-green-700 mb-2'
				: 'text-lg font-semibold text-gray-600 mb-2';
		}
		
		// Update Player 2 box styling
		if (player2Box && player2Title) {
			const charData = this.players[1].getCharacterData();
			if (charData) {
				// Character selected - show green colors
				player2Box.className = 'border-4 border-green-400 rounded-lg p-4 bg-green-50 transition-all';
				player2Title.className = 'font-bold text-green-600 mb-4 text-2xl text-center';
			} else {
				// No character selected - show neutral gray
				player2Box.className = 'border-4 border-gray-300 rounded-lg p-4 bg-gray-50 transition-all';
				player2Title.className = 'font-bold text-gray-600 mb-4 text-2xl text-center';
			}
		}
	}

	updateStartButton() {
		// Enable start button only if both players have selected characters
		// (Auto-assignment only happens when countdown expires)
		const bothSelected = this.players[0].character && this.players[1].character;
		if (this.startButton) {
			this.startButton.disabled = !bothSelected;
		}
	}

	startGame() {
		// Require both players to be selected when manually starting
		// Auto-assignment only happens when countdown expires
		if (!this.players[0].character || !this.players[1].character) {
			alert('Both players must select a character to start!');
			return;
		}
		
		// Stop countdown if running
		this.stopSelectionCountdown();

		this.isPlaying = true;
		
		// Hide start screen, show game screen
		this.startScreen.classList.add('hidden');
		this.gameScreen.classList.remove('hidden');

		// Reset player positions
		this.players.forEach((player, index) => {
			player.x = 100 + (index * 200);
			player.y = 100;
			player.score = 0;
		});

		// Setup canvas for fullscreen
		this.setupCanvas();
		this.generatePrizes();
		this.updateUI(); // Update UI with character names and scores

		// Start game loop
		this.gameLoop();

		// Try to enter fullscreen
		this.enterFullscreen();
	}

	exitGame() {
		this.isPlaying = false;
		
		// Cancel animation frame
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
		}
		
		// Stop countdown if running
		this.stopSelectionCountdown();

		// Exit fullscreen
		this.exitFullscreen();

		// Show start screen, hide game screen
		this.startScreen.classList.remove('hidden');
		this.gameScreen.classList.add('hidden');
	}

	enterFullscreen() {
		const element = document.documentElement;
		if (element.requestFullscreen) {
			element.requestFullscreen().catch(err => {
				console.log('Fullscreen not available:', err);
			});
		} else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if (element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
	}

	exitFullscreen() {
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

	updateUI() {
		const player1ScoreEl = document.getElementById('player1-score');
		const player2ScoreEl = document.getElementById('player2-score');
		
		if (player1ScoreEl) {
			if (this.players[0].character) {
				const player1Name = this.players[0].getPlayerName();
				player1ScoreEl.textContent = `${player1Name}: ${this.players[0].score}`;
			} else {
				player1ScoreEl.textContent = 'Select character';
			}
		}
		
		if (player2ScoreEl) {
			if (this.players[1].character) {
				const player2Name = this.players[1].getPlayerName();
				player2ScoreEl.textContent = `${player2Name}: ${this.players[1].score}`;
			} else {
				player2ScoreEl.textContent = 'Select character';
			}
		}
	}
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
	game = new Game();
});
