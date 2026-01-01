// Character selection and countdown logic
import gameState from './state.js';
import { CONFIG, CHARACTER_DATA } from './config.js';
import { updateCharacterButtons, updateSelectedDisplay, updateStartButton, updateCountdownDisplay, highlightCharacter, highlightGameMode } from './ui.js';

let countdownInterval = null;

export function selectCharacter(playerIndex, characterName) {
	const state = gameState.getState();
	
	if (playerIndex >= 0 && playerIndex < state.players.length) {
		if (CHARACTER_DATA[characterName] && CONFIG.availableCharacters.includes(characterName)) {
			// Check if this character is already selected by the other player
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayer = state.players[otherPlayerIndex];
			
			if (otherPlayer.character === characterName) {
				// Character already selected by other player - don't allow duplicate
				return;
			}
			
			// Update player character and move to modeSelection
			const newPlayers = [...state.players];
			newPlayers[playerIndex] = { 
				...newPlayers[playerIndex], 
				character: characterName,
				gameState: 'modeSelection' // Move to mode selection after character selected
			};
			
			gameState.updateState('players', newPlayers);
			
			// Initialize game mode highlight for this player
			const modes = ['freeplay', 'race', 'countdown'];
			if (selectedGameModeIndex[playerIndex] === undefined) {
				selectedGameModeIndex[playerIndex] = 0; // Start at first mode
			}
			highlightGameMode(selectedGameModeIndex[playerIndex]);
			
			// Check if both players are ready to move to waitingToStart
			checkAndUpdateWaitingState();
			
			// Update UI
			updateCharacterButtons(newPlayers);
			updateSelectedDisplay(newPlayers);
			updateStartButton(newPlayers);
			
			// Handle countdown logic
			const bothSelected = newPlayers[0].character && newPlayers[1].character;
			
			if (bothSelected) {
				// Both selected - stop countdown
				stopSelectionCountdown();
			} else {
				// Start countdown if this is the first selection
				if (!newPlayers[otherPlayerIndex].character && !state.countdown.active) {
					startSelectionCountdown();
				}
			}
		}
	}
}

export function deselectCharacter(playerIndex) {
	const state = gameState.getState();
	
	if (playerIndex >= 0 && playerIndex < state.players.length) {
		const newPlayers = [...state.players];
		newPlayers[playerIndex] = { 
			...newPlayers[playerIndex], 
			character: null,
			gameState: 'characterSelection' // Reset to character selection
		};
		
		// Reset character index to first available
		const availableChars = CONFIG.availableCharacters;
		const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
		const otherPlayer = newPlayers[otherPlayerIndex];
		
		// Find first character not taken by other player
		let firstAvailableIndex = 0;
		for (let i = 0; i < availableChars.length; i++) {
			if (availableChars[i] !== otherPlayer.character) {
				firstAvailableIndex = i;
				break;
			}
		}
		selectedCharacterIndex[playerIndex] = firstAvailableIndex;
		
		gameState.updateState('players', newPlayers);
		
		// Update UI - regenerate buttons to show first available highlighted
		import('./ui.js').then(module => {
			module.updateCharacterSelectionUI();
			module.updateCharacterButtons(newPlayers);
			module.updateSelectedDisplay(newPlayers);
			module.updateStartButton(newPlayers);
			// Highlight first available character
			module.highlightCharacter(playerIndex, firstAvailableIndex);
		});
		
		// Stop countdown if it was active
		stopSelectionCountdown();
	}
}

// Gamepad selection handling
export let selectedCharacterIndex = {}; // Track which character is highlighted for each player
export let selectedGameModeIndex = {}; // Track which game mode is highlighted

// Initialize highlight when gamepad is first used
function initializeGamepadHighlight(playerIndex) {
	const state = gameState.getState();
	const player = state.players[playerIndex];
	
	if (!player.character) {
		// Initialize character selection highlight - find first available character
		if (selectedCharacterIndex[playerIndex] === undefined) {
			const availableChars = CONFIG.availableCharacters;
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayer = state.players[otherPlayerIndex];
			
			// Find first character not taken by other player
			let firstAvailableIndex = 0;
			for (let i = 0; i < availableChars.length; i++) {
				if (availableChars[i] !== otherPlayer.character) {
					firstAvailableIndex = i;
					break;
				}
			}
			
			selectedCharacterIndex[playerIndex] = firstAvailableIndex;
			highlightCharacter(playerIndex, firstAvailableIndex);
		}
	} else {
		// Initialize game mode selection highlight
		if (selectedGameModeIndex[playerIndex] === undefined) {
			const modes = ['freeplay', 'race', 'countdown'];
			if (state.gameMode) {
				selectedGameModeIndex[playerIndex] = modes.indexOf(state.gameMode);
				if (selectedGameModeIndex[playerIndex] === -1) {
					selectedGameModeIndex[playerIndex] = 0;
				}
			} else {
				// No game mode selected yet, start at first mode
				selectedGameModeIndex[playerIndex] = 0;
			}
			import('./ui.js').then(module => {
				module.highlightGameMode(selectedGameModeIndex[playerIndex]);
			});
		}
	}
}

