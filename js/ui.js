// UI management
import { CHARACTER_DATA, CONFIG } from './config.js';
import gameState from './state.js';

export function updateCharacterSelectionUI() {
	[0, 1].forEach(playerIndex => {
		const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
		if (buttonContainer) {
			buttonContainer.innerHTML = '';
			
			Object.values(CHARACTER_DATA).forEach(char => {
				const button = document.createElement('button');
				button.onclick = () => window.selectCharacter(playerIndex, char.id);
				button.setAttribute('data-character', char.id);
				
				const isAvailable = CONFIG.availableCharacters.includes(char.id);
				
				const img = document.createElement('img');
				img.src = char.image;
				img.alt = char.playerName;
				img.className = 'w-24 h-24 object-contain';
				
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

export function updateCharacterButtons(players) {
	players.forEach((player, playerIndex) => {
		const buttonContainer = document.getElementById(`player${playerIndex + 1}-buttons`);
		if (buttonContainer) {
			const buttons = buttonContainer.querySelectorAll('.character-btn');
			buttons.forEach((btn) => {
				const charName = btn.getAttribute('data-character');
				if (charName === player.character) {
					btn.classList.remove('border-transparent', 'hover:border-purple-400');
					btn.classList.add('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
				} else {
					btn.classList.remove('border-yellow-400', 'border-8', 'scale-125', 'shadow-2xl', 'ring-4', 'ring-yellow-300');
					if (!btn.disabled) {
						btn.classList.add('border-transparent', 'hover:border-purple-400');
					}
				}
			});
		}
	});
}

export function updateSelectedDisplay(players) {
	// Player 1
	const player1Selected = document.getElementById('player1-selected');
	const player1Box = document.getElementById('player1-box');
	const player1Title = document.getElementById('player1-title');
	
	if (player1Selected) {
		const charData = players[0].character ? CHARACTER_DATA[players[0].character] : null;
		player1Selected.textContent = charData 
			? `✓ ${charData.playerName} selected!`
			: 'Tap a character!';
		player1Selected.className = charData 
			? 'text-lg font-semibold text-blue-700 mb-2'
			: 'text-lg font-semibold text-gray-600 mb-2';
	}
	
	if (player1Box && player1Title) {
		const charData = players[0].character ? CHARACTER_DATA[players[0].character] : null;
		if (charData) {
			player1Box.className = 'border-4 border-blue-400 rounded-lg p-4 bg-blue-50 transition-all';
			player1Title.className = 'font-bold text-blue-600 mb-4 text-2xl text-center';
		} else {
			player1Box.className = 'border-4 border-gray-300 rounded-lg p-4 bg-gray-50 transition-all';
			player1Title.className = 'font-bold text-gray-600 mb-4 text-2xl text-center';
		}
	}
	
	// Player 2
	const player2Selected = document.getElementById('player2-selected');
	const player2Box = document.getElementById('player2-box');
	const player2Title = document.getElementById('player2-title');
	
	if (player2Selected) {
		const charData = players[1].character ? CHARACTER_DATA[players[1].character] : null;
		player2Selected.textContent = charData 
			? `✓ ${charData.playerName} selected!`
			: 'Tap a character!';
		player2Selected.className = charData 
			? 'text-lg font-semibold text-green-700 mb-2'
			: 'text-lg font-semibold text-gray-600 mb-2';
	}
	
	if (player2Box && player2Title) {
		const charData = players[1].character ? CHARACTER_DATA[players[1].character] : null;
		if (charData) {
			player2Box.className = 'border-4 border-green-400 rounded-lg p-4 bg-green-50 transition-all';
			player2Title.className = 'font-bold text-green-600 mb-4 text-2xl text-center';
		} else {
			player2Box.className = 'border-4 border-gray-300 rounded-lg p-4 bg-gray-50 transition-all';
			player2Title.className = 'font-bold text-gray-600 mb-4 text-2xl text-center';
		}
	}
}

export function updateStartButton(players) {
	const startButton = document.getElementById('start-button');
	const atLeastOneSelected = players[0].character || players[1].character;
	if (startButton) {
		startButton.disabled = !atLeastOneSelected;
	}
}

export function updateCountdownDisplay(countdown) {
	const countdownEl = document.getElementById('selection-countdown');
	if (countdownEl) {
		if (countdown.active && countdown.time > 0) {
			countdownEl.textContent = `Game starting in ${countdown.time}...`;
			countdownEl.classList.remove('hidden');
			countdownEl.classList.add('text-red-600', 'font-bold', 'text-xl');
		} else {
			countdownEl.classList.add('hidden');
		}
	}
}

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
		} else {
			player1ScoreEl.textContent = 'Select character';
		}
	}
	
	if (player2ScoreEl) {
		if (players[1].character) {
			const playerName = CHARACTER_DATA[players[1].character]?.playerName || 'Player 2';
			player2ScoreEl.textContent = `${playerName}: ${players[1].score || 0}`;
		} else {
			player2ScoreEl.textContent = 'Select character';
		}
	}
}


