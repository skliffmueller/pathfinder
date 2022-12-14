import {HTMLView} from "../lib/HTMLView";
import {GameBoard} from "./GameBoard";
import {MapLoader, MapLoaderEvent} from "./MapLoader";
import mapDataUrl from "../assets/map.json";
import robotImageUrl from "../assets/robot.png";
import {MapRobot} from "../typings/map";
import {RobotDebug, RobotStatus} from "./GameBoard/Tools";

type AppElements = {

    canvasMap: HTMLCanvasElement;
    canvasRobot: HTMLCanvasElement;
    canvasLine: HTMLCanvasElement;
    gameBoard: HTMLDivElement;
    mapLoader: HTMLDivElement;
    robotDebug: HTMLDivElement;
};

const AppHTML = `
    <div class="w-screen h-screen">
        <div class="flex">
            <div id="gameBoard"></div>
            <div class="absolute top-800 left-0" id="robotDebugList"></div>
        </div>
        <div class="fixed bg-white px-2 py-3 top-0 right-0 h-screen max-h-screen border rounded">
            <div class="text-right px-2 py-1">
                <a href="#editor" class="underline">Goto Map Editor</a>
            </div>
            <div id="mapLoader"></div>
            <div id="robotDebug"></div>
        </div>
    </div>
`;

export class App extends HTMLView<AppElements> {
    gameBoard: GameBoard;
    mapLoader: MapLoader;
    interval: NodeJS.Timer;

    constructor() {
        super(AppHTML);

        this.mapLoader = new MapLoader(this.onLoad);

        this.mapLoader.addElement(mapDataUrl);

        this.mapLoader.loadUrl(mapDataUrl);

        this.childElements.mapLoader.appendChild(this.mapLoader.rootElement);
    }

    onLoad = (event: MapLoaderEvent) => {
        const { mapData } = event;
        if(this.interval) {
            clearInterval(this.interval);
            if(this.gameBoard) {
                this.gameBoard.destroy();
            }
        }
        this.gameBoard = new GameBoard(robotImageUrl);
        this.gameBoard.setMapImage(mapData.map);

        this.childElements.gameBoard.appendChild(this.gameBoard.rootElement);
        mapData.robots.forEach((robot: MapRobot) => {
            this.gameBoard.addBot(robot);
        })
        const debug = new RobotStatus(this.gameBoard.robots as RobotDebug[]);
        this.childElements.robotDebug.appendChild(debug.rootElement);
        this.interval = setInterval(() => this.tick(), 20);
    }

    tick() {
        this.gameBoard.tick();
    }
}