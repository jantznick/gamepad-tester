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
	});
	
	// Initial UI update
	const initialState = gameState.getState();
	updateCharacterButtons(initialState.players);
	updateSelectedDisplay(initialState.players);
	updateStartButton(initialState.players);
	updateGamepadStatus(initialState.gamepads);
	
	// Set default game mode to freeplay
	selectGameMode('freeplay');
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);

