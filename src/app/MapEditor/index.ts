import robotImageUrl from "../../assets/robot.png";
import { CellEvent, CellList } from "./CellList";
import { RobotEvent, RobotList } from "./RobotList";
import { SpriteSelectorEvent, SpriteSelector } from "./SpriteSelector";

import type { MapCell, MapCellOptions, MapRobot, MapRobotOptions } from "../../typings/map.d";

export const CELL_WIDTH = 50;
export const CELL_HEIGHT = 50;

export const SPRITE_WIDTH = 54;
export const SPRITE_HEIGHT = 54;

export interface ControlInterfaces {
    xValue?: HTMLElement;
    yValue?: HTMLElement;
    addButton?: HTMLButtonElement;
    rotationButton?: HTMLButtonElement;
    cellList?: CellList;
    robotList?: RobotList;
    spriteSelector?: SpriteSelector;
}

export interface FormState {
    x: number;
    y: number;
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
    controlsHTML: string;

    width: number;
    height: number;

    selectedSeedId: number;

    robotImage: HTMLImageElement;

    robots: MapRobot[];
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
        this._onAddRobotClick = this._onAddRobotClick.bind(this);
        this._onExportMap = this._onExportMap.bind(this);

        this.robotImage = new Image();
        this.robotImage.onload = () => {
            this.robotImage.style.opacity = "0.4";
        }
        this.robotImage.src = robotImageUrl;

        this.canvas.addEventListener('mousedown', this._canvasOnClick);

        this.initializeDefaults();

