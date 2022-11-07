import type { MapCell, MapCellOptions, MapRobot, MapRobotOptions } from "../../typings/map.d";
import { DEG_90, DEG_360 } from "../../constants";

type RobotDetectionPaths = {
    startIndex: number;
    endIndex: number;
    percentCenter: number;
    trackId: number;
    speed: number;
}

export class Robot {
    image: HTMLImageElement;

    leftWheel: number;
    rightWheel: number;

    lastCenterIndex: number;
    direction: number; // 0 - (Math.PI * 2)
    speed: number;
    x: number;
    y: number;
    trackIds: number[];

    constructor(imageUrl: string) {
        this.lastCenterIndex = -1;
        this.direction = 0;
        this.leftWheel = 0;
        this.rightWheel = 0;
        this.leftWheel = 0.0;
        this.rightWheel = 0.0;
        this.speed = 0.5;
        this.trackIds = [];
        this.image = new Image();
        this.image.src = imageUrl;
    }

    getLineCords() {
        const directionCos = Math.cos(this.direction);
        const directionSin = Math.sin(this.direction);

        const centerX = this.x + directionCos * 24;
        const centerY = this.y + directionSin * 24;

        const startRads = this.direction - DEG_90;
        const endRads = this.direction + DEG_90;

        const startX = (Math.cos(startRads) * 24) + centerX;
        const startY = (Math.sin(startRads) * 24) + centerY;

        const endX = (Math.cos(endRads) * 24) + centerX;
        const endY = (Math.sin(endRads) * 24) + centerY;

        return {
            startX,
            startY,
            endX,
            endY,
        }
    }

    _findPaths(lineImage: ImageData): RobotDetectionPaths[] {
        const detectionPaths: RobotDetectionPaths[] = [];
        let detectionPath:RobotDetectionPaths = null;
        for(let x=0;x < lineImage.width;x++) {
            const i = x * 4;
            if(lineImage.data[i+3] > 0) {
                const trackId = lineImage.data[i+1];

                if(detectionPath && trackId !== detectionPath.trackId) {
                    detectionPath.endIndex = x;
                    detectionPaths.push({...detectionPath});
                    detectionPath = null;
                }
                if(!detectionPath && (trackId === 0 || this.trackIds.indexOf(trackId) !== -1)) {
                    detectionPath = {
                        startIndex: x,
                        endIndex: -1,
                        percentCenter: -1,
                        trackId,
                        speed: -1,
                    }
                }
            } else if(detectionPath) {
                detectionPath.endIndex = x;
                detectionPaths.push({...detectionPath});
                detectionPath = null;
            }
        }

        if(detectionPath) {
            detectionPath.endIndex = lineImage.width - 1;
            detectionPaths.push({...detectionPath});
            detectionPath = null;
        }

        return detectionPaths.map((path) => {
            const diff = path.endIndex - path.startIndex;
            const adjWidth = lineImage.width - diff;
            path.percentCenter = (path.startIndex - 1) / adjWidth;


            const speeds = [];
            for(let x=path.startIndex;x <= path.endIndex;x++) {
                const i = x * 4;
                speeds.push(lineImage.data[i]);
            }
            path.speed = Math.max.apply(null, speeds);
            return path;
        });
    }

    calculateLineData(lineImage: ImageData) {
        const robotPaths = this._findPaths(lineImage);

        const centerPath = robotPaths.length ? robotPaths.sort((a, b) => {
            if(a.trackId > b.trackId) {
                return -1;
            } else if(a.trackId < b.trackId) {
                return 1;
            }

            return Math.abs(a.percentCenter - this.lastCenterIndex) - Math.abs(b.percentCenter - this.lastCenterIndex);
        })[0] : null;
        if(centerPath) {

            const { startIndex, endIndex, percentCenter, speed } = centerPath;
            if(percentCenter > 0 && percentCenter < 1) {

                this.lastCenterIndex = percentCenter;
                if(speed > 0) {
                    this.speed = speed / 255;
                }

                this.leftWheel = Math.sin(DEG_90 * percentCenter);
                this.rightWheel = Math.sin(DEG_90 * (1-percentCenter));
            }else{console.log(percentCenter)}

        }
    }

    calculateNextPosition() {
        // calculate distance to travel based off left/right wheel speeds
        const distance = (
            this.leftWheel < this.rightWheel
                ? this.leftWheel
                : this.rightWheel
        );
        // calculate rotation based off difference in left/right wheel speeds
        const betaLength = Math.abs(this.leftWheel - this.rightWheel);
        const angle = Math.atan(betaLength);
        this.direction += this.leftWheel < this.rightWheel ? -angle : angle;

        if(this.direction < 0) {
            this.direction += DEG_360;
        } else if(this.direction > DEG_360) {
            this.direction -= DEG_360;
        }

        const directionCos = Math.cos(this.direction);
        const directionSin = Math.sin(this.direction);

        // Rotation pivot points are at the wheels, so the center x/y coord will shift some distance on rotation
        this.x += directionCos * ((25*this.speed) * betaLength);
        this.y += directionSin * ((25*this.speed) * betaLength);

        // distance is most relative to current speed
        this.x += directionCos * ((25*this.speed) * distance);
        this.y += directionSin * ((25*this.speed) * distance);
    }
}