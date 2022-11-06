import { HTMLView } from "../../lib/HTMLView";
import type { MapCell, MapCellOptions, MapRobot, MapRobotOptions } from "../../typings/map.d";
import { Robot } from "./Robot";
import { PathMap } from "./PathMap";

import { DEG_90 } from "../../constants";

const GameBoardHTML = `
    <div class="relative">
        <canvas id="canvasMap" class="absolute top-0 left-0" width="800" width="600"></canvas>
        <canvas id="canvasRobot" class="absolute top-0 left-0" width="800" width="600"></canvas>
    </div>
`;
type GameBoardElementsList = {

    canvasMap: HTMLCanvasElement;
    canvasRobot: HTMLCanvasElement;
};
export class GameBoard extends HTMLView<GameBoardElementsList> {
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    map: PathMap;
    robots: Robot[];

    constructor(imageUrl: string) {
        super(GameBoardHTML);
        this.canvas = this.childElements.canvasRobot;
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.rootElement.style.width = "800px";
        this.rootElement.style.height = "600px";
        this.ctx = this.canvas.getContext("2d");

        this.robots = [];

        this.image = new Image();
        this.image.src = imageUrl;
    }
    setMapImage(imageUrl: string) {
        this.map = new PathMap(this.childElements.canvasMap, imageUrl);
    }
    addBot(bot: MapRobot) {
        const robot = new Robot(this.image.src);
        robot.direction = (bot.rotation / 4) * Math.PI ;
        robot.x = (bot.x * 50) + 25;
        robot.y = (bot.y * 50) + 25;
        robot.trackIds = bot.trackIds;
        this.robots.push(robot);
    }
    calculateNextPosition() {
        this.robots.forEach((robot) => {
            const { startX, startY, endX, endY } = robot.getLineCords();
            const lineImage = this.map.readLine(startX, startY, endX, endY);
            robot.calculateLineData(lineImage);
            robot.calculateNextPosition();
        })
    }
    renderFrame() {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        this.robots.forEach((robot) => {
            this.ctx.setTransform(1, 0, 0, 1, robot.x, robot.y);
            this.ctx.rotate( robot.direction + DEG_90 );
            this.ctx.drawImage(robot.image, -robot.image.width / 2, -robot.image.height / 2);
        })
    }
    tick() {
        this.calculateNextPosition();
        this.renderFrame();
    }
}