// Player Class
import { CHARACTER_DATA, CONFIG } from './config.js';

export class Player {
	constructor(id, startX, startY, color) {
		this.id = id;
		this.x = startX;
		this.y = startY;
		this.color = color;
		this.character = null;
		this.score = 0;
		this.gamepadIndex = null;
		this.keys = {
			left: false,
			right: false,
			up: false,
			down: false,
		};
	}

	setCharacter(name) {
		if (CHARACTER_DATA[name] && CONFIG.availableCharacters.includes(name)) {
			this.character = name;
			return true;
		}
		return false;
	}

	getCharacterData() {
		return CHARACTER_DATA[this.character] || null;
	}

	getPrizeType() {
		const data = this.getCharacterData();
		return data ? data.prizeType : 'heart';
	}

	getPlayerName() {
		const data = this.getCharacterData();
		return data ? data.playerName : 'Player';
	}

	move(dx, dy, canvasWidth, canvasHeight) {
		this.x += dx;
		this.y += dy;
		this.checkBounds(canvasWidth, canvasHeight);
	}

	checkBounds(canvasWidth, canvasHeight) {
		if (this.x < 0) this.x = canvasWidth;
		if (this.x > canvasWidth) this.x = 0;
		if (this.y < 0) this.y = canvasHeight;
		if (this.y > canvasHeight) this.y = 0;
	}

	checkPrizeCollision(prizeX, prizeY) {
		const charWidth = CONFIG.characterSize;
		const charHeight = CONFIG.characterSize;
		const prizeSize = CONFIG.prizeSize;

		return (
			prizeX < this.x + charWidth &&
			prizeX + prizeSize > this.x &&
			prizeY < this.y + charHeight &&
			prizeY + prizeSize > this.y
		);
	}
}

