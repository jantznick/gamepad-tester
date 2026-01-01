// Game mode management
import gameState from './state.js';
import { updateScoreDisplay } from './ui.js';
import { CHARACTER_DATA } from './config.js';

let gameTimerInterval = null;

export function selectGameMode(mode) {
	gameState.updateState('gameMode', mode);
	
	// Update UI to show selected mode
	const buttons = document.querySelectorAll('.game-mode-btn');
	buttons.forEach(btn => {
		if (btn.getAttribute('data-mode') === mode) {
			btn.classList.remove('border-transparent');
			btn.classList.add('border-yellow-400', 'border-4', 'scale-110');
		} else {
			btn.classList.remove('border-yellow-400', 'border-4', 'scale-110');
			btn.classList.add('border-transparent');
		}
	});
}

export function initGameMode() {
	const state = gameState.getState();
	const container = document.getElementById('game-mode-ui-container');
	const timerEl = document.getElementById('game-timer');
	const raceEl = document.getElementById('race-progress');
	
	// Hide all mode-specific UI
	timerEl.classList.add('hidden');
	raceEl.classList.add('hidden');
	document.getElementById('game-over-overlay').classList.add('hidden');
	
	if (state.gameMode === 'countdown') {
		// Show container and timer
		container.classList.remove('hidden');
		timerEl.classList.remove('hidden');
		// Start countdown timer
		gameState.updateState('gameTimer', {
			time: 60,
			startTime: Date.now()
		});
		startGameTimer();
	} else if (state.gameMode === 'race') {
		// Show container and race progress bars
		container.classList.remove('hidden');
		raceEl.classList.remove('hidden');
		updateRaceProgress();
	} else {
		// Free play mode - hide the entire container
		container.classList.add('hidden');
	}
}

function startGameTimer() {
	const timerEl = document.getElementById('game-timer');
	timerEl.classList.remove('hidden');
	
	gameTimerInterval = setInterval(() => {
		const state = gameState.getState();
		const elapsed = (Date.now() - state.gameTimer.startTime) / 1000;
		const remaining = Math.max(0, 60 - elapsed);
		
		timerEl.textContent = Math.ceil(remaining);
		
		if (remaining <= 0) {
			clearInterval(gameTimerInterval);
			endGame('countdown');
		}
	}, 100);
}

export function stopGameTimer() {
	if (gameTimerInterval) {
		clearInterval(gameTimerInterval);
		gameTimerInterval = null;
	}
}

export function updateRaceProgress() {
	const state = gameState.getState();
	if (state.gameMode !== 'race') return;
	
	const target = state.raceTarget || 15;
	
	const player1Progress = document.getElementById('player1-progress');
	const player2Progress = document.getElementById('player2-progress');
	
	if (player1Progress && state.players[0]) {
		const score = state.players[0].score || 0;
		const percent = Math.min(100, (score / target) * 100);
		player1Progress.style.width = `${percent}%`;
	}
	
	if (player2Progress && state.players[1]) {
		const score = state.players[1].score || 0;
		const percent = Math.min(100, (score / target) * 100);
		player2Progress.style.width = `${percent}%`;
	}
	
	// Check for winner
	if (state.players[0].score >= target) {
		endGame('race', 0);
	} else if (state.players[1].score >= target) {
		endGame('race', 1);
	}
}

export function endGame(reason, winnerIndex = null) {
	const state = gameState.getState();
	
	// Stop game timer if running
	stopGameTimer();
	
	// Update phase
	gameState.updateState('phase', 'ended');
	
	// Show game over overlay
	const overlay = document.getElementById('game-over-overlay');
	const title = document.getElementById('game-over-title');
	const scores = document.getElementById('game-over-scores');
	
	overlay.classList.remove('hidden');
	
	if (reason === 'race' && winnerIndex !== null) {
		const winner = state.players[winnerIndex];
		const winnerName = winner.character ? 
			CHARACTER_DATA[winner.character]?.playerName || 'Player' : 'Player';
		title.textContent = `${winnerName} Wins!`;
		title.className = winnerIndex === 0 ? 'text-4xl font-bold mb-4 text-blue-600' : 'text-4xl font-bold mb-4 text-green-600';
	} else if (reason === 'countdown') {
		// Determine winner by score
		const p1Score = state.players[0].score || 0;
		const p2Score = state.players[1].score || 0;
		
		if (p1Score > p2Score) {
			const p1Name = state.players[0].character ? 
				CHARACTER_DATA[state.players[0].character]?.playerName || 'Player 1' : 'Player 1';
			title.textContent = `${p1Name} Wins!`;
			title.className = 'text-4xl font-bold mb-4 text-blue-600';
		} else if (p2Score > p1Score) {
			const p2Name = state.players[1].character ? 
				CHARACTER_DATA[state.players[1].character]?.playerName || 'Player 2' : 'Player 2';
			title.textContent = `${p2Name} Wins!`;
			title.className = 'text-4xl font-bold mb-4 text-green-600';
		} else {
			title.textContent = 'Tie Game!';
			title.className = 'text-4xl font-bold mb-4 text-purple-600';
		}
	}
	
	// Show scores
	const p1Name = state.players[0].character ? 
		CHARACTER_DATA[state.players[0].character]?.playerName || 'Player 1' : 'Player 1';
	const p2Name = state.players[1].character ? 
		CHARACTER_DATA[state.players[1].character]?.playerName || 'Player 2' : 'Player 2';
	
	scores.innerHTML = `
		<div class="mb-2">${p1Name}: ${state.players[0].score || 0}</div>
		<div>${p2Name}: ${state.players[1].score || 0}</div>
	`;
}

// Make selectGameMode available globally
window.selectGameMode = selectGameMode;

