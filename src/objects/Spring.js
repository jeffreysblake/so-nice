import { GameObject } from './GameObject';
export var SpringType;
(function (SpringType) {
    SpringType["YELLOW"] = "yellow";
    SpringType["RED"] = "red";
})(SpringType || (SpringType = {}));
export var SpringOrientation;
(function (SpringOrientation) {
    SpringOrientation[SpringOrientation["UP"] = 0] = "UP";
    SpringOrientation[SpringOrientation["RIGHT"] = 90] = "RIGHT";
    SpringOrientation[SpringOrientation["DOWN"] = 180] = "DOWN";
    SpringOrientation[SpringOrientation["LEFT"] = 270] = "LEFT";
})(SpringOrientation || (SpringOrientation = {}));
/**
 * Spring object that bounces the player
 */
export class Spring extends GameObject {
    springType;
    orientation;
    bounceForce;
    graphics;
    isCompressed = false;
    compressionTimer = 0;
    constructor(scene, x, y, type = SpringType.YELLOW, orientation = SpringOrientation.UP) {
        super(scene, x, y);
        this.springType = type;
        this.orientation = orientation;
        // Set bounce force based on type
        this.bounceForce = type === SpringType.RED ? 16 : 10;
        // Create visual representation
        this.graphics = scene.add.graphics();
        this.add(this.graphics);
        this.drawSpring();
    }
    drawSpring() {
        this.graphics.clear();
        const color = this.springType === SpringType.RED ? 0xff0000 : 0xffff00;
        const height = this.isCompressed ? 8 : 16;
        this.graphics.fillStyle(color, 1);
        // Draw based on orientation
        switch (this.orientation) {
            case SpringOrientation.UP:
                this.graphics.fillRect(-16, -height, 32, height);
                // Draw spring coil
                this.graphics.fillStyle(0x666666, 1);
                for (let i = 0; i < 3; i++) {
                    this.graphics.fillRect(-14, -height + i * 4, 28, 2);
                }
                break;
            case SpringOrientation.RIGHT:
                this.graphics.fillRect(0, -16, height, 32);
                this.graphics.fillStyle(0x666666, 1);
                for (let i = 0; i < 3; i++) {
                    this.graphics.fillRect(i * 4, -14, 2, 28);
                }
                break;
            case SpringOrientation.DOWN:
                this.graphics.fillRect(-16, 0, 32, height);
                this.graphics.fillStyle(0x666666, 1);
                for (let i = 0; i < 3; i++) {
                    this.graphics.fillRect(-14, i * 4, 28, 2);
                }
                break;
            case SpringOrientation.LEFT:
                this.graphics.fillRect(-height, -16, height, 32);
                this.graphics.fillStyle(0x666666, 1);
                for (let i = 0; i < 3; i++) {
                    this.graphics.fillRect(-height + i * 4, -14, 2, 28);
                }
                break;
        }
    }
    checkPlayerCollision(playerX, playerY, playerRadius) {
        if (!this.isObjectActive)
            return false;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (playerRadius + 20);
    }
    onPlayerInteract(player) {
        if (!this.isObjectActive || this.isCompressed)
            return;
        // Apply bounce force based on orientation
        const angleRad = (this.orientation * Math.PI) / 180;
        player.physicsState.xVelocity = this.bounceForce * Math.sin(angleRad);
        player.physicsState.yVelocity = -this.bounceForce * Math.cos(angleRad);
        // Put player in air
        player.physicsState.isGrounded = false;
        player.physicsState.isJumping = true;
        // Lock controls briefly
        player.physicsState.controlLock = 16;
        // Compress spring visually
        this.isCompressed = true;
        this.compressionTimer = 10;
        this.drawSpring();
        console.log(`Spring bounce! Force: ${this.bounceForce}, Orientation: ${this.orientation}°`);
    }
    update(_time, _delta) {
        if (this.compressionTimer > 0) {
            this.compressionTimer--;
            if (this.compressionTimer === 0) {
                this.isCompressed = false;
                this.drawSpring();
            }
        }
    }
}
