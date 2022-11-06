import { Robot } from "./Robot";
import {MapRobot} from "../../typings/map";
import {RobotEvent, RobotItem} from "../MapEditor/RobotList";
import {DEG_180, DEG_90} from "../../constants";

export class RobotDebug extends Robot {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(imageUrl: string) {
        super(imageUrl);
        this.canvas = document.createElement('canvas');
        this.canvas.width = 260;
        this.canvas.height = 72;
        this.ctx = this.canvas.getContext("2d");
    }
    calculateLineData(lineImage: ImageData) {
        super.calculateLineData(lineImage);
        this.drawImage(lineImage);
    }
    calculateNextPosition() {
        super.calculateNextPosition();
        this.updateRobot();
    }

    updateRobot() {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,84,72);
        this.ctx.setTransform(1, 0, 0, 1, 36, 36);
        this.ctx.rotate( this.direction + Math.PI/2 );
        this.ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        const rColor = Math.round(Math.sin(this.speed * DEG_90) * 255);
        const gColor = Math.round(Math.cos(this.speed * DEG_90) * 255);
        this.ctx.fillStyle = `rgba(${rColor},${gColor},0,255)`;
        this.ctx.fillRect(72, this.canvas.height, 12, -this.canvas.height*this.speed);
    }
    drawImage(image: ImageData) {
        this.ctx.setTransform(1,0,0,1,0,0);
        const flipImage = this.ctx.createImageData(image.height, image.width);
        for(let i = 0; i < flipImage.data.length;i++) {
            flipImage.data[i] = image.data[i];
        }
        const oldData = this.ctx.getImageData(84,0, this.canvas.width, flipImage.height);
        this.ctx.clearRect(84,0, this.canvas.width, flipImage.height);
        const centerOffset = Math.round((this.canvas.height / 2) - (flipImage.height / 2));
        this.ctx.putImageData(flipImage, 84, centerOffset);
        this.ctx.putImageData(oldData, 85, 0);
    }
}

export class RobotStatus {
    rootElement: HTMLDivElement;
    constructor(robots: RobotDebug[]) {
        this.rootElement = document.createElement('div');
        robots.forEach(robot => {
            this.rootElement.appendChild(robot.canvas);
        })

    }
}