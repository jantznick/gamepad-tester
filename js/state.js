// Simple state management system
class GameState {
	constructor() {
		this.state = {
			// Game phase: 'start', 'playing', 'paused'
			phase: 'start',
			
			// Players (with positions)
			players: [
				{ id: 0, character: null, score: 0, gamepadIndex: null, x: 100, y: 100 },
				{ id: 1, character: null, score: 0, gamepadIndex: null, x: 300, y: 100 }
			],
			
			// Selection countdown
			countdown: {
				active: false,
				time: 15,
				interval: null
			},
			
			// Gamepads
			gamepads: [],
			
			// Prizes
			prizes: [],
			
			// Config
			config: null,
			characterData: {},
			availableCharacters: []
		};
		
		this.listeners = [];
	}
	
	// Subscribe to state changes
	subscribe(callback) {
		this.listeners.push(callback);
		return () => {
			this.listeners = this.listeners.filter(l => l !== callback);
		};
	}
	
	// Notify all listeners
	notify() {
		this.listeners.forEach(listener => listener(this.state));
	}
	
	// Update state and notify
	setState(updates) {
		this.state = { ...this.state, ...updates };
		this.notify();
	}
	
	// Update nested state
	updateState(path, value) {
		const keys = path.split('.');
		let current = this.state;
		
		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}
		
		current[keys[keys.length - 1]] = value;
		this.notify();
	}
	
	// Get state
	getState() {
		return this.state;
	}
	
	// Get specific value
	get(path) {
		const keys = path.split('.');
		let current = this.state;
		
		for (const key of keys) {
			if (current === undefined || current === null) {
				return undefined;
			}
			current = current[key];
		}
		
		return current;
	}
}

// Export singleton instance
const gameState = new GameState();
export default gameState;

