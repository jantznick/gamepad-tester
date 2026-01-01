// UI management
import { CHARACTER_DATA, CONFIG } from './config.js';
import gameState from './state.js';

// Export CONFIG for use in other modules
export { CONFIG };

export function updateCharacterSelectionUI() {
	const state = gameState.getState();
	
	[0, 1].forEach(playerIndex => {
		const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
		if (buttonContainer) {
			buttonContainer.innerHTML = '';
			
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayerCharacter = state.players[otherPlayerIndex].character;
			const player = state.players[playerIndex];
			const availableChars = CONFIG.availableCharacters;
			
			// Find first available character for this player (not taken, not selected by other)
			let firstAvailableIndex = -1;
			for (let i = 0; i < availableChars.length; i++) {
				if (availableChars[i] !== otherPlayerCharacter) {
					firstAvailableIndex = i;
					break;
				}
			}
			
			Object.values(CHARACTER_DATA).forEach((char, index) => {
				const button = document.createElement('button');
				button.onclick = () => window.selectCharacter(playerIndex, char.id);
				button.setAttribute('data-character', char.id);
				
				const isAvailable = CONFIG.availableCharacters.includes(char.id);
				const isTaken = char.id === otherPlayerCharacter;
				const isSelected = player.character === char.id;
				const isFirstAvailable = !player.character && firstAvailableIndex >= 0 && 
					availableChars.indexOf(char.id) === firstAvailableIndex;
				
				const img = document.createElement('img');
				img.src = char.image;
				img.alt = char.playerName;
				img.className = 'object-contain';
				img.style.maxWidth = '100%';
				img.style.maxHeight = '100%';
				
				if (!isAvailable) {
					// Character not available (not loaded)
					button.className = 'character-btn rounded-lg border-4 border-transparent opacity-50 cursor-not-allowed bg-gray-200 flex items-center justify-center';
					button.style.width = '80px';
					button.style.height = '80px';
					button.disabled = true;
					img.style.filter = 'grayscale(100%)';
				} else if (isTaken && !isSelected) {
					// Character taken by other player
					button.className = 'character-btn rounded-lg border-4 border-red-300 opacity-60 cursor-not-allowed bg-red-50 flex items-center justify-center';
					button.style.width = '80px';
					button.style.height = '80px';
					button.disabled = true;
					img.style.filter = 'grayscale(50%)';
					// Add a visual indicator
					const overlay = document.createElement('div');
					overlay.className = 'absolute inset-0 bg-red-500 bg-opacity-30 rounded-lg flex items-center justify-center';
					overlay.textContent = 'Taken';
					overlay.style.fontSize = '0.75rem';
					overlay.style.fontWeight = 'bold';
					overlay.style.color = 'white';
					button.style.position = 'relative';
					button.appendChild(overlay);
				} else if (isFirstAvailable) {
					// First available character - highlight it
					button.className = 'character-btn rounded-lg border-4 border-blue-500 scale-110 shadow-lg transition-all transform cursor-pointer bg-white flex items-center justify-center';
					button.style.width = '80px';
					button.style.height = '80px';
				} else {
					// Character available
					button.className = 'character-btn rounded-lg border-4 border-transparent hover:border-purple-400 transition-all transform hover:scale-110 cursor-pointer bg-white shadow-md flex items-center justify-center';
					button.style.width = '80px';
					button.style.height = '80px';
				}
				
				button.appendChild(img);
				buttonContainer.appendChild(button);
			});
		}
	});
}

