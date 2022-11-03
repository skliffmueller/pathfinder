import testMapUrl from "../assets/path.png";


interface MapCell {
    seedId: number;
    spriteIndex: number;
    rotation: number; // (rotation * 90deg)
    x: number;
    y: number;
}

interface MapCellOptions {
    seedId?: number;
    spriteIndex?: number;
    rotation?: number; // (rotation * 90deg)
    x?: number;
    y?: number;
}

const CELL_WIDTH = 50;
const CELL_HEIGHT = 50;

const SPRITE_WIDTH = 54;
const SPRITE_HEIGHT = 54;

interface ControlInterfaces {
    xValue?: HTMLElement;
    yValue?: HTMLElement;
    addButton?: HTMLButtonElement;
    rotationButton?: HTMLButtonElement;
    cellList?: HTMLElement;
    spriteSelector?: SpriteSelector;
}

interface FormState {
    seedId: number;
    x: number;
    y: number;
    spriteIndex: number;
    rotation: number;
}
const controlsHTML = `
<div class="MapEditor-Controls-coords">
    <label>X:</label><span id="xValue">0</span>
    <label>Y:</label><span id="yValue">0</span>
</div>
<div class="MapEditor-Controls-inputs">
    <canvas id="spriteCanvas"></canvas>
    <button id="rotationButton">0deg</button>
</div>
<div class="MapEditor-Controls-buttons">
    <button id="addButton">Add</button>
    <button id="removeButton">Remove</button>
</div>
<ul class="MapEditor-Controls-cellList" id="cellList"></ul>
`;

type SpriteSelectorEvent = {
    x: number,
    y: number,
    index: number,
};

class SpriteSelector {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    spriteWidth: number;
    spriteHeight: number;

    selectedEvent: SpriteSelectorEvent;

    onClick: (event: SpriteSelectorEvent) => void;

    constructor(canvas: HTMLCanvasElement, onClick: (event: SpriteSelectorEvent) => void) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.onClick = onClick;
        this._canvasOnClick = this._canvasOnClick.bind(this);
        this.canvas.addEventListener('mousedown', this._canvasOnClick);
        this.selectedEvent = {
            x: 0,
            y: 0,
            index: 0,
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
    setIndex(index: number) {
        this.selectedEvent.x = index % this.spriteWidth;
        this.selectedEvent.y = (index - this.selectedEvent.x) / this.spriteWidth;
        this.selectedEvent.index = index;
        this.renderCanvas();
    }
    _canvasOnClick(event: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        this.selectedEvent = {
            x: Math.floor((event.clientX - rect.left) / SPRITE_WIDTH),
            y: Math.floor((event.clientY - rect.top) / SPRITE_HEIGHT),
            index: -1,
        }
        this.selectedEvent.index = (this.selectedEvent.y * this.spriteWidth) + this.selectedEvent.x;
        this.renderCanvas();
        this.onClick(this.selectedEvent);
    }
    renderCanvas() {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        this.ctx.drawImage(this.image, 0, 0);

        this._drawGrid();
        this._drawSelectBox();

    }
    _drawGrid() {
        const xItter = this.canvas.width / SPRITE_WIDTH;
        const yItter = this.canvas.height / SPRITE_HEIGHT;
        this.ctx.strokeStyle = "rgba(0,255,255,72)";
        for(let i = 0; i < xItter; i++) {
            const xCoord = i * SPRITE_WIDTH;
            this.ctx.beginPath();
            this.ctx.moveTo(xCoord, 0);
            this.ctx.lineTo(xCoord, this.canvas.height);
            this.ctx.stroke();
        }

        for(let i = 0; i < yItter; i++) {
            const yCoord = i * SPRITE_WIDTH;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yCoord);
            this.ctx.lineTo(this.canvas.width, yCoord);
            this.ctx.stroke();
        }
    }
    _drawSelectBox() {
        this.ctx.strokeStyle = "rgba(0,0,255,255)";
        this.ctx.strokeRect(this.selectedEvent.x * SPRITE_WIDTH, this.selectedEvent.y * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
    }
}

/*
 * Cell Image definition
 * r = speed (0-255) (Only a recommendation)
 * g = track_id (0-255) (0 means everyone, robots will store list of track id's it's allowed to be on)
 * b = (path name)
 *      0x01 - announce name, "somestring", 0x00
 * a = (announce flag)
 */

export class MapEditor {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    width: number;
    height: number;

