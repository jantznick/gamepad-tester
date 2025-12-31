// Input handling (keyboard and gamepad)
import gameState from './state.js';
import { CONFIG } from './config.js';

let keys = {
	player1: { left: false, right: false, up: false, down: false },
	player2: { left: false, right: false, up: false, down: false }
};

export function setupInputHandlers() {
	// Keyboard controls
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);
	
	// ESC key to exit game
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && gameState.get('phase') === 'playing') {
			import('./game.js').then(module => {
				module.exitGame();
			});
		}
	});
	
	// Gamepad support
	window.addEventListener('gamepadconnected', handleGamepadConnected);
	window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
	
	// Poll for gamepads (fallback)
	if (!('ongamepadconnected' in window)) {
		setInterval(pollGamepads, 500);
	}
}

function handleKeyDown(e) {
	if (gameState.get('phase') !== 'playing') return;
	
	// Player 1: Arrow keys
	if (e.code === 'ArrowLeft') keys.player1.left = true;
	if (e.code === 'ArrowRight') keys.player1.right = true;
	if (e.code === 'ArrowUp') keys.player1.up = true;
	if (e.code === 'ArrowDown') keys.player1.down = true;
	
	// Player 2: WASD keys
	if (e.code === 'KeyA') keys.player2.left = true;
	if (e.code === 'KeyD') keys.player2.right = true;
	if (e.code === 'KeyW') keys.player2.up = true;
	if (e.code === 'KeyS') keys.player2.down = true;
}

function handleKeyUp(e) {
	if (gameState.get('phase') !== 'playing') return;
	
	// Player 1: Arrow keys
	if (e.code === 'ArrowLeft') keys.player1.left = false;
	if (e.code === 'ArrowRight') keys.player1.right = false;
	if (e.code === 'ArrowUp') keys.player1.up = false;
	if (e.code === 'ArrowDown') keys.player1.down = false;
	
	// Player 2: WASD keys
	if (e.code === 'KeyA') keys.player2.left = false;
	if (e.code === 'KeyD') keys.player2.right = false;
	if (e.code === 'KeyW') keys.player2.up = false;
	if (e.code === 'KeyS') keys.player2.down = false;
}

function handleGamepadConnected(e) {
	const state = gameState.getState();
	const gamepad = navigator.getGamepads()[e.gamepad.index];
	const playerIndex = state.gamepads.length < 2 ? state.gamepads.length : null;
	
	if (playerIndex !== null) {
		const newPlayers = [...state.players];
		newPlayers[playerIndex] = { ...newPlayers[playerIndex], gamepadIndex: gamepad.index };
		
		gameState.setState({
			players: newPlayers,
			gamepads: [...state.gamepads, gamepad.index]
		});
	}
	
	import('./ui.js').then(module => {
		module.updateGamepadStatus([...state.gamepads, gamepad.index]);
	});
}

function handleGamepadDisconnected(e) {
	const state = gameState.getState();
	const index = state.gamepads.indexOf(e.gamepad.index);
	
	if (index !== -1) {
		const newPlayers = [...state.players];
		newPlayers[index] = { ...newPlayers[index], gamepadIndex: null };
		
		gameState.setState({
			players: newPlayers,
			gamepads: state.gamepads.filter((_, i) => i !== index)
		});
	}
	
	import('./ui.js').then(module => {
		module.updateGamepadStatus(state.gamepads.filter((_, i) => i !== index));
	});
}

function pollGamepads() {
	const state = gameState.getState();
	const gamepads = navigator.getGamepads();
	
	for (let i = 0; i < gamepads.length; i++) {
		const gp = gamepads[i];
		if (gp && !state.gamepads.includes(i)) {
			const playerIndex = state.gamepads.length < 2 ? state.gamepads.length : null;
			if (playerIndex !== null) {
				const newPlayers = [...state.players];
				newPlayers[playerIndex] = { ...newPlayers[playerIndex], gamepadIndex: i };
				
				gameState.setState({
					players: newPlayers,
					gamepads: [...state.gamepads, i]
				});
				
				import('./ui.js').then(module => {
					module.updateGamepadStatus([...state.gamepads, i]);
				});
			}
		}
	}
}

export function getPlayerMovement(playerIndex) {
	const state = gameState.getState();
	const player = state.players[playerIndex];
	if (!player || !player.character) return { dx: 0, dy: 0 };
	
	let dx = 0;
	let dy = 0;
	
	// Keyboard input
	const playerKeys = playerIndex === 0 ? keys.player1 : keys.player2;
	if (playerKeys.left) dx -= CONFIG.moveSpeed;
	if (playerKeys.right) dx += CONFIG.moveSpeed;
	if (playerKeys.up) dy -= CONFIG.moveSpeed;
	if (playerKeys.down) dy += CONFIG.moveSpeed;
	
	// Gamepad input
	if (player.gamepadIndex !== null) {
		const gamepad = navigator.getGamepads()[player.gamepadIndex];
		if (gamepad) {
			dx += gamepad.axes[0] * CONFIG.moveSpeed;
			dy += gamepad.axes[1] * CONFIG.moveSpeed;
		}
	}
	
	return { dx, dy };
}

