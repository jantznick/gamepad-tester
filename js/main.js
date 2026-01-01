// Main entry point
import gameState from './state.js';
import { loadConfig, loadCharacterImages, loadPrizeImages } from './config.js';
import { updateCharacterSelectionUI, updateCharacterButtons, updateSelectedDisplay, updateStartButton, updateGamepadStatus } from './ui.js';
import { selectCharacter } from './selection.js';
import { setupInputHandlers } from './input.js';
import { initGame, startGame, setPrizeImages } from './game.js';
import { selectGameMode } from './gamemode.js';

// Make selectCharacter available globally for onclick handlers
window.selectCharacter = (playerIndex, characterName) => {
	selectCharacter(playerIndex, characterName);
};

// Make startGame available globally
window.startGame = () => {
	startGame();
};

// Make deselectCharacter available globally
window.deselectCharacter = (playerIndex) => {
	import('./selection.js').then(module => {
		module.deselectCharacter(playerIndex);
	});
};

// Make exit game functions available globally
window.requestExitGame = () => {
	import('./game.js').then(module => {
		module.requestExitGame();
	});
};

window.confirmExitGame = () => {
	import('./game.js').then(module => {
		module.confirmExitGame();
	});
};

window.cancelExitGame = () => {
	import('./game.js').then(module => {
		module.cancelExitGame();
	});
};

async function init() {
	// Load configuration
	const { config, characterData } = await loadConfig();
	
	// Update state with config
	gameState.setState({
		config,
		characterData,
		availableCharacters: []
	});
	
	// Load images
	const availableCharacters = await loadCharacterImages();
	const prizeImages = await loadPrizeImages();
	
	// Update state
	gameState.updateState('availableCharacters', availableCharacters);
	setPrizeImages(prizeImages);
	
	// Initialize UI
	updateCharacterSelectionUI();
	
	// Clear any game mode selection styling on startup
	import('./gamemode.js').then(module => {
		module.clearGameModeSelection();
	});
	
	// Setup input handlers
	setupInputHandlers();
	
	// Initialize game
	initGame();
	
	// Subscribe to state changes to update UI
	gameState.subscribe((state) => {
		updateCharacterButtons(state.players);
		updateSelectedDisplay(state.players);
		updateStartButton(state.players);
		updateGamepadStatus(state.gamepads);
		// Re-generate character buttons when players change to update "taken" status
		updateCharacterSelectionUI();
	});
	
	// Initial UI update
	const initialState = gameState.getState();
	updateCharacterButtons(initialState.players);
	updateSelectedDisplay(initialState.players);
	updateStartButton(initialState.players);
	updateGamepadStatus(initialState.gamepads);
	
	// Highlight first available character for each player
	initialState.players.forEach((player, playerIndex) => {
		if (!player.character) {
			const availableChars = initialState.availableCharacters || CONFIG.availableCharacters;
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayer = initialState.players[otherPlayerIndex];
			
			// Find first character not taken by other player
			for (let i = 0; i < availableChars.length; i++) {
				if (availableChars[i] !== otherPlayer.character) {
					import('./selection.js').then(module => {
						// Initialize the selected index
						if (typeof module.selectedCharacterIndex === 'undefined') {
							module.selectedCharacterIndex = {};
						}
						module.selectedCharacterIndex[playerIndex] = i;
						import('./ui.js').then(uiModule => {
							uiModule.highlightCharacter(playerIndex, i);
						});
					});
					break;
				}
			}
		}
	});
	
	// Don't set default game mode - players must select it manually
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);

