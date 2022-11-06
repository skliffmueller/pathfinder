export class PathMap {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    constructor(canvas: HTMLCanvasElement, imageUrl: string) {
        this.canvas = canvas;

        this.canvas.width = 800;
        this.canvas.height = 600;

        this.ctx = this.canvas.getContext("2d");

        this.image = new Image();

        this.image.onload = () => {
            this.ctx.drawImage(this.image, 0, 0);
        }
        this.image.src = imageUrl;
    }
    readLine(startX: number, startY: number, endX: number, endY: number): ImageData {
        const cropX = startX < endX ? startX : endX;
        const cropY = startY < endY ? startY : endY;
        const cropW = Math.abs(startX - endX | 1);
        const cropH = Math.abs(startY - endY | 1);

        const alphaPolarity = startX > endX ? -1 : 1;
        const betaPolarity = startY > endY ? -1 : 1;

        const distance = PathMap.distanceFormula(startX, startY, endX, endY);

        const clipImage = this.ctx.getImageData(cropX, cropY, cropW, cropH);
        const lineImage = this.ctx.createImageData(distance, 1);

        for(let i = 0;i < distance;i++) {
            const lineIndex = i * 4;

            const baseX = Math.floor((i / distance) * cropW);
            const baseY = Math.floor((i / distance) * cropH);

            const pixelX = alphaPolarity === 1 ? baseX : (cropW - 1) - baseX;
            const pixelY = betaPolarity === 1 ? baseY : (cropH - 1) - baseY;

            const pixelIndex = (pixelX + (pixelY * cropW)) * 4;

            lineImage.data[lineIndex] = clipImage.data[pixelIndex];
            lineImage.data[lineIndex+1] = clipImage.data[pixelIndex+1];
            lineImage.data[lineIndex+2] = clipImage.data[pixelIndex+2];
            lineImage.data[lineIndex+3] = clipImage.data[pixelIndex+3];
        }

        return lineImage;
    }
    static distanceFormula(xOne: number, yOne: number, xTwo: number, yTwo: number): number {
        return Math.round(Math.sqrt(Math.pow(xTwo - xOne, 2) + Math.pow(yTwo - yOne, 2)));
    }
}