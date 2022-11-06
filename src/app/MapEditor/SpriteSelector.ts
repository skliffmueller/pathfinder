import {
    SPRITE_WIDTH,
    SPRITE_HEIGHT,
} from "./index";

export type SpriteSelectorEvent = {
    x: number,
    y: number,
    index: number,
};

export class SpriteSelector {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    spriteWidth: number;
    spriteHeight: number;

    hoverIndex: number;

    selectedEvent: SpriteSelectorEvent;

    onClick: (event: SpriteSelectorEvent) => void;

    constructor(canvas: HTMLCanvasElement, onClick: (event: SpriteSelectorEvent) => void) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.onClick = onClick;
        this.canvas.addEventListener('mousedown', this._canvasOnClick);
        this.canvas.addEventListener('mousemove', this._canvasOnMove);
        this.canvas.addEventListener('mouseout', this._canvasOnOut);
        this.selectedEvent = {
            x: 0,
            y: 0,
            index: -1,
        };
    }
    setSpriteImage(imageUrl: string) {
        this.image = new Image();
        this.image.onload = () => {
            if((this.image.width % SPRITE_WIDTH) !== 0 || (this.image.height % SPRITE_HEIGHT) !== 0) {
                return;
            }

            this.spriteWidth = this.image.width / SPRITE_WIDTH;
            this.spriteHeight = this.image.height / SPRITE_HEIGHT;

            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;

            this.renderCanvas();
        }
        this.image.src = imageUrl;
    }
    _canvasOnClick = (event: MouseEvent) => {
        this.onClick(this.selectedEvent);
    }
    _canvasOnMove = (event: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const selectedEvent = {
            x: Math.floor((event.clientX - rect.left) / SPRITE_WIDTH),
            y: Math.floor((event.clientY - rect.top) / SPRITE_HEIGHT),
            index: -1,
        }
        selectedEvent.index = (selectedEvent.y * this.spriteWidth) + selectedEvent.x;

        if(selectedEvent.index !== this.selectedEvent.index) {
            this.selectedEvent = selectedEvent;
            this.renderCanvas();
        }
    }
    _canvasOnOut = (event: MouseEvent) => {
        this.selectedEvent = { x:0, y:0, index: -1 };
        this.renderCanvas();
    }
    renderCanvas() {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        this.ctx.drawImage(this.image, 0, 0);

        this._drawGrid();
        this._drawSelectBox();
    }
    _drawGrid() {
        this.ctx.setTransform(1,0,0,1,0,0);
        const xItter = this.canvas.width / SPRITE_WIDTH;
        const yItter = this.canvas.height / SPRITE_HEIGHT;
        this.ctx.strokeStyle = "rgba(0,255,255,72)";
        for(let i = 0; i <= xItter; i++) {
            const xCoord = i * SPRITE_WIDTH;
            this.ctx.beginPath();
            this.ctx.moveTo(xCoord, 0);
            this.ctx.lineTo(xCoord, this.canvas.height);
            this.ctx.stroke();
        }

        for(let i = 0; i <= yItter; i++) {
            const yCoord = i * SPRITE_WIDTH;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yCoord);
            this.ctx.lineTo(this.canvas.width, yCoord);
            this.ctx.stroke();
        }
    }
    _drawSelectBox() {
        if(this.selectedEvent.index !== -1) {
            this.ctx.setTransform(1,0,0,1,0,0);
            this.ctx.strokeStyle = "rgba(0,0,255,255)";
            this.ctx.strokeRect(this.selectedEvent.x * SPRITE_WIDTH, this.selectedEvent.y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
        }
    }
}
