// Configuration loading and management
let CONFIG = {
	characterSize: 200,
	prizeSize: 50,
	moveSpeed: 10,
	gamepadPollInterval: 10,
	availableCharacters: [],
};

let CHARACTER_DATA = {};

export async function loadConfig() {
	try {
		const response = await fetch('config.json');
		const config = await response.json();
		
		// Update CONFIG with game settings
		CONFIG.characterSize = config.gameSettings.characterSize || 200;
		CONFIG.prizeSize = config.gameSettings.prizeSize || 50;
		CONFIG.moveSpeed = config.gameSettings.moveSpeed || 10;
		CONFIG.numPrizes = config.gameSettings.numPrizes || 5;
		
		// Build character data map
		config.characters.forEach(char => {
			CHARACTER_DATA[char.id] = char;
		});
		
		return { config: CONFIG, characterData: CHARACTER_DATA };
	} catch (error) {
		console.error('Error loading config:', error);
		return { config: CONFIG, characterData: CHARACTER_DATA };
	}
}

export async function loadCharacterImages() {
	const promises = Object.values(CHARACTER_DATA).map(char => {
		return new Promise((resolve) => {
			const img = new Image();
			img.id = char.id;
			img.src = char.image;
			img.alt = char.playerName;
			img.onload = () => {
				const existing = document.getElementById(char.id);
				if (!existing) {
					let container = document.querySelector('div[style*="display:none"]');
					if (!container) {
						container = document.createElement('div');
						container.style.display = 'none';
						document.body.appendChild(container);
					}
					container.appendChild(img);
				}
				resolve({ success: true, char });
			};
			img.onerror = () => {
				console.warn(`Character image ${char.image} not found for ${char.playerName}`);
				resolve({ success: false, char });
			};
		});
	});
	
	const results = await Promise.all(promises);
	const availableChars = results.filter(r => r.success).map(r => r.char.id);
	CONFIG.availableCharacters = availableChars;
	
	return availableChars;
}

export async function loadPrizeImages() {
	const prizeImages = {};
	const prizeTypes = new Set();
	Object.values(CHARACTER_DATA).forEach(char => {
		// Only add prize if it exists (some characters might not have prize image)
		if (char.prize) {
			prizeTypes.add(char.prize);
		}
	});
	
	const promises = Array.from(prizeTypes).filter(prizeFile => prizeFile).map(prizeFile => {
		return new Promise((resolve) => {
			const img = new Image();
			const prizeId = prizeFile.replace('.png', '');
			img.id = `prize-${prizeId}`;
			img.src = prizeFile;
			img.onload = () => {
				prizeImages[prizeId] = img;
				const existing = document.getElementById(`prize-${prizeId}`);
				if (!existing) {
					const container = document.querySelector('div[style*="display:none"]') || document.body;
					container.appendChild(img);
				}
				resolve();
			};
			img.onerror = () => {
				console.warn(`Prize image ${prizeFile} not found, using heart as fallback`);
				if (!prizeImages['heart']) {
					const heartImg = document.getElementById('heart');
					if (heartImg) {
						prizeImages[prizeId] = heartImg;
					}
				}
				resolve();
			};
		});
	});
	
	await Promise.all(promises);
	return prizeImages;
}

export { CONFIG, CHARACTER_DATA };

