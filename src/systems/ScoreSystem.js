/**
 * ScoreSystem - Manages score tracking and time
 */
export class ScoreSystem {
    score = 0;
    time = 0; // Time in frames (60fps)
    isRunning = false;
    // Scoring constants
    RING_POINTS = 10;
    ENEMY_POINTS = 100;
    CHECKPOINT_POINTS = 500;
    constructor() {
        this.reset();
    }
    /**
     * Start the timer
     */
    start() {
        this.isRunning = true;
    }
    /**
     * Stop the timer
     */
    stop() {
        this.isRunning = false;
    }
    /**
     * Update timer (call every frame)
     */
    update(delta) {
        if (this.isRunning) {
            this.time += delta;
        }
    }
    /**
     * Get time in seconds
     */
    getTimeInSeconds() {
        return Math.floor(this.time / 60);
    }
    /**
     * Get formatted time string (M:SS)
     */
    getFormattedTime() {
        const totalSeconds = this.getTimeInSeconds();
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    /**
     * Get current score
     */
    getScore() {
        return this.score;
    }
    /**
     * Add points for ring collection
     */
    addRingPoints() {
        this.score += this.RING_POINTS;
    }
    /**
     * Add points for enemy defeat
     */
    addEnemyPoints() {
        this.score += this.ENEMY_POINTS;
    }
    /**
     * Add points for checkpoint
     */
    addCheckpointPoints() {
        this.score += this.CHECKPOINT_POINTS;
    }
    /**
     * Add custom points
     */
    addPoints(points) {
        this.score += points;
    }
    /**
     * Calculate time bonus based on completion time
     * Sonic 1 formula: 50,000 bonus for under 30 seconds, decreasing by time
     */
    calculateTimeBonus() {
        const seconds = this.getTimeInSeconds();
        if (seconds < 30)
            return 50000;
        else if (seconds < 45)
            return 10000;
        else if (seconds < 60)
            return 5000;
        else if (seconds < 90)
            return 4000;
        else if (seconds < 120)
            return 3000;
        else if (seconds < 180)
            return 2000;
        else if (seconds < 240)
            return 1000;
        else if (seconds < 300)
            return 500;
        else
            return 0;
    }
    /**
     * Calculate ring bonus (100 points per ring at level end)
     */
    calculateRingBonus(rings) {
        return rings * 100;
    }
    /**
     * Reset score and time
     */
    reset() {
        this.score = 0;
        this.time = 0;
        this.isRunning = false;
    }
    /**
     * Reset time only (for respawn)
     */
    resetTime() {
        this.time = 0;
    }
    /**
     * Get raw time in frames
     */
    getRawTime() {
        return this.time;
    }
}
