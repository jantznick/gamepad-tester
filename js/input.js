// Input handling (keyboard and gamepad)
import gameState from './state.js';
import { CONFIG } from './config.js';

let keys = {
	player1: { left: false, right: false, up: false, down: false },
	player2: { left: false, right: false, up: false, down: false }
};

let gamepadPollInterval = null;
let lastButtonStates = {}; // Track button states to detect presses

export function setupInputHandlers() {
	// Keyboard controls
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);
	
	// ESC key to request exit (shows confirmation)
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && gameState.get('phase') === 'playing') {
			import('./game.js').then(module => {
				module.requestExitGame();
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
	
	// Start polling gamepad buttons for selection screen
	startGamepadPolling();
}

function startGamepadPolling() {
	if (gamepadPollInterval) return;
	
	gamepadPollInterval = setInterval(() => {
		const state = gameState.getState();
		
		const gamepads = navigator.getGamepads();
		
		// Handle exit confirmation modal - A to confirm, B to cancel
		const exitModal = document.getElementById('exit-confirmation-modal');
		if (exitModal && !exitModal.classList.contains('hidden')) {
			state.players.forEach((player, playerIndex) => {
				if (player.gamepadIndex !== null && player.gamepadIndex !== undefined) {
					const gamepad = gamepads[player.gamepadIndex];
					if (gamepad) {
						const gamepadId = `${playerIndex}-${gamepad.index}`;
						if (!lastButtonStates[gamepadId]) {
							lastButtonStates[gamepadId] = {};
						}
						
						// Initialize button cooldown if needed
						if (!lastButtonStates[gamepadId].buttonCooldown) {
							lastButtonStates[gamepadId].buttonCooldown = 0;
						}
						
						// Decrease button cooldown
						if (lastButtonStates[gamepadId].buttonCooldown > 0) {
							lastButtonStates[gamepadId].buttonCooldown -= 50; // Decrease by poll interval
						}
						
						// A button (button 0) to confirm exit
						const confirmButton = gamepad.buttons[0];
						const wasConfirmPressed = lastButtonStates[gamepadId].modalConfirm || false;
						const isConfirmPressed = confirmButton && confirmButton.pressed;
						
						if (!wasConfirmPressed && isConfirmPressed && lastButtonStates[gamepadId].buttonCooldown <= 0) {
							import('./game.js').then(module => {
								module.confirmExitGame();
							});
							lastButtonStates[gamepadId].buttonCooldown = 600; // 600ms cooldown
						}
						
						// B button (button 1) to cancel
						const cancelButton = gamepad.buttons[1];
						const wasCancelPressed = lastButtonStates[gamepadId].modalCancel || false;
						const isCancelPressed = cancelButton && cancelButton.pressed;
						
						if (!wasCancelPressed && isCancelPressed && lastButtonStates[gamepadId].buttonCooldown <= 0) {
							import('./game.js').then(module => {
								module.cancelExitGame();
							});
							lastButtonStates[gamepadId].buttonCooldown = 600; // 600ms cooldown
						}
						
						lastButtonStates[gamepadId].modalConfirm = isConfirmPressed;
						lastButtonStates[gamepadId].modalCancel = isCancelPressed;
					}
				}
			});
			return; // Don't handle other input when modal is open
		}
		
		// Handle game over screen - A button to go back to menu
		if (state.phase === 'ended') {
			state.players.forEach((player, playerIndex) => {
				if (player.gamepadIndex !== null && player.gamepadIndex !== undefined) {
					const gamepad = gamepads[player.gamepadIndex];
					if (gamepad) {
						const gamepadId = `${playerIndex}-${gamepad.index}`;
						if (!lastButtonStates[gamepadId]) {
							lastButtonStates[gamepadId] = {};
						}
						
						// Initialize button cooldown if needed
						if (!lastButtonStates[gamepadId].buttonCooldown) {
							lastButtonStates[gamepadId].buttonCooldown = 0;
						}
						
						// Decrease button cooldown
						if (lastButtonStates[gamepadId].buttonCooldown > 0) {
							lastButtonStates[gamepadId].buttonCooldown -= 50; // Decrease by poll interval
						}
						
						// A button (button 0) for select/confirm
						const selectButton = gamepad.buttons[0];
						const wasPressed = lastButtonStates[gamepadId].select || false;
						const isPressed = selectButton && selectButton.pressed;
						
						if (!wasPressed && isPressed && lastButtonStates[gamepadId].buttonCooldown <= 0) {
							// A button pressed - go back to menu
							import('./game.js').then(module => {
								module.exitGame();
							});
							lastButtonStates[gamepadId].buttonCooldown = 600; // 600ms cooldown
						}
						
						lastButtonStates[gamepadId].select = isPressed;
					}
				}
			});
			return; // Don't handle selection input when game is ended
		}
		
		// Handle playing phase - B button to exit (for freeplay)
		if (state.phase === 'playing') {
			state.players.forEach((player, playerIndex) => {
				if (player.gamepadIndex !== null && player.gamepadIndex !== undefined) {
					const gamepad = gamepads[player.gamepadIndex];
					if (gamepad) {
						const gamepadId = `${playerIndex}-${gamepad.index}`;
						if (!lastButtonStates[gamepadId]) {
							lastButtonStates[gamepadId] = {};
						}
						
						// Initialize button cooldown if needed
						if (!lastButtonStates[gamepadId].buttonCooldown) {
							lastButtonStates[gamepadId].buttonCooldown = 0;
						}
						
						// Decrease button cooldown
						if (lastButtonStates[gamepadId].buttonCooldown > 0) {
							lastButtonStates[gamepadId].buttonCooldown -= 50; // Decrease by poll interval
						}
						
						// B button (button 1) or back button for exit
						const backButton = gamepad.buttons[1] || gamepad.buttons[8]; // Button 8 is often back/select
						const wasPressed = lastButtonStates[gamepadId].back || false;
						const isPressed = backButton && backButton.pressed;
						
						if (!wasPressed && isPressed && lastButtonStates[gamepadId].buttonCooldown <= 0) {
							// B/Back button pressed - request exit (shows confirmation)
							import('./game.js').then(module => {
								module.requestExitGame();
							});
							lastButtonStates[gamepadId].buttonCooldown = 600; // 600ms cooldown
						}
						
						lastButtonStates[gamepadId].back = isPressed;
					}
				}
			});
			return; // Don't handle selection input when playing
		}
		
		// Only handle selection screen input
		if (state.phase !== 'start') return;
		
		state.players.forEach((player, playerIndex) => {
			if (player.gamepadIndex !== null && player.gamepadIndex !== undefined) {
				const gamepad = gamepads[player.gamepadIndex];
				if (gamepad) {
					handleGamepadSelectionInput(playerIndex, gamepad);
				}
			}
		});
	}, 50); // Poll every 50ms
}

function handleGamepadSelectionInput(playerIndex, gamepad) {
	const gamepadId = `${playerIndex}-${gamepad.index}`;
	
	// Initialize button states if needed
	if (!lastButtonStates[gamepadId]) {
		lastButtonStates[gamepadId] = {};
		// Initialize highlight when gamepad is first used
		import('./selection.js').then(module => {
			// This will be called in handleGamepadNavigate, but we can also call it here
			// to ensure highlight is shown immediately
			const state = gameState.getState();
			const player = state.players[playerIndex];
			if (!player.character) {
				module.handleGamepadNavigate(playerIndex, 'right'); // This will initialize and highlight
			}
		});
	}
	
	// Initialize button cooldown if needed
	if (!lastButtonStates[gamepadId].buttonCooldown) {
		lastButtonStates[gamepadId].buttonCooldown = 0;
	}
	
	// Decrease button cooldown
	if (lastButtonStates[gamepadId].buttonCooldown > 0) {
		lastButtonStates[gamepadId].buttonCooldown -= 50; // Decrease by poll interval
	}
	
	// A button (button 0) or bottom right button (button 1) for selection
	const selectButton = gamepad.buttons[0] || gamepad.buttons[1];
	const wasPressed = lastButtonStates[gamepadId].select || false;
	const isPressed = selectButton && selectButton.pressed;
	
	// Detect button press (wasn't pressed, now is) with debouncing
	if (!wasPressed && isPressed && lastButtonStates[gamepadId].buttonCooldown <= 0) {
		import('./selection.js').then(module => {
			module.handleGamepadSelect(playerIndex);
		});
		lastButtonStates[gamepadId].buttonCooldown = 600; // 600ms cooldown
	}
	
	// B button (button 1) or X button (button 2) for deselect
	const deselectButton = gamepad.buttons[1] || gamepad.buttons[2];
	const wasDeselectPressed = lastButtonStates[gamepadId].deselect || false;
	const isDeselectPressed = deselectButton && deselectButton.pressed;
	
	if (!wasDeselectPressed && isDeselectPressed && lastButtonStates[gamepadId].buttonCooldown <= 0) {
		import('./selection.js').then(module => {
			module.deselectCharacter(playerIndex);
		});
		lastButtonStates[gamepadId].buttonCooldown = 600; // 600ms cooldown
	}
	
	// Update button states
	lastButtonStates[gamepadId] = {
		select: isPressed,
		deselect: isDeselectPressed
	};
	
	// Handle D-pad/left stick for navigation (character selection and game mode)
	// D-pad buttons: 12=up, 13=down, 14=left, 15=right (standard gamepad mapping)
	const dpadUp = gamepad.buttons[12];
	const dpadDown = gamepad.buttons[13];
	const dpadLeft = gamepad.buttons[14];
	const dpadRight = gamepad.buttons[15];
	
	// Left stick axes
	const leftRight = gamepad.axes[0]; // -1 to 1, left to right
	const upDown = gamepad.axes[1]; // -1 to 1, up to down
	
	// Store axis states, D-pad states, and navigation cooldown
	if (!lastButtonStates[gamepadId].axes) {
		lastButtonStates[gamepadId].axes = { x: 0, y: 0 };
		lastButtonStates[gamepadId].dpad = { up: false, down: false, left: false, right: false };
		lastButtonStates[gamepadId].navCooldown = 0;
	}
	
	const threshold = 0.5;
	const oldX = lastButtonStates[gamepadId].axes.x;
	const oldY = lastButtonStates[gamepadId].axes.y;
	const oldDpad = lastButtonStates[gamepadId].dpad;
	const navCooldown = lastButtonStates[gamepadId].navCooldown || 0;
	
	// Decrease cooldown
	if (navCooldown > 0) {
		lastButtonStates[gamepadId].navCooldown = navCooldown - 50; // Decrease by poll interval
	}
	
	// Handle D-pad navigation
	const isDpadUp = dpadUp && dpadUp.pressed;
	const isDpadDown = dpadDown && dpadDown.pressed;
	const isDpadLeft = dpadLeft && dpadLeft.pressed;
	const isDpadRight = dpadRight && dpadRight.pressed;
	
	// D-pad up
	if (!oldDpad.up && isDpadUp && navCooldown <= 0) {
		import('./selection.js').then(module => {
			module.handleGamepadNavigate(playerIndex, 'up');
		});
		lastButtonStates[gamepadId].navCooldown = 600; // 600ms cooldown
	}
	
	// D-pad down
	if (!oldDpad.down && isDpadDown && navCooldown <= 0) {
		import('./selection.js').then(module => {
			module.handleGamepadNavigate(playerIndex, 'down');
		});
		lastButtonStates[gamepadId].navCooldown = 600; // 600ms cooldown
	}
	
	// D-pad left
	if (!oldDpad.left && isDpadLeft && navCooldown <= 0) {
		import('./selection.js').then(module => {
			module.handleGamepadNavigate(playerIndex, 'left');
		});
		lastButtonStates[gamepadId].navCooldown = 600; // 600ms cooldown
	}
	
	// D-pad right
	if (!oldDpad.right && isDpadRight && navCooldown <= 0) {
		import('./selection.js').then(module => {
			module.handleGamepadNavigate(playerIndex, 'right');
		});
		lastButtonStates[gamepadId].navCooldown = 600; // 600ms cooldown
	}
	
	// Update D-pad states
	lastButtonStates[gamepadId].dpad = {
		up: isDpadUp,
		down: isDpadDown,
		left: isDpadLeft,
		right: isDpadRight
	};
	
	// Detect axis changes for left stick navigation (with debouncing)
	if (Math.abs(leftRight) > threshold) {
		// Stick is pushed left/right
		if (Math.abs(oldX) <= threshold && navCooldown <= 0) {
			// Just started moving left/right and cooldown expired
			import('./selection.js').then(module => {
				module.handleGamepadNavigate(playerIndex, leftRight > 0 ? 'right' : 'left');
			});
			lastButtonStates[gamepadId].navCooldown = 600; // 600ms cooldown (increased from 300ms)
		}
	}
	
	if (Math.abs(upDown) > threshold) {
		// Stick is pushed up/down
		if (Math.abs(oldY) <= threshold && navCooldown <= 0) {
			// Just started moving up/down and cooldown expired
			import('./selection.js').then(module => {
				module.handleGamepadNavigate(playerIndex, upDown > 0 ? 'down' : 'up');
			});
			lastButtonStates[gamepadId].navCooldown = 600; // 600ms cooldown (increased from 300ms)
		}
	}
	
	lastButtonStates[gamepadId].axes = { x: leftRight, y: upDown };
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
	
	// Check if this gamepad is already assigned
	const alreadyAssigned = state.players.find(p => p.gamepadIndex === gamepad.index);
	if (alreadyAssigned) {
		// Gamepad already assigned, just update status
		import('./ui.js').then(module => {
			module.updateGamepadStatus(state.gamepads);
		});
		return;
	}
	
	// Find first player without a gamepad
	const playerIndex = state.players.findIndex(p => p.gamepadIndex === null);
	
	if (playerIndex !== -1) {
		const newPlayers = [...state.players];
		newPlayers[playerIndex] = { ...newPlayers[playerIndex], gamepadIndex: gamepad.index };
		
		const newGamepads = [...state.gamepads];
		if (!newGamepads.includes(gamepad.index)) {
			newGamepads.push(gamepad.index);
		}
		
		gameState.setState({
			players: newPlayers,
			gamepads: newGamepads
		});
		
		import('./ui.js').then(module => {
			module.updateGamepadStatus(newGamepads);
		});
	}
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
		if (gp) {
			// Check if this gamepad is already assigned
			const alreadyAssigned = state.players.find(p => p.gamepadIndex === i);
			if (alreadyAssigned) continue;
			
			// Find first player without a gamepad
			const playerIndex = state.players.findIndex(p => p.gamepadIndex === null);
			
			if (playerIndex !== -1) {
				const newPlayers = [...state.players];
				newPlayers[playerIndex] = { ...newPlayers[playerIndex], gamepadIndex: i };
				
				const newGamepads = [...state.gamepads];
				if (!newGamepads.includes(i)) {
					newGamepads.push(i);
				}
				
				gameState.setState({
					players: newPlayers,
					gamepads: newGamepads
				});
				
				import('./ui.js').then(module => {
					module.updateGamepadStatus(newGamepads);
				});
			}
		}
	}
}

export function getPlayerMovement(playerIndex) {
	const state = gameState.getState();
	const player = state.players[playerIndex];
	// Only allow movement if player is in 'playing' state
	if (!player || player.gameState !== 'playing') return { dx: 0, dy: 0 };
	
	let dx = 0;
	let dy = 0;
	
	// Keyboard input
	const playerKeys = playerIndex === 0 ? keys.player1 : keys.player2;
	if (playerKeys.left) dx -= CONFIG.moveSpeed;
	if (playerKeys.right) dx += CONFIG.moveSpeed;
	if (playerKeys.up) dy -= CONFIG.moveSpeed;
	if (playerKeys.down) dy += CONFIG.moveSpeed;
	
	// Gamepad input (left stick and D-pad)
	if (player.gamepadIndex !== null && player.gamepadIndex !== undefined) {
		const gamepad = navigator.getGamepads()[player.gamepadIndex];
		if (gamepad) {
			// Left stick axes
			dx += gamepad.axes[0] * CONFIG.moveSpeed;
			dy += gamepad.axes[1] * CONFIG.moveSpeed;
			
			// D-pad buttons: 12=up, 13=down, 14=left, 15=right (standard gamepad mapping)
			const dpadUp = gamepad.buttons[12];
			const dpadDown = gamepad.buttons[13];
			const dpadLeft = gamepad.buttons[14];
			const dpadRight = gamepad.buttons[15];
			
			if (dpadUp && dpadUp.pressed) dy -= CONFIG.moveSpeed;
			if (dpadDown && dpadDown.pressed) dy += CONFIG.moveSpeed;
			if (dpadLeft && dpadLeft.pressed) dx -= CONFIG.moveSpeed;
			if (dpadRight && dpadRight.pressed) dx += CONFIG.moveSpeed;
		}
	}
	
	return { dx, dy };
}