// Check if players should move to waitingToStart state
export function checkAndUpdateWaitingState() {
	const state = gameState.getState();
	const players = state.players;
	const gameModeSelected = state.gameMode && state.gameMode !== '';
	
	// Get players who have selected characters
	const playersWithCharacters = players.filter(p => p.character);
	
	if (playersWithCharacters.length === 0) return;
	
	// If game mode is selected AND all players with characters are in modeSelection or waitingToStart
	if (gameModeSelected) {
		const allReady = playersWithCharacters.every(p => 
			p.gameState === 'modeSelection' || p.gameState === 'waitingToStart'
		);
		
		if (allReady) {
			// Move all players with characters to waitingToStart
			const newPlayers = players.map(p => {
				if (p.character && (p.gameState === 'modeSelection' || p.gameState === 'waitingToStart')) {
					return { ...p, gameState: 'waitingToStart' };
				}
				return p;
			});
			gameState.updateState('players', newPlayers);
			
			// Update start button immediately
			import('./ui.js').then(module => {
				module.updateStartButton(newPlayers);
			});
		} else {
			// Not all ready yet - still update button to show current state
			import('./ui.js').then(module => {
				module.updateStartButton(players);
			});
		}
	} else {
		// No game mode selected yet - update button to show current state
		import('./ui.js').then(module => {
			module.updateStartButton(players);
		});
	}
}

export function handleGamepadSelect(playerIndex) {
	const state = gameState.getState();
	const player = state.players[playerIndex];
	
	// Initialize if needed
	initializeGamepadHighlight(playerIndex);
	
	// If player has selected a character, allow them to change game mode or start game
	if (player.character) {
		// If player is in waitingToStart, pressing A starts the game
		if (player.gameState === 'waitingToStart') {
			import('./game.js').then(module => {
				module.startGame();
			});
			return;
		}
		
		// Otherwise, player is in modeSelection - navigate/select game mode
		const modes = ['freeplay', 'race', 'countdown'];
		const modeIndex = selectedGameModeIndex[playerIndex] !== undefined ? selectedGameModeIndex[playerIndex] : 0;
		
		if (modeIndex >= 0 && modeIndex < modes.length) {
			import('./gamemode.js').then(module => {
				module.selectGameMode(modes[modeIndex]);
				selectedGameModeIndex[playerIndex] = modeIndex;
			});
		}
	} else {
		// Handle character selection - ensure index is initialized to first available
		const availableChars = CONFIG.availableCharacters;
		if (availableChars.length === 0) return;
		
		// Initialize to first available if not set
		if (selectedCharacterIndex[playerIndex] === undefined) {
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayer = state.players[otherPlayerIndex];
			
			// Find first character not taken by other player
			for (let i = 0; i < availableChars.length; i++) {
				if (availableChars[i] !== otherPlayer.character) {
					selectedCharacterIndex[playerIndex] = i;
					break;
				}
			}
		}
		
		const charIndex = selectedCharacterIndex[playerIndex];
		if (charIndex >= 0 && charIndex < availableChars.length) {
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayer = state.players[otherPlayerIndex];
			const selectedChar = availableChars[charIndex];
			
			// Don't select if already taken by other player
			if (otherPlayer.character !== selectedChar) {
				selectCharacter(playerIndex, selectedChar);
			} else {
				// Character is taken, skip to next available
				let nextIndex = charIndex;
				do {
					nextIndex = (nextIndex + 1) % availableChars.length;
				} while (nextIndex !== charIndex && otherPlayer.character === availableChars[nextIndex]);
				
				if (otherPlayer.character !== availableChars[nextIndex]) {
					selectedCharacterIndex[playerIndex] = nextIndex;
					highlightCharacter(playerIndex, nextIndex);
				}
			}
		}
	}
}

