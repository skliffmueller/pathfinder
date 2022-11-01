export class Line {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
    }
    drawImage(image: ImageData) {
        const oldData = this.ctx.getImageData(0,0,image.width,this.canvas.height);
        this.ctx.clearRect(0,0,image.width,this.canvas.height);
        this.ctx.putImageData(image, 0, 0);
        this.ctx.putImageData(oldData, 0, 1);
    }
    drawSpeeds(leftWheel: number, rightWheel: number) {
        this.ctx.clearRect(48,0,100, this.canvas.height);
        const leftColor = Math.round(leftWheel * 255);
        const rightColor = Math.round(rightWheel * 255);
        this.ctx.fillStyle = `rgba(${leftColor},${rightColor},0,255)`;
        this.ctx.fillRect(48, 100, 50, -100*leftWheel);
        this.ctx.fillStyle = `rgba(${rightColor},${leftColor},0,255)`;
        this.ctx.fillRect(98, 100, 50, -100*rightWheel);
    }
}