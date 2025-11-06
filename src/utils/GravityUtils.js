import { GroundMode } from '../types/SonicTypes';
import { PhysicsConstants } from '../config/PhysicsConstants';
/**
 * Gravity utilities for handling 360-degree movement
 */
export class GravityUtils {
    /**
     * Determine gravity mode based on ground angle
     */
    static getGravityModeFromAngle(angle) {
        // Normalize angle to 0-360
        const normalizedAngle = ((angle % 360) + 360) % 360;
        // Floor mode: 315° - 360° and 0° - 45°
        if (normalizedAngle >= PhysicsConstants.MODE_FLOOR_MIN ||
            normalizedAngle <= PhysicsConstants.MODE_FLOOR_MAX) {
            return GroundMode.FLOOR;
        }
        // Right wall mode: 45° - 135°
        if (normalizedAngle > PhysicsConstants.MODE_RWALL_MIN &&
            normalizedAngle <= PhysicsConstants.MODE_RWALL_MAX) {
            return GroundMode.RIGHT_WALL;
        }
        // Ceiling mode: 135° - 225°
        if (normalizedAngle > PhysicsConstants.MODE_CEILING_MIN &&
            normalizedAngle <= PhysicsConstants.MODE_CEILING_MAX) {
            return GroundMode.CEILING;
        }
        // Left wall mode: 225° - 315°
        return GroundMode.LEFT_WALL;
    }
    /**
     * Get the gravity direction vector for a given mode
     * Returns {x, y} where positive Y is down
     */
    static getGravityVector(mode) {
        switch (mode) {
            case GroundMode.FLOOR:
                return { x: 0, y: 1 }; // Down
            case GroundMode.RIGHT_WALL:
                return { x: -1, y: 0 }; // Left
            case GroundMode.CEILING:
                return { x: 0, y: -1 }; // Up
            case GroundMode.LEFT_WALL:
                return { x: 1, y: 0 }; // Right
        }
    }
    /**
     * Check if player should fall off based on speed and angle
     */
    static shouldFallOff(groundSpeed, groundAngle, mode) {
        // Insufficient speed to maintain adhesion (for loops/ceiling)
        if (mode === GroundMode.CEILING || mode === GroundMode.RIGHT_WALL || mode === GroundMode.LEFT_WALL) {
            if (Math.abs(groundSpeed) < PhysicsConstants.LOOP_SPEED_THRESHOLD) {
                return true;
            }
        }
        // Angle too steep for current mode
        const normalizedAngle = ((groundAngle % 360) + 360) % 360;
        switch (mode) {
            case GroundMode.FLOOR:
                // Fall if angle is too steep (> 70° from horizontal)
                if (normalizedAngle > PhysicsConstants.FALL_ANGLE &&
                    normalizedAngle < (360 - PhysicsConstants.FALL_ANGLE)) {
                    return true;
                }
                break;
            case GroundMode.RIGHT_WALL:
                // Fall if angle leaves wall range
                if (normalizedAngle < 30 || normalizedAngle > 150) {
                    return true;
                }
                break;
            case GroundMode.CEILING:
                // Fall if angle leaves ceiling range
                if (normalizedAngle < 120 || normalizedAngle > 240) {
                    return true;
                }
                break;
            case GroundMode.LEFT_WALL:
                // Fall if angle leaves wall range
                if (normalizedAngle < 210 || normalizedAngle > 330) {
                    return true;
                }
                break;
        }
        return false;
    }
    /**
     * Get sensor offsets for a given gravity mode
     */
    static getSensorOffsets(mode) {
        const height = PhysicsConstants.SENSOR_HEIGHT;
        switch (mode) {
            case GroundMode.FLOOR:
                return {
                    primary: { x: 0, y: height }, // Ground sensors below
                    secondary: { x: 0, y: -height }, // Ceiling sensors above
                };
            case GroundMode.RIGHT_WALL:
                return {
                    primary: { x: height, y: 0 }, // Right side sensors
                    secondary: { x: -height, y: 0 }, // Left side sensors
                };
            case GroundMode.CEILING:
                return {
                    primary: { x: 0, y: -height }, // Ceiling sensors above (now ground)
                    secondary: { x: 0, y: height }, // Ground sensors below (now ceiling)
                };
            case GroundMode.LEFT_WALL:
                return {
                    primary: { x: -height, y: 0 }, // Left side sensors
                    secondary: { x: height, y: 0 }, // Right side sensors
                };
        }
    }
}
