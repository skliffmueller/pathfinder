import '../assets/index.scss';
import { MapEditor } from "./MapEditor";
import { add } from "../lib/math";
import robotImageUrl from "../assets/robot.png";
import spriteImageUrl from "../assets/path_sprites.png";
import {HTMLView} from "../lib/HTMLView";
import { GameBoard } from "./GameBoard";

const mapData = require("../assets/map.json");

type AppChildElementsList = {

    canvasMap: HTMLCanvasElement;
    canvasRobot: HTMLCanvasElement;
    canvasLine: HTMLCanvasElement;
    robotDebugList: HTMLDivElement;
};

const AppHTML = `
    <div class="relative w-screen h-screen">
        <div class="relative">
            <canvas id="canvasMap" class="absolute top-0 left-0" width="800" width="600"></canvas>
            <canvas id="canvasRobot" class="absolute top-0 left-0" width="800" width="600"></canvas>
        </div>
        <div class="absolute top-800 left-0" id="robotDebugList"></div>
    </div>
`;

// class App extends HTMLView<AppChildElementsList> {
//     gameMap: Floorplan;
//     robots: Robot[];
//     robotDebugList: RobotDebug[];
//
//     constructor() {
//         super(AppHTML);
//
//         this.gameMap = new Floorplan(this.childElements.canvasMap, mapData.map);
//         this.robot = new Robot(this.childElements.canvasRobot);
//         this.line = new RobotDebug(this.childElements.canvasLine);
//
//
//     }
// }

function main(): void {
    const app = document.body;

    const gameBoard = new GameBoard(robotImageUrl);
    gameBoard.setMapImage(mapData.map);

    app.appendChild(gameBoard.rootElement);
    mapData.robots.forEach((robot: MapRobot) => {
        gameBoard.addBot(robot);
    })
    setTimeout(() => {
        setInterval(() => {
            gameBoard.tick();
        }, 30);
    }, 200);

}

function sub(): void {
    const app = document.body;
    const canvasContainer = document.createElement('div');
    const canvasMap = document.createElement('canvas');

    canvasMap.classList.add('mr-64');
    canvasMap.width = 800;
    canvasMap.height = 600;

    canvasContainer.appendChild(canvasMap);
    app.appendChild(canvasContainer);

    const mapEditor = new MapEditor(canvasMap, 800, 600);
    mapEditor.setSpriteImage(spriteImageUrl);
    const controls = mapEditor.createControls();
    app.appendChild(controls);
    mapEditor.renderCanvas();
}

(function() {
    main();
    //sub();
})();
