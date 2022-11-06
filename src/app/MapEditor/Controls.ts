import {HTMLView} from "../../lib/HTMLView";
import {SpriteSelector, SpriteSelectorEvent} from "./SpriteSelector";
import {CellEvent, CellList} from "./CellList";
import {RobotEvent, RobotList} from "./RobotList";
import {MapCell, MapRobot} from "../../typings/map";
import {MapLoader} from "../MapLoader";

const ArrowRightCircleSVG = require('heroicons/24/outline/arrow-right-on-rectangle.svg')

const ControlsHTML = `
<div class="relative transition-all w-64">
    <div class="absolute top-0 right-full">
        <button id="expandButton" class="transition-all -mr-8"></button>
    </div>
    <div class="w-64">
        <div class="text-right px-2 py-1">
            <a href="#" class="underline">Back to Game Board</a>
        </div>
        <div id="mapLoader"></div>
        <div class="flex justify-between px-2 py-2">
            <a id="exportButton" class="inline-block px-3 py-1 border rounded" href="#">Export Map</a>
            <a id="newMapButton" class="inline-block px-3 py-1 border rounded" href="#">New Map</a>
        </div>
<!--        <div class="my-2">-->
<!--            <label>Width:</label>-->
<!--            <input id="widthInput" class="w-16" type="number" value="16" />-->
<!--            <label>Height:</label>-->
<!--            <input id="heightInput" class="w-16" type="number" value="12" />-->
<!--        </div>-->
        <div class="flex justify-center p-2">
            <canvas id="spriteCanvas" class="cursor-pointer"></canvas>
        </div>
        <div class="my-2">
            <button id="addRobotButton" class="border rounded px-3 py-1">Add Robot</button>
        </div>
        <ul class="MapEditor-Controls-cellList" id="robotList"></ul>
        <ul class="MapEditor-Controls-cellList" id="cellList"></ul>
    </div>
</div>
`;

type ControlsElements = {
    expandButton: HTMLButtonElement;
    expandIcon: SVGElement;
    mapLoader: HTMLDivElement;
    newMapButton: HTMLButtonElement;
    exportButton: HTMLButtonElement;
    addRobotButton: HTMLButtonElement;
    spriteCanvas: HTMLCanvasElement;
    robotList: HTMLUListElement;
    cellList: HTMLUListElement;
}

interface ControlsEvents {
    addCell: SpriteSelectorEvent;
    removeCell: CellEvent;
    changeCell: CellEvent;
    addRobot: Event;
    removeRobot: RobotEvent;
    changeRobot: RobotEvent;
    new: Event;
    export: Event;
}

export class EditorControls extends HTMLView<ControlsElements, HTMLDivElement, ControlsEvents> {
    spriteSelector: SpriteSelector;
    robotList: RobotList;
    cellList: CellList;

    constructor(spriteImageUrl: string, robotImageUrl: string, mapLoader: MapLoader) {
        super(ControlsHTML);

        this.childElements.mapLoader.appendChild(mapLoader.rootElement);

        this.childElements.expandIcon = new HTMLView<{}, SVGElement>(ArrowRightCircleSVG).rootElement;
        this.childElements.expandIcon.classList.add('w-8', 'h-8');
        this.childElements.expandButton.appendChild(this.childElements.expandIcon);
        this.childElements.expandButton.addEventListener('click', this._onExpand);

        this.childElements.newMapButton.addEventListener('click', this._onNewMap);
        this.childElements.exportButton.addEventListener('click', this._onExport);
        this.childElements.addRobotButton.addEventListener('click', this._onAddRobot);

        this.spriteSelector = new SpriteSelector(this.childElements.spriteCanvas, this._onSpriteSelect);
        this.spriteSelector.setSpriteImage(spriteImageUrl);

        this.cellList = new CellList(this.childElements.cellList, this._onCellChange, this._onCellRemove);
        this.cellList.setSpriteImage(spriteImageUrl);

        this.robotList = new RobotList(this.childElements.robotList, this._onRobotChange, this._onRobotRemove);
        this.robotList.setSpriteImage(robotImageUrl);
    }

    updateCells = (cells: MapCell[]) => {
        this.cellList.updateCells(cells);
    }

    updateRobots = (robots: MapRobot[]) => {
        this.robotList.updateRobots(robots);
    }

    _onExpand = (event: Event) => {
        if(this.childElements.expandButton.classList.contains('-mr-8')) {
            this.rootElement.classList.remove('w-64');
            this.childElements.expandButton.classList.remove('-mr-8');
            this.childElements.expandButton.classList.add('mr-4');
            this.childElements.expandButton.classList.add('-scale-100');
            this.rootElement.classList.add('w-0');
        } else {
            this.rootElement.classList.remove('w-0');
            this.childElements.expandButton.classList.remove('mr-4');
            this.childElements.expandButton.classList.remove('-scale-100');
            this.childElements.expandButton.classList.add('-mr-8');
            this.rootElement.classList.add('w-64');

        }
    }

    _onNewMap = (event: Event) => this.emit('new', event)
    _onExport = (event: Event) => this.emit('export', event)
    _onAddRobot = (event: Event) => this.emit('addRobot', event)
    _onSpriteSelect = (event: SpriteSelectorEvent) => this.emit('addCell', event)
    _onCellChange = (event: CellEvent) => this.emit('changeCell', event)
    _onCellRemove = (event: CellEvent) => this.emit('removeCell', event)
    _onRobotChange = (event: RobotEvent) =>  this.emit('changeRobot', event)
    _onRobotRemove = (event: RobotEvent) =>  this.emit('removeRobot', event)
}