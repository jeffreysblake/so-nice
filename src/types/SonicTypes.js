/**
 * Type definitions for Sonic game objects
 */
export var PlayerState;
(function (PlayerState) {
    PlayerState["IDLE"] = "idle";
    PlayerState["WALKING"] = "walking";
    PlayerState["RUNNING"] = "running";
    PlayerState["JUMPING"] = "jumping";
    PlayerState["ROLLING"] = "rolling";
    PlayerState["SPINDASH"] = "spindash";
    PlayerState["HURT"] = "hurt";
    PlayerState["DEAD"] = "dead";
})(PlayerState || (PlayerState = {}));
export var GroundMode;
(function (GroundMode) {
    GroundMode[GroundMode["FLOOR"] = 0] = "FLOOR";
    GroundMode[GroundMode["RIGHT_WALL"] = 1] = "RIGHT_WALL";
    GroundMode[GroundMode["CEILING"] = 2] = "CEILING";
    GroundMode[GroundMode["LEFT_WALL"] = 3] = "LEFT_WALL";
})(GroundMode || (GroundMode = {}));
