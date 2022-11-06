import type { MapCell, MapCellOptions, MapRobot, MapRobotOptions } from "../../typings/map.d";
import { DEG_90, DEG_360 } from "../../constants";

export class Robot {
    image: HTMLImageElement;

    leftWheel: number;
    rightWheel: number;

    direction: number; // 0 - (Math.PI * 2)
    speed: number;
    x: number;
    y: number;
    trackIds: number[];

    constructor(imageUrl: string) {
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

    calculateLineData(lineImage: ImageData) {
        let leftSpeed = -1;
        let rightSpeed = -1;
        let leftBias = -1;
        let rightBias = -1;
        const halfLength = lineImage.width / 2;
        for(let i=0; i < halfLength; i++) {
            const leftIndex = (halfLength-1) - i;
            const gLeft = lineImage.data[(leftIndex*4)+1];
            if(gLeft === 0 || this.trackIds.indexOf(gLeft) !== -1) {
                if(lineImage.data[(leftIndex*4)+3] > 0) {
                    leftBias = leftIndex;
                }
            }

            const rightIndex = halfLength + i;
            const gRight = lineImage.data[(rightIndex*4)+1];
            if(gRight === 0 || this.trackIds.indexOf(gRight) !== -1) {
                if(lineImage.data[(rightIndex*4)+3] > 0) {
                    rightBias = rightIndex;
                }
            }
            if(leftBias !== -1 || rightBias !== -1) {
                break;
            }
        }

        if(leftBias === -1) {
            leftBias = rightBias;
            // set left bias to right bias, then travel right till end and set to right bias
        } else if(rightBias === -1) {
            rightBias = leftBias;
            // set right bias to left bias, then travel left till end and set to left bias
        }

        while(leftBias > 0) {
            if(lineImage.data[(leftBias*4)+3] === 0) {
                leftBias++;
                break;
            }
            leftBias--;
        }

        while(rightBias < lineImage.width-1) {
            if(lineImage.data[(rightBias*4)+3] === 0) {
                rightBias--;
                break;
            }
            rightBias++;
        }

        let speedBias = -1;
        for(let i = leftBias;i <= rightBias;i++) {
            speedBias = Math.max(speedBias, lineImage.data[(i*4)]);
        }

        if(speedBias > 0) {
            this.speed = speedBias / 255;
        }

        const distortion = rightBias - leftBias; // Higher distortion, the sharper we should turn, unless distortion > halfWidth
        if(distortion > halfLength) {
            // distortion above threshold just go straight
            this.leftWheel = 0.1 * 0.5;
            this.rightWheel = 0.1 * 0.5;
        } else {
            const centerIndex = leftBias + ((rightBias - leftBias) / 2);
            const percentCenter = Math.abs(centerIndex / lineImage.width);
            const rightPercent = 1 - percentCenter;
            const leftPercent = percentCenter;
            this.leftWheel = 0.3 * leftPercent;
            this.rightWheel = 0.3 * rightPercent;
        }
    }

    calculateNextPosition() {
        // calculate distance to travel based off left/right wheel speeds
        const distance = (this.leftWheel < this.rightWheel ? this.leftWheel : this.rightWheel);

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
        this.x += directionCos * ((50*this.speed) * (betaLength/2));
        this.y += directionSin * ((50*this.speed) * (betaLength/2));

        // distance is most relative to current speed
        this.x += directionCos * ((50*this.speed) * distance);
        this.y += directionSin * ((50*this.speed) * distance);
    }
}