// Prize Class
export class Prize {
	constructor(x, y, type, prizeImage) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.prizeImage = prizeImage;
		// Prize lifetime: 10-15 seconds (random)
		this.lifetime = 10000 + Math.random() * 5000; // 10-15 seconds in milliseconds
		this.spawnTime = Date.now();
		this.isExpired = false;
	}
	
	getRemainingTime() {
		const elapsed = Date.now() - this.spawnTime;
		return Math.max(0, this.lifetime - elapsed);
	}
	
	getTimeRemainingPercent() {
		return this.getRemainingTime() / this.lifetime;
	}
	
	update() {
		if (this.getRemainingTime() <= 0) {
			this.isExpired = true;
		}
	}
	
	shouldThrob() {
		const remaining = this.getRemainingTime();
		// Throb in last 3-5 seconds
		return remaining <= 5000 && remaining > 0;
	}
	
	getThrobScale() {
		if (!this.shouldThrob()) return 1;
		const remaining = this.getRemainingTime();
		const throbTime = 5000 - remaining; // 0 to 5000ms
		// Pulse between 0.7 and 1.0
		return 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(throbTime / 100));
	}
}