export function handleGamepadNavigate(playerIndex, direction) {
	const state = gameState.getState();
	const player = state.players[playerIndex];
	
	// Initialize highlight if needed
	initializeGamepadHighlight(playerIndex);
	
	if (player.character) {
		// Navigate game modes
		if (selectedGameModeIndex[playerIndex] === undefined) selectedGameModeIndex[playerIndex] = 0;
		
		const modes = ['freeplay', 'race', 'countdown'];
		if (direction === 'left') {
			selectedGameModeIndex[playerIndex] = Math.max(0, selectedGameModeIndex[playerIndex] - 1);
		} else if (direction === 'right') {
			selectedGameModeIndex[playerIndex] = Math.min(modes.length - 1, selectedGameModeIndex[playerIndex] + 1);
		}
		
		// Highlight the selected mode
		import('./ui.js').then(module => {
			module.highlightGameMode(selectedGameModeIndex[playerIndex]);
		});
	} else {
		// Navigate characters - skip over characters taken by other player
		const availableChars = CONFIG.availableCharacters;
		if (selectedCharacterIndex[playerIndex] === undefined) selectedCharacterIndex[playerIndex] = 0;
		
		const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
		const otherPlayer = state.players[otherPlayerIndex];
		
		let newIndex = selectedCharacterIndex[playerIndex];
		
		if (direction === 'left') {
			// Move left, skipping taken characters
			do {
				newIndex = newIndex > 0 ? newIndex - 1 : availableChars.length - 1;
			} while (newIndex !== selectedCharacterIndex[playerIndex] && otherPlayer.character === availableChars[newIndex]);
		} else if (direction === 'right') {
			// Move right, skipping taken characters
			do {
				newIndex = newIndex < availableChars.length - 1 ? newIndex + 1 : 0;
			} while (newIndex !== selectedCharacterIndex[playerIndex] && otherPlayer.character === availableChars[newIndex]);
		} else if (direction === 'up' || direction === 'down') {
			// Could implement grid navigation here if characters are in a grid
		}
		
		selectedCharacterIndex[playerIndex] = newIndex;
		
		// Highlight the selected character
		highlightCharacter(playerIndex, selectedCharacterIndex[playerIndex]);
	}
}

export function startSelectionCountdown() {
	const state = gameState.getState();
	if (state.countdown.active) return;
	
	gameState.updateState('countdown', {
		active: true,
		time: 15,
		interval: null
	});
	
	updateCountdownDisplay({ active: true, time: 15 });
	
	countdownInterval = setInterval(() => {
		const currentState = gameState.getState();
		const newTime = currentState.countdown.time - 1;
		
		gameState.updateState('countdown', {
			...currentState.countdown,
			time: newTime
		});
		
		updateCountdownDisplay({ active: true, time: newTime });
		
			if (newTime <= 0) {
				stopSelectionCountdown();
				const currentState = gameState.getState();
				
				// Set default mode to freeplay if not selected
				if (!currentState.gameMode) {
					gameState.updateState('gameMode', 'freeplay');
				}
				
				// Move all players with characters to 'playing' state
				const newPlayers = currentState.players.map(p => {
					if (p.character) {
						return { ...p, gameState: 'playing' };
					}
					return p;
				});
				gameState.updateState('players', newPlayers);
				
				// Auto-start after a brief delay
				setTimeout(() => {
					import('./game.js').then(module => {
						module.startGame();
					});
				}, 500);
			}
	}, 1000);
}

export function stopSelectionCountdown() {
	if (countdownInterval) {
		clearInterval(countdownInterval);
		countdownInterval = null;
	}
	
	gameState.updateState('countdown', {
		active: false,
		time: 15,
		interval: null
	});
	
	updateCountdownDisplay({ active: false, time: 15 });
}

function autoAssignUnselectedPlayer() {
	const state = gameState.getState();
	const unselectedPlayer = state.players.find(p => !p.character);
	
	if (unselectedPlayer && CONFIG.availableCharacters.length > 0) {
		const availableChars = CONFIG.availableCharacters;
		const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
		
		const newPlayers = [...state.players];
		const playerIndex = unselectedPlayer.id;
		newPlayers[playerIndex] = { ...newPlayers[playerIndex], character: randomChar };
		
		gameState.updateState('players', newPlayers);
		
		// Update UI
		updateCharacterButtons(newPlayers);
		updateSelectedDisplay(newPlayers);
		updateStartButton(newPlayers);
	}
}

// Export for manual start (allows starting with one player)
export function autoAssignForManualStart() {
	const state = gameState.getState();
	const newPlayers = [...state.players];
	
	newPlayers.forEach((player, index) => {
		if (!player.character && CONFIG.availableCharacters.length > 0) {
			// Pick a random character that the other player doesn't have (if possible)
			const otherPlayer = newPlayers[1 - index];
			let randomChar;
			
			if (otherPlayer.character && CONFIG.availableCharacters.length > 1) {
				const otherChars = CONFIG.availableCharacters.filter(c => c !== otherPlayer.character);
				randomChar = otherChars[Math.floor(Math.random() * otherChars.length)] || CONFIG.availableCharacters[0];
			} else {
				randomChar = CONFIG.availableCharacters[Math.floor(Math.random() * CONFIG.availableCharacters.length)];
			}
			
			newPlayers[index] = { ...newPlayers[index], character: randomChar };
		}
	});
	
	gameState.updateState('players', newPlayers);
	
	// Update UI
	updateCharacterButtons(newPlayers);
	updateSelectedDisplay(newPlayers);
	updateStartButton(newPlayers);
}

