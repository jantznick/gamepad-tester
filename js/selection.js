// Character selection and countdown logic
import gameState from './state.js';
import { CONFIG, CHARACTER_DATA } from './config.js';
import { updateCharacterButtons, updateSelectedDisplay, updateStartButton, updateCountdownDisplay } from './ui.js';

let countdownInterval = null;

export function selectCharacter(playerIndex, characterName) {
	const state = gameState.getState();
	
	if (playerIndex >= 0 && playerIndex < state.players.length) {
		if (CHARACTER_DATA[characterName] && CONFIG.availableCharacters.includes(characterName)) {
			// Update player character
			const newPlayers = [...state.players];
			newPlayers[playerIndex] = { ...newPlayers[playerIndex], character: characterName };
			
			gameState.updateState('players', newPlayers);
			
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
				const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
				if (!newPlayers[otherPlayerIndex].character && !state.countdown.active) {
					startSelectionCountdown();
				}
			}
		}
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
				// Auto-assign only when countdown expires (not on manual start)
				autoAssignUnselectedPlayer();
				// Set default mode to freeplay if countdown auto-starts
				const currentState = gameState.getState();
				if (!currentState.gameMode || currentState.gameMode === 'freeplay') {
					gameState.updateState('gameMode', 'freeplay');
				}
				// Auto-start after a brief delay
				setTimeout(() => {
					const finalState = gameState.getState();
					if (finalState.players[0].character && finalState.players[1].character) {
						// Import startGame dynamically to avoid circular dependency
						import('./game.js').then(module => {
							module.startGame();
						});
					}
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