        this.controlsHTML = `
            <div id="container">
                <div class="my-2">
                    <a href="#" class="underline">Game Board</a>
                    <a id="newMap" class="inline-block px-3 py-1 border rounded" href="#">New Map</a>
                </div>
                <div class="my-2">
                    <label>Export</label><br />
                    <a id="exportMap" class="inline-block px-3 py-1 border rounded" href="#">Map</a>
                    <a id="exportRobots" class="inline-block px-3 py-1 border rounded" href="#">Robots</a>
                    <a id="exportPNG" class="inline-block px-3 py-1 border rounded" href="#">PNG</a>
                </div>
                <div class="my-2">
                    <label>Width:</label>
                    <input class="w-16" type="number" value="16" />
                    <label>Height:</label>
                    <input class="w-16" type="number" value="12" />
                </div>
                <div class="">
                    <label>X:</label><span id="xValue">0</span>
                    <label>Y:</label><span id="yValue">0</span>
                </div>
                <div class="flex justify-center p-2">
                    <canvas id="spriteCanvas"></canvas>
                </div>
                <div class="MapEditor-Controls-buttons">
                    <button class="border rounded px-3 py-1" id="addRobotButton">Add Robot</button>
                </div>
                <ul class="MapEditor-Controls-cellList" id="robotList"></ul>
                <ul class="MapEditor-Controls-cellList" id="cellList"></ul>
            </div>
        `;
    }
    initializeDefaults() {
        this.cells = [];
        this.robots = [];
        this.formState = {
            x: 0,
            y: 0,
        };
        this.width = 16;
        this.height = 12;
    }
    createControls() {
        const temp = document.createElement('div');
        temp.innerHTML = this.controlsHTML;
        const container = temp.querySelector<HTMLElement>('#container');

        const newMap = container.querySelector<HTMLElement>('#newMap');
        newMap.addEventListener('click', this._onNewMap);

        const downloadLink = container.querySelector<HTMLElement>('#exportPNG');
        downloadLink.addEventListener('click', () => this.renderCanvas(true));

        const exportMap = container.querySelector<HTMLElement>('#exportMap');
        exportMap.addEventListener('click', this._onExportMap);

        const xValue = container.querySelector<HTMLElement>('#xValue');
        const yValue = container.querySelector<HTMLElement>('#yValue');

        const spriteCanvas = container.querySelector<HTMLCanvasElement>('#spriteCanvas');
        const spriteSelector = new SpriteSelector(spriteCanvas, this._onSpriteSelectorClick);
        spriteSelector.setSpriteImage(this.image.src);

        const cellUl = container.querySelector<HTMLElement>('#cellList');
        const cellList = new CellList(cellUl, this._onCellClick, this._onCellUpdate, this._onCellRemove);
        cellList.setSpriteImage(this.image.src);

        const addRobotButton = container.querySelector<HTMLElement>('#addRobotButton');
        addRobotButton.addEventListener('click', this._onAddRobotClick);

        const robotUl = container.querySelector<HTMLElement>('#robotList');
        const robotList = new RobotList(robotUl, this._onRobotChange, this._onRobotRemove);
        robotList.setSpriteImage(this.robotImage.src);

        this.controls = {
            xValue,
            yValue,
            cellList,
            robotList,
            spriteSelector,
        };

        return container;
    }
    _onNewMap(event: Event) {
        window.localStorage.removeItem('MapEditor_autosave');
        this.initializeDefaults();
        this._resetControls();
    }
    _onExportMap(event: Event) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            cells: this.cells,
            robots: this.robots,
            map: this.renderCanvas(true),
        }));
        let downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `map_${Math.round(Date.now()/1000)}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
    _onCellClick = (event: CellEvent) => {
        this.selectSeedId(event.seedId);
    }
    _onCellRemove = (event: CellEvent) => {
        this.removeCell(event.seedId);
        this.renderCanvas();
    }
    _onCellUpdate = (event: CellEvent) => {
        this.updateCell(event);
        this.renderCanvas();
    }

    _onAddRobotClick(event: Event) {
        this.addRobot({
            ...this.formState,
        });
        this._updateRobotList();
        this.renderCanvas();
    }
    _onRobotRemove = (event: RobotEvent) => {
        this.removeRobot(event.seedId);
        this.renderCanvas();
    }
    _onRobotChange = (event: RobotEvent) => {
        this.updateRobot(event);
        this.renderCanvas();
    }

    _onSpriteSelectorClick(event: SpriteSelectorEvent) {
        this.addCell({
            ...this.formState,
            spriteIndex: event.index,
        });
        this._updateCellList();
        this.renderCanvas();
    }

    _updateCellList() {
        const cells = this.findCellsAtCords(this.formState.x, this.formState.y);
        this.controls.cellList.updateCells(cells);
    }
    _updateRobotList() {
        const robots = this.findRobotsAtCords(this.formState.x, this.formState.y);
        this.controls.robotList.updateRobots(robots);
    }
    _resetControls() {
        this.controls.xValue.innerHTML = `${this.formState.x}`;
        this.controls.yValue.innerHTML = `${this.formState.y}`;
        this.controls.robotList.updateRobots([]);
        this.controls.cellList.updateCells([]);
    }
    _canvasOnClick(event: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / CELL_WIDTH);
        const y = Math.floor((event.clientY - rect.top) / CELL_WIDTH);
        this.formState.x = x;
        this.formState.y = y;
        this._resetControls();
        this._updateCellList();
        this._updateRobotList();
        this.renderCanvas();
    }

    selectSeedId(seedId: number) {
        // const cell = this.cells.find((cell) => (cell.seedId === seedId));
        // if(cell) {
        //     this.formState.seedId = cell.seedId;
        //     this.formState.spriteIndex = cell.spriteIndex;
        //     this.formState.rotation = cell.rotation;
        // } else {
        //     this.formState.seedId = -1;
        // }
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
        const seedId = (Date.now() & 0xffff) + (Math.round(Math.random() * 100) / 100);
        const cell: MapCell = {
            seedId,
            speed: 0,
            trackId: 0,
            spriteIndex: options.spriteIndex,
            rotation: 0,
            x: options.x,
            y: options.y,
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
    addRobot(options: MapRobotOptions): MapRobot {
        const seedId = (Date.now() & 0xffff) + (Math.round(Math.random() * 100) / 100);
        const robot: MapRobot = {
            seedId,
            rotation: 0,
            trackIds: [],
            x: options.x,
            y: options.y,
        };
        this.robots.push(robot);
        return robot;
    }
    updateRobot(robot: MapRobotOptions): MapRobot {
        const robotIndex = this.robots.findIndex(r => (r.seedId === robot.seedId));
        this.robots[robotIndex] = {
            ...this.robots[robotIndex],
            ...robot,
        };
        return this.robots[robotIndex];
    }
    removeRobot(seedId: number) {
        this.robots = this.robots.filter(robot => (robot.seedId !== seedId));
    }
    findRobotsAtCords(x: number, y: number): MapRobot[] {
        return this.robots.filter(robot => (robot.x === x && robot.y === y));
    }

    renderCanvas(exportConfig?: boolean): string | void {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        this._drawCells();
        if(exportConfig) {
            return this.canvas.toDataURL('image/png');
        }
        this._drawRobots();
        this._drawGrid();
        this._drawSelectBox();
    }
    _drawCells() {
        this.ctx.setTransform(1,0,0,1,0,0);
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
                    if(data[index].imageData.data[i] !== cell.speed) {
                        // We want to use the lower of speeds on track intersections
                        data[index].imageData.data[i] = 0;
                    }
                    if(data[index].imageData.data[i+1] !== cell.trackId) {
                        // track_ids are different set 0 for all
                        data[index].imageData.data[i+1] = 0;
                    }
                    data[index].imageData.data[i+2] = 0; // This is a data channel, no data on intersections
                    // Alpha channels should be the same, no need to set
                    // data[index].imageData.data[i+3] |= imageData.data[i+3];
                } else if(imageData.data[i+3] !== 0) {
                    data[index].imageData.data[i] = cell.speed;
                    data[index].imageData.data[i+1] = cell.trackId;
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
    _drawRobots() {
        const halfRobotWidth = -this.robotImage.width / 2;
        const halfRobotHeight = -this.robotImage.height / 2;
        const halfCellWidth = CELL_WIDTH / 2;
        const halfCellHeight = CELL_HEIGHT / 2;
        const quarterPi = Math.PI/4;
        this.ctx.globalAlpha = 0.4;

        this.robots.forEach((robot) => {
            const x = (robot.x * CELL_WIDTH) + halfCellWidth;
            const y = (robot.y * CELL_HEIGHT) + halfCellHeight;
            this.ctx.setTransform(1, 0, 0, 1, x, y);
            this.ctx.rotate( robot.rotation * quarterPi );
            this.ctx.drawImage(this.robotImage, halfRobotWidth, halfRobotHeight);
        });
        this.ctx.globalAlpha = 1;
    }
    _drawGrid() {
        this.ctx.setTransform(1,0,0,1,0,0);
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
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.strokeStyle = "rgba(0,0,255,255)";
        this.ctx.strokeRect(this.formState.x * CELL_WIDTH, this.formState.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }
}