    selectedSeedId: number;

    cells: MapCell[];

    sprites: ImageData[][];

    controls: ControlInterfaces;

    formState: FormState;

    constructor(canvas: HTMLCanvasElement, width: number, height: number) {
        this.canvas = canvas;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext("2d");

        this._canvasOnClick = this._canvasOnClick.bind(this);

        this._onSpriteSelectorClick = this._onSpriteSelectorClick.bind(this);
        this._onRotationButtonClick = this._onRotationButtonClick.bind(this);
        this._onAddButtonClick = this._onAddButtonClick.bind(this);
        this._onRemoveButtonClick = this._onRemoveButtonClick.bind(this);
        this._onCellLinkClick = this._onCellLinkClick.bind(this);

        this.canvas.addEventListener('mousedown', this._canvasOnClick);

        this.formState = {
            seedId: -1,
            x: 0,
            y: 0,
            spriteIndex: 0,
            rotation: 0,
        };

        this.cells = [];
    }
    createControls() {
        const container = document.createElement('div');
        container.classList.add('MapEditor-Controls')
        container.innerHTML = controlsHTML;

        const xValue = container.querySelector<HTMLElement>('#xValue');
        const yValue = container.querySelector<HTMLElement>('#yValue');

        const spriteCanvas = container.querySelector<HTMLCanvasElement>('#spriteCanvas');
        const spriteSelector = new SpriteSelector(spriteCanvas, this._onSpriteSelectorClick);
        spriteSelector.setSpriteImage(this.image.src);

        const rotationButton = container.querySelector<HTMLButtonElement>('#rotationButton');
        rotationButton.addEventListener('click', this._onRotationButtonClick);
        const addButton = container.querySelector<HTMLButtonElement>('#addButton');
        addButton.addEventListener('click', this._onAddButtonClick);
        const removeButton = container.querySelector<HTMLButtonElement>('#removeButton');
        removeButton.addEventListener('click', this._onRemoveButtonClick);

        const cellList = container.querySelector<HTMLElement>('#cellList');

        this.controls = {
            xValue,
            yValue,
            rotationButton,
            addButton,
            cellList,
            spriteSelector,
        };

        return container;
    }
    _onRemoveButtonClick(event: MouseEvent) {
        if(this.formState.seedId === -1) {
            return;
        }
        this.removeCell(this.formState.seedId);
        this.formState.seedId = -1;
        this._updateCellList();
        this.renderCanvas();
    }
    _onAddButtonClick(event: MouseEvent) {
        this.formState = this.addCell(this.formState);
        this._updateCellList();
        this.renderCanvas();
    }
    _onSpriteSelectorClick(event: SpriteSelectorEvent) {
        this.formState.spriteIndex = event.index;
        if(this.formState.seedId === -1) {
            return;
        }
        this.updateCell({
            seedId: this.formState.seedId,
            spriteIndex: this.formState.spriteIndex,
        });
        this.renderCanvas();
    }
    _onRotationButtonClick(event: MouseEvent) {
        this.formState.rotation += 1;
        if(this.formState.rotation > 3) {
            this.formState.rotation = 0;
        }
        this.controls.rotationButton.innerHTML = `${this.formState.rotation * 90}deg`;
        if(this.formState.seedId === -1) {
            return;
        }
        this.updateCell({
            seedId: this.formState.seedId,
            rotation: this.formState.rotation,
        });
        this.renderCanvas();
    }

    _onCellLinkClick(event: Event) {
        event.preventDefault();
        const a = event.target as HTMLElement;
        const lis = a.parentElement.parentElement.querySelectorAll('li');
        for(let i=0;i < lis.length;i++) {
            lis[i].classList.remove('active');
        }
        a.parentElement.classList.add('active');
        this.selectSeedId(parseFloat(a.dataset.seedId));
        this._resetControls();
    }

