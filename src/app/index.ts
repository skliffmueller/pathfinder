import '../assets/index.scss';
import { Floorplan } from "./floorplan";
import { Robot } from "./robot";
import { Line } from "./line";
import { MapEditor } from "./map_editor";
import { add } from "../lib/math";

import spriteImageUrl from "../assets/path_sprites.png";

function main(): void {
    const app = document.body;
    const canvasMap = document.createElement('canvas');
    const canvasRobot = document.createElement('canvas');
    const canvasLine = document.createElement('canvas');

    canvasLine.style.left = "800px";

    canvasMap.width = 800;
    canvasMap.height = 600;
    canvasRobot.width = 800;
    canvasRobot.height = 600;
    canvasLine.width = 148;
    canvasLine.height = 300;

    app.appendChild(canvasMap);
    app.appendChild(canvasRobot);
    app.appendChild(canvasLine);

    const floorplan = new Floorplan(canvasMap);
    const robot = new Robot(canvasRobot);
    const line = new Line(canvasLine);
    setTimeout(() => {
        robot.x = 80;
        robot.y = 220;
        robot.direction = Math.PI * 1.5;
        robot.leftWheel = 0;
        robot.rightWheel = 0;
        robot.renderFrame();

        setInterval(() => {
            const { startX, startY, endX, endY } = robot.getLineCords();
            const lineImage = floorplan.readLine(startX, startY, endX, endY);
            line.drawImage(lineImage);

            let startIndex = -1;
            let endIndex = -1;
            for(let i=0; i < lineImage.width; i++) {
                if(startIndex === -1) {
                    if(lineImage.data[i*4] === 0) {
                        startIndex = i;
                    }
                } else if(endIndex === -1) {
                    if(lineImage.data[i*4] !== 0) {
                        endIndex = i-1;
                        break;
                    }
                }
            }

            if(startIndex !== -1 && endIndex !== -1) {
                const percentCenter = ((startIndex + endIndex + 2) / 2) / lineImage.width;
                const rightPercent = (1 - percentCenter);
                const leftPercent = (1 - rightPercent);

                line.drawSpeeds(leftPercent, rightPercent);

                robot.leftWheel = 0.3 * leftPercent;
                robot.rightWheel = 0.3 * rightPercent;

                robot.renderFrame();
            }
        }, 30);

    }, 200);

}

function sub(): void {
    const app = document.body;
    const canvasMap = document.createElement('canvas');

    canvasMap.width = 800;
    canvasMap.height = 600;

    app.appendChild(canvasMap);

    const mapEditor = new MapEditor(canvasMap, 800, 600);
    mapEditor.setSpriteImage(spriteImageUrl);
    const controls = mapEditor.createControls();
    app.appendChild(controls);
    mapEditor.renderCanvas();
}

(function() {
    // main();
    sub();
})();