export function updateCharacterButtons(players) {
	players.forEach((player, playerIndex) => {
		const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
		if (buttonContainer) {
			const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
			const otherPlayerCharacter = players[otherPlayerIndex].character;
			
			const buttons = buttonContainer.querySelectorAll('.character-btn');
			buttons.forEach((btn) => {
				const charName = btn.getAttribute('data-character');
				const isSelected = charName === player.character;
				const isTaken = charName === otherPlayerCharacter && !isSelected;
				
				if (isSelected) {
					btn.classList.remove('border-transparent', 'hover:border-purple-400', 'border-blue-500', 'border-red-300', 'opacity-60', 'cursor-not-allowed', 'bg-red-50');
					btn.classList.add('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
					btn.disabled = false;
					// Remove any "Taken" overlay
					const overlay = btn.querySelector('div');
					if (overlay) overlay.remove();
				} else if (isTaken) {
					// Character taken by other player
					btn.classList.remove('border-transparent', 'hover:border-purple-400', 'border-blue-500', 'border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
					btn.classList.add('border-red-300', 'opacity-60', 'cursor-not-allowed', 'bg-red-50');
					btn.disabled = true;
					// Add "Taken" indicator if not already there
					if (!btn.querySelector('div')) {
						const overlay = document.createElement('div');
						overlay.className = 'absolute inset-0 bg-red-500 bg-opacity-30 rounded-xl flex items-center justify-center';
						overlay.textContent = 'Taken';
						overlay.style.fontSize = '0.75rem';
						overlay.style.fontWeight = 'bold';
						overlay.style.color = 'white';
						btn.style.position = 'relative';
						btn.appendChild(overlay);
					}
				} else {
					btn.classList.remove('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300', 'border-blue-500', 'border-red-300', 'opacity-60', 'cursor-not-allowed', 'bg-red-50');
					if (!btn.disabled) {
						btn.classList.add('border-transparent', 'hover:border-purple-400');
					}
					// Remove any "Taken" overlay
					const overlay = btn.querySelector('div');
					if (overlay) overlay.remove();
				}
			});
		}
	});
}

export function highlightCharacter(playerIndex, charIndex) {
	const state = gameState.getState();
	const availableChars = CONFIG.availableCharacters;
	if (charIndex < 0 || charIndex >= availableChars.length) return;
	
	const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
	if (buttonContainer) {
		const buttons = buttonContainer.querySelectorAll('.character-btn');
		const targetChar = availableChars[charIndex];
		const player = state.players[playerIndex];
		
		let highlightedButton = null;
		
		buttons.forEach((btn) => {
			const charName = btn.getAttribute('data-character');
			const isSelected = charName === player.character;
			const isHighlighted = charName === targetChar;
			
			if (isSelected) {
				// Keep selection highlight (yellow)
				btn.classList.remove('border-transparent', 'hover:border-purple-400', 'border-blue-500', 'scale-110', 'shadow-lg');
				btn.classList.add('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
			} else if (isHighlighted) {
				// Highlight this character (blue)
				btn.classList.remove('border-transparent', 'hover:border-purple-400', 'border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
				btn.classList.add('border-blue-500', 'border-4', 'scale-110', 'shadow-lg');
				highlightedButton = btn;
			} else {
				// Remove all highlights
				btn.classList.remove('border-blue-500', 'scale-110', 'shadow-lg', 'border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
				if (!btn.disabled) {
					btn.classList.add('border-transparent', 'hover:border-purple-400');
				}
			}
		});
		
		// Scroll highlighted button into view
		if (highlightedButton) {
			highlightedButton.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'center'
			});
		}
	}
}

export function highlightGameMode(modeIndex) {
	const modes = ['freeplay', 'race', 'countdown'];
	if (modeIndex < 0 || modeIndex >= modes.length) return;
	
	const buttons = document.querySelectorAll('.game-mode-btn');
	buttons.forEach((btn, index) => {
		if (index === modeIndex) {
			btn.classList.add('ring-4', 'ring-blue-500', 'scale-110');
		} else {
			btn.classList.remove('ring-4', 'ring-blue-500', 'scale-110');
		}
	});
}

export function updateSelectedDisplay(players) {
	// Player 1
	const player1Selected = document.getElementById('player1-selected');
	const player1Box = document.getElementById('player1-box');
	const player1Title = document.getElementById('player1-title');
	const player1Buttons = document.getElementById('player1-buttons');
	const player1SelectedImage = document.getElementById('player1-selected-image');
	
	if (player1Selected) {
		const charData = players[0].character ? CHARACTER_DATA[players[0].character] : null;
		player1Selected.textContent = charData 
			? `✓ ${charData.playerName} selected!`
			: 'Tap a character!';
		player1Selected.className = charData 
			? 'text-sm font-semibold text-blue-700 mb-0.5'
			: 'text-sm font-semibold text-gray-600 mb-0.5';
	}
	
	// Show/hide character buttons and selected image
	if (player1Buttons && player1SelectedImage) {
		const charData = players[0].character ? CHARACTER_DATA[players[0].character] : null;
		if (charData) {
			// Hide buttons, show selected image
			player1Buttons.classList.add('hidden');
			player1SelectedImage.classList.remove('hidden');
			
			// Update selected image
			player1SelectedImage.innerHTML = '';
			const img = document.createElement('img');
			img.src = charData.image;
			img.alt = charData.playerName;
			img.className = 'character-selected-image w-32 h-32 object-contain animate-grow';
			player1SelectedImage.appendChild(img);
		} else {
			// Show buttons, hide selected image
			player1Buttons.classList.remove('hidden');
			player1SelectedImage.classList.add('hidden');
		}
	}
	
	// Show/hide deselect button
	const player1Deselect = document.getElementById('player1-deselect');
	if (player1Deselect) {
		if (players[0].character) {
			player1Deselect.classList.remove('hidden');
		} else {
			player1Deselect.classList.add('hidden');
		}
	}
	
	if (player1Box && player1Title) {
		const charData = players[0].character ? CHARACTER_DATA[players[0].character] : null;
		if (charData) {
			player1Box.className = 'border-4 border-blue-400 rounded-lg pt-2 px-2 pb-1 bg-blue-50 transition-all flex flex-col overflow-hidden';
			player1Title.className = 'font-bold text-blue-600 mb-1 text-lg text-center flex-shrink-0';
		} else {
			player1Box.className = 'border-4 border-gray-300 rounded-lg pt-2 px-2 pb-1 bg-gray-50 transition-all flex flex-col overflow-hidden';
			player1Title.className = 'font-bold text-gray-600 mb-1 text-lg text-center flex-shrink-0';
		}
	}
	
	// Player 2
	const player2Selected = document.getElementById('player2-selected');
	const player2Box = document.getElementById('player2-box');
	const player2Title = document.getElementById('player2-title');
	const player2Buttons = document.getElementById('player2-buttons');
	const player2SelectedImage = document.getElementById('player2-selected-image');
	
	if (player2Selected) {
		const charData = players[1].character ? CHARACTER_DATA[players[1].character] : null;
		player2Selected.textContent = charData 
			? `✓ ${charData.playerName} selected!`
			: 'Tap a character!';
		player2Selected.className = charData 
			? 'text-sm font-semibold text-green-700 mb-0.5'
			: 'text-sm font-semibold text-gray-600 mb-0.5';
	}
	
	// Show/hide character buttons and selected image
	if (player2Buttons && player2SelectedImage) {
		const charData = players[1].character ? CHARACTER_DATA[players[1].character] : null;
		if (charData) {
			// Hide buttons, show selected image
			player2Buttons.classList.add('hidden');
			player2SelectedImage.classList.remove('hidden');
			
			// Update selected image
			player2SelectedImage.innerHTML = '';
			const img = document.createElement('img');
			img.src = charData.image;
			img.alt = charData.playerName;
			img.className = 'character-selected-image w-32 h-32 object-contain animate-grow';
			player2SelectedImage.appendChild(img);
		} else {
			// Show buttons, hide selected image
			player2Buttons.classList.remove('hidden');
			player2SelectedImage.classList.add('hidden');
		}
	}
	
	// Show/hide deselect button
	const player2Deselect = document.getElementById('player2-deselect');
	if (player2Deselect) {
		if (players[1].character) {
			player2Deselect.classList.remove('hidden');
		} else {
			player2Deselect.classList.add('hidden');
		}
	}
	
	if (player2Box && player2Title) {
		const charData = players[1].character ? CHARACTER_DATA[players[1].character] : null;
		if (charData) {
			player2Box.className = 'border-4 border-green-400 rounded-lg pt-2 px-2 pb-1 bg-green-50 transition-all flex flex-col overflow-hidden';
			player2Title.className = 'font-bold text-green-600 mb-1 text-lg text-center flex-shrink-0';
		} else {
			player2Box.className = 'border-4 border-gray-300 rounded-lg pt-2 px-2 pb-1 bg-gray-50 transition-all flex flex-col overflow-hidden';
			player2Title.className = 'font-bold text-gray-600 mb-1 text-lg text-center flex-shrink-0';
		}
	}
}

export function updateStartButton(players) {
	const startButton = document.getElementById('start-button');
	if (!startButton) return;
	
	const state = gameState.getState();
	// Check if any players are in waitingToStart state
	const readyToStart = players.some(p => p.gameState === 'waitingToStart');
	
	// Enable start button if any players are ready to start
	startButton.disabled = !readyToStart;
	
	// Highlight the button if ready to start
	if (readyToStart) {
		startButton.classList.remove('bg-gray-400', 'disabled:bg-gray-400', 'disabled:cursor-not-allowed');
		startButton.classList.add('bg-green-500', 'hover:bg-green-600', 'ring-4', 'ring-green-300', 'scale-110', 'transition-all');
	} else {
		startButton.classList.remove('bg-green-500', 'hover:bg-green-600', 'ring-4', 'ring-green-300', 'scale-110');
		startButton.classList.add('bg-gray-400', 'disabled:bg-gray-400', 'disabled:cursor-not-allowed');
	}
}

// Countdown display removed - players manually start when ready

export function updateGamepadStatus(gamepads) {
	const statusEl = document.getElementById('gamepad-status');
	if (!statusEl) return;
	
	const connected = gamepads.length;
	if (connected > 0) {
		statusEl.textContent = `${connected} gamepad(s) connected`;
		statusEl.className = 'text-center text-sm text-green-600';
	} else {
		statusEl.textContent = 'No gamepads connected. Use keyboard controls (Arrow keys for Player 1, WASD for Player 2)';
		statusEl.className = 'text-center text-sm text-gray-600';
	}
}

export function updateScoreDisplay(players) {
	const player1ScoreEl = document.getElementById('player1-score');
	const player2ScoreEl = document.getElementById('player2-score');
	
	if (player1ScoreEl) {
		if (players[0].character) {
			const playerName = CHARACTER_DATA[players[0].character]?.playerName || 'Player 1';
			player1ScoreEl.textContent = `${playerName}: ${players[0].score || 0}`;
			player1ScoreEl.style.display = 'block';
		} else {
			player1ScoreEl.style.display = 'none';
		}
	}
	
	if (player2ScoreEl) {
		if (players[1].character) {
			const playerName = CHARACTER_DATA[players[1].character]?.playerName || 'Player 2';
			player2ScoreEl.textContent = `${playerName}: ${players[1].score || 0}`;
			player2ScoreEl.style.display = 'block';
		} else {
			player2ScoreEl.style.display = 'none';
		}
	}
}