    _updateCellList() {
        while(this.controls.cellList.firstChild) {
            this.controls.cellList.firstChild.firstChild.removeEventListener('click', this._onCellLinkClick);
            this.controls.cellList.removeChild(this.controls.cellList.firstChild);
        }
        const cells = this.findCellsAtCords(this.formState.x, this.formState.y);
        cells.forEach(cell => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = "#";
            a.innerHTML = `${cell.seedId}`;
            a.dataset.seedId = `${cell.seedId}`;
            a.addEventListener('click', this._onCellLinkClick);
            if(cell.seedId === this.formState.seedId) {
                li.classList.add('active');
            }
            li.appendChild(a);
            this.controls.cellList.appendChild(li);
        });
    }
    _resetControls() {
        this.controls.xValue.innerHTML = `${this.formState.x}`;
        this.controls.yValue.innerHTML = `${this.formState.y}`;
        this.controls.rotationButton.innerHTML = `${this.formState.rotation * 90}deg`;
        this.controls.spriteSelector.setIndex(this.formState.spriteIndex);
    }
    _canvasOnClick(event: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / CELL_WIDTH);
        const y = Math.floor((event.clientY - rect.top) / CELL_WIDTH);
        const cells = this.findCellsAtCords(x, y);
        this.formState = {
            seedId: -1,
            x,
            y,
            spriteIndex: 0,
            rotation: 0,
        };
        this._resetControls();
        this._updateCellList();
        this.renderCanvas();
    }

    selectSeedId(seedId: number) {
        const cell = this.cells.find((cell) => (cell.seedId === seedId));
        if(cell) {
            this.formState.seedId = cell.seedId;
            this.formState.spriteIndex = cell.spriteIndex;
            this.formState.rotation = cell.rotation;
        } else {
            this.formState.seedId = -1;
        }
    }
    setSpriteImage(imageUrl: string) {
        this.image = new Image();

        this.image.onload = () => {
            if((this.image.width % SPRITE_WIDTH) !== 0 || (this.image.height % SPRITE_HEIGHT) !== 0) {
                return;
            }
            this.sprites = [];

            const cellWidth = (this.image.width / SPRITE_WIDTH);
            const cellHeight = (this.image.height / SPRITE_HEIGHT)
            const spriteLength = cellWidth * cellHeight;
            const canvas = document.createElement('canvas');
            canvas.width = this.image.width;
            canvas.height = this.image.height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(this.image, 0, 0);

            for(let i=0;i < spriteLength;i++) {
                const cropX = (i % cellWidth);
                const cropY = (i - cropX) / cellWidth;
                const clipImage = ctx.getImageData(cropX * SPRITE_WIDTH, cropY * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
                this.sprites[i] = [clipImage];
            }

            canvas.width = this.image.height;
            canvas.height = this.image.width;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
            ctx.rotate( Math.PI/2 );
            ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);

            for(let i=0;i < spriteLength;i++) {
                const cropX = (i % cellWidth);
                const cropY = (i - cropX) / cellWidth;
                const clipImage = ctx.getImageData(((cellHeight-1) - cropY) * SPRITE_WIDTH, cropX * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
                this.sprites[i].push(clipImage);
            }

            canvas.width = this.image.width;
            canvas.height = this.image.height;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
            ctx.rotate( Math.PI );
            ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);

            for(let i=0;i < spriteLength;i++) {
                const cropX = (i % cellWidth);
                const cropY = (i - cropX) / cellWidth;
                const clipImage = ctx.getImageData(((cellWidth-1) - cropX) * SPRITE_WIDTH, ((cellHeight-1) - cropY) * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
                this.sprites[i].push(clipImage);
            }

            canvas.width = this.image.height;
            canvas.height = this.image.width;
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.setTransform(1, 0, 0, 1, canvas.width / 2, canvas.height / 2);
            ctx.rotate( Math.PI * (3/2) );
            ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);

            for(let i=0;i < spriteLength;i++) {
                const cropX = (i % cellWidth);
                const cropY = (i - cropX) / cellWidth;
                const clipImage = ctx.getImageData(cropY * SPRITE_WIDTH, ((cellWidth-1) - cropX) * SPRITE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT);
                this.sprites[i].push(clipImage);
            }
        }
        this.image.src = imageUrl;
    }
    addCell(options: MapCellOptions): MapCell {
        const seedId = Date.now() + (Math.round(Math.random() * 100) / 100);
        const cell: MapCell = {
            seedId,
            spriteIndex: options.spriteIndex | 0,
            rotation: options.rotation | 0,
            x: options.x | 0,
            y: options.y | 0,
        };
        this.cells.push(cell);
        return cell;
    }
    updateCell(cell: MapCellOptions): MapCell {
        const cellIndex = this.cells.findIndex(c => (c.seedId === cell.seedId));
        this.cells[cellIndex] = {
            ...this.cells[cellIndex],
            ...cell,
        };
        return this.cells[cellIndex];
    }
    removeCell(seedId: number) {
        this.cells = this.cells.filter(cell => (cell.seedId !== seedId));
    }
    findCellsAtCords(x: number, y: number): MapCell[] {
        return this.cells.filter(cell => (cell.x === x && cell.y === y));
    }
    renderCanvas() {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        this._drawCells();
        this._drawGrid();
        this._drawSelectBox();
    }
    _drawCells() {
        const mergedData = this.cells.reduce((data, cell) => {
            const imageData = this.sprites[cell.spriteIndex][cell.rotation];
            let index = data.findIndex((c) => (c.x === cell.x && c.y === cell.y));
            if(index === -1) {
                index = data.length;
                data.push({x: cell.x, y: cell.y, imageData: this.ctx.createImageData(imageData) });
            }
            const dataLength = data[index].imageData.data.length;
            for(let i = 0; i < dataLength;i+=4) {
                if(imageData.data[i+3] !== 0 && data[index].imageData.data[i+3] !== 0) {
                    // Tracks intersect!
                    if(imageData.data[i] < data[index].imageData.data[i]) {
                        // We want to use the lower of speeds on track intersections
                        data[index].imageData.data[i] = imageData.data[i];
                    }
                    if(imageData.data[i+1] !== data[index].imageData.data[i+1]) {
                        // track_ids are different set 0 for all
                        data[index].imageData.data[i+1] = 0;
                    }
                    data[index].imageData.data[i+2] = 0; // This is a data channel, no data on intersections
                    // Alpha channels should be the same, no need to set
                    // data[index].imageData.data[i+3] |= imageData.data[i+3];
                } else if(imageData.data[i+3] !== 0) {
                    data[index].imageData.data[i] = imageData.data[i];
                    data[index].imageData.data[i+1] = imageData.data[i+1];
                    data[index].imageData.data[i+2] = imageData.data[i+2];
                    data[index].imageData.data[i+3] = imageData.data[i+3];
                }
            }
            return data;
        }, []);

        mergedData.forEach((cell) => {
            const x = (cell.x * CELL_WIDTH) - 2;
            const y = (cell.y * CELL_HEIGHT) - 2;

            this.ctx.putImageData(cell.imageData, x, y, 0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
        });
    }
    _drawGrid() {
        const xItter = this.canvas.width / CELL_WIDTH;
        const yItter = this.canvas.height / CELL_HEIGHT;
        this.ctx.strokeStyle = "rgba(0,255,255,72)";
        for(let i = 0; i < xItter; i++) {
            const xCoord = i * CELL_WIDTH;
            this.ctx.beginPath();
            this.ctx.moveTo(xCoord, 0);
            this.ctx.lineTo(xCoord, this.canvas.height);
            this.ctx.stroke();
        }

        for(let i = 0; i < yItter; i++) {
            const yCoord = i * CELL_WIDTH;
            this.ctx.beginPath();
            this.ctx.moveTo(0, yCoord);
            this.ctx.lineTo(this.canvas.width, yCoord);
            this.ctx.stroke();
        }
    }
    _drawSelectBox() {
        this.ctx.strokeStyle = "rgba(0,0,255,255)";
        this.ctx.strokeRect(this.formState.x * CELL_WIDTH, this.formState.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }
}