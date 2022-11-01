import robotImageUrl from "../assets/robot.png";

const fullRads = Math.PI * 2;
const quarterRads = Math.PI / 2;

export class Robot {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;



    wheelBaseDistance: number;
    leftWheel: number;
    rightWheel: number;

    direction: number; // 0 - (Math.PI * 2)
    x: number;
    y: number;

    constructor(canvas: HTMLCanvasElement) {
        this.direction = 0;
        this.leftWheel = 0;
        this.rightWheel = 0;

        this.canvas = canvas;
        this.image = new Image();

        this.image.onload = () => {
            // this.canvas.width = this.image.width;
            // this.canvas.height = this.image.height;

            this.ctx = this.canvas.getContext("2d");
            this.x = this.canvas.width/2;
            this.y = this.canvas.height/2;
            this.leftWheel = 0.56;
            this.rightWheel = 0.6;
        }
        this.image.src = robotImageUrl;
    }

    getLineCords() {
        const directionCos = Math.cos(this.direction);
        const directionSin = Math.sin(this.direction);

        const centerX = this.x + directionCos * 24;
        const centerY = this.y + directionSin * 24;

        const startRads = this.direction - quarterRads;
        const endRads = this.direction + quarterRads;

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

    renderFrame() {
        const betaLength = Math.abs(this.leftWheel - this.rightWheel);
        const distance = (this.leftWheel < this.rightWheel ? this.leftWheel : this.rightWheel);
        const angle = Math.atan(betaLength / 1);
        this.direction += this.leftWheel < this.rightWheel ? -angle : angle;

        if(this.direction < 0) {
            this.direction += fullRads;
        } else if(this.direction > fullRads) {
            this.direction -= fullRads;
        }

        const directionCos = Math.cos(this.direction);
        const directionSin = Math.sin(this.direction);

        this.x += directionCos * (24 * (betaLength/2));
        this.y += directionSin * (24 * (betaLength/2));

        this.x += directionCos * (24 * distance);
        this.y += directionSin * (24 * distance);

        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.setTransform(1, 0, 0, 1, this.x, this.y);
        this.ctx.rotate( this.direction + Math.PI/2 );
        this.ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
        // calculate rotation based off difference in left/right wheel speeds
        // rotate canvas object
        // add rotation to direction
        // calculate distance to travel based off left/right wheel speeds
        // calculate x/y translation based off direction rads and distance


    }
}