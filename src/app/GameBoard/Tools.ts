import {Robot} from "./Robot";

export class RobotDebug {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    robot: Robot;
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 72;
        this.canvas.height = 400;
        this.ctx = this.canvas.getContext("2d");
    }
    updateRobot(robot: Robot) {
        this.robot = robot;


        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,72,100);
        this.ctx.setTransform(1, 0, 0, 1, 36, 36);
        this.ctx.rotate( this.robot.direction + Math.PI/2 );
        this.ctx.drawImage(this.robot.image, -this.robot.image.width / 2, -this.robot.image.height / 2);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        const leftColor = Math.round(this.robot.leftWheel * 255);
        const rightColor = Math.round(this.robot.rightWheel * 255);
        this.ctx.fillStyle = `rgba(${leftColor},${rightColor},0,255)`;
        this.ctx.fillRect(0, 100, 36, -50*this.robot.leftWheel);
        this.ctx.fillStyle = `rgba(${rightColor},${leftColor},0,255)`;
        this.ctx.fillRect(36, 100, 36, -50*this.robot.rightWheel);
    }
    drawImage(image: ImageData) {
        const oldData = this.ctx.getImageData(0,100,image.width,this.canvas.height);
        this.ctx.clearRect(0,100,image.width,this.canvas.height);
        const centerOffset = Math.round((this.canvas.width / 2) - (image.width / 2));
        this.ctx.putImageData(image, centerOffset, 100);
        this.ctx.putImageData(oldData, 0, 101);
    }
}