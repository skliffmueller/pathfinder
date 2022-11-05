import {HTMLView} from "../lib/HTMLView";
import {GameBoard} from "./GameBoard";
import {MapLoader} from "./MapLoader";
import {MapEditor} from "./MapEditor";
import spriteImageUrl from "../assets/path_sprites.png";

type EditorElements = {

    canvasMap: HTMLCanvasElement;
    controls: HTMLDivElement;
};

const EditorHTML = `
    <div>
        <canvas class="mr-64" id="canvasMap"></canvas>
        <div id="controls" class="fixed bg-white px-2 py-3 top-0 right-0 h-screen max-h-screen w-64 border rounded overflow-y-scroll"></div>
    </div>
`;

export class Editor extends HTMLView<EditorElements> {
    gameBoard: GameBoard;
    mapLoader: MapLoader;

    constructor() {
        super(EditorHTML);

        this.childElements.canvasMap.width = 800;
        this.childElements.canvasMap.height = 600;

        const mapEditor = new MapEditor(this.childElements.canvasMap, 800, 600);
        mapEditor.setSpriteImage(spriteImageUrl);
        const controls = mapEditor.createControls();
        this.childElements.controls.appendChild(controls);
        mapEditor.renderCanvas();
    }
}