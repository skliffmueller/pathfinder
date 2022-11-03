import {
    CELL_WIDTH,
    CELL_HEIGHT,
    SPRITE_WIDTH,
    SPRITE_HEIGHT,
    MapCell,
} from "./index";

export type CellEvent = {
    seedId: number;
    speed?: number;
    trackId?: number;
    rotation?: number;
};

export class CellList {
    image: HTMLImageElement;
    cellList: HTMLElement;
    cells: MapCell[];
    cellHTML: string;

    spriteWidth: number;
    spriteHeight: number;

    onClick: (event: CellEvent) => void;
    onChange: (event: CellEvent) => void;
    onRemove: (event: CellEvent) => void;

    constructor(
        cellList: HTMLElement,
        onClick: (event: CellEvent) => void,
        onChange: (event: CellEvent) => void,
        onRemove: (event: CellEvent) => void
    ) {
        this.cells = [];
        this.cellList = cellList;
        this.onClick = onClick;
        this.onChange = onChange;
        this.onRemove = onRemove;
        this.cellHTML = `
        <li class="flex justify-between px-2 py-3 border">
            <button id="rotateButton" class="inline-block bg-no-repeat"></button>
            <div>
                <label>Speed</label>
                <input id="speedInput" class="w-14" type="number" min="0" max="255" />
                <br />
                <label>Track#</label>
                <input id="trackIdInput" class="w-14" type="number" min="0" max="255" />
            </div>
            <button id="removeButton" class="inline-block px-3 py-2 border">X</button>
        </li>
        `;
    }

    setSpriteImage(imageUrl: string) {
        this.image = new Image();
        this.image.onload = () => {
            if((this.image.width % SPRITE_WIDTH) !== 0 || (this.image.height % SPRITE_HEIGHT) !== 0) {
                return;
            }
            this.spriteWidth = this.image.width / SPRITE_WIDTH;
            this.spriteHeight = this.image.height / SPRITE_HEIGHT;
        }
        this.image.src = imageUrl;
    }

    updateCells(cells: MapCell[]) {
        this.cells = cells;
        this.renderCells();
    }

    _createListItem(cell: MapCell) {
        const temp = document.createElement('div');
        temp.innerHTML = this.cellHTML;
        const li = temp.querySelector<HTMLElement>('li');

        const buttonRotation = li.querySelector<HTMLButtonElement>('#rotateButton');
        const speedInput = li.querySelector<HTMLButtonElement>('#speedInput');
        const trackIdInput = li.querySelector<HTMLButtonElement>('#trackIdInput');
        const buttonRemove = li.querySelector<HTMLButtonElement>('#removeButton');

        buttonRotation.dataset.seedId = `${cell.seedId}`;
        buttonRotation.dataset.rotation = `${cell.rotation}`;
        buttonRotation.style.backgroundImage = `url(${this.image.src})`;

        const xIndex = cell.spriteIndex % this.spriteWidth;
        const yIndex = (cell.spriteIndex - xIndex) / this.spriteWidth;

        buttonRotation.style.backgroundPosition = `-${xIndex * SPRITE_WIDTH}px -${yIndex * SPRITE_HEIGHT}px`;
        buttonRotation.style.width = `${SPRITE_WIDTH}px`;
        buttonRotation.style.height = `${SPRITE_HEIGHT}px`;
        buttonRotation.innerHTML = `&nbsp;`;
        switch(cell.rotation) {
            case 1:
                buttonRotation.classList.add('rotate-90');
                break;
            case 2:
                buttonRotation.classList.add('rotate-180');
                break;
            case 3:
                buttonRotation.classList.add('-rotate-90');
                break;
            default:
                buttonRotation.classList.add('rotate-0');
        }
        buttonRotation.addEventListener('click', this._onRotationClick);

        speedInput.dataset.seedId = `${cell.seedId}`;
        speedInput.value = `${cell.speed}`;
        speedInput.addEventListener('change', this._onSpeedChange);

        trackIdInput.dataset.seedId = `${cell.seedId}`;
        trackIdInput.value = `${cell.trackId}`;
        trackIdInput.addEventListener('change', this._onTrackIdChange);

        buttonRemove.dataset.seedId = `${cell.seedId}`;
        buttonRemove.innerHTML = 'X';
        buttonRemove.addEventListener('click', this._onRemoveClick);

        return li;
    }

    _onSpeedChange = (event: Event) => {
        const speedInput = event.target as HTMLInputElement;
        const seedId = parseFloat(speedInput.dataset.seedId);
        const speed = parseInt(speedInput.value);
        this.onChange({ seedId, speed });
    }

    _onTrackIdChange = (event: Event) => {
        const trackIdInput = event.target as HTMLInputElement;
        const seedId = parseFloat(trackIdInput.dataset.seedId);
        const trackId = parseInt(trackIdInput.value);
        this.onChange({ seedId, trackId });
    }

    _onRotationClick = (event: Event) => {
        const buttonRotation = event.target as HTMLElement;
        const seedId = parseFloat(buttonRotation.dataset.seedId);
        let rotation = parseInt(buttonRotation.dataset.rotation) + 1;
        if(rotation > 3) {
            rotation = 0;
        }
        buttonRotation.classList.remove('rotate-0');
        buttonRotation.classList.remove('rotate-90');
        buttonRotation.classList.remove('rotate-180');
        buttonRotation.classList.remove('-rotate-90');
        switch(rotation) {
            case 1:
                buttonRotation.classList.add('rotate-90');
                break;
            case 2:
                buttonRotation.classList.add('rotate-180');
                break;
            case 3:
                buttonRotation.classList.add('-rotate-90');
                break;
            default:
                buttonRotation.classList.add('rotate-0');
        }
        buttonRotation.dataset.rotation = `${rotation}`;

        this.onChange({ seedId, rotation });
    }

    _onRemoveClick = (event: Event) => {
        const buttonRemove = event.target as HTMLElement;
        const seedId = parseFloat(buttonRemove.dataset.seedId);
        this.onRemove({ seedId });

        const li = buttonRemove.parentElement;
        this._removeCellListeners(li);
        li.parentElement.removeChild(li);
    }

    _removeCellListeners = (li: HTMLElement) => {
        const buttonRotation = li.querySelector<HTMLButtonElement>('#rotateButton');
        const speedInput = li.querySelector<HTMLButtonElement>('#speedInput');
        const trackIdInput = li.querySelector<HTMLButtonElement>('#trackIdInput');
        const buttonRemove = li.querySelector<HTMLButtonElement>('#removeButton');

        buttonRotation.removeEventListener('click', this._onRotationClick);
        speedInput.removeEventListener('change', this._onSpeedChange);
        trackIdInput.removeEventListener('change', this._onTrackIdChange);
        buttonRemove.removeEventListener('click', this._onRemoveClick);
    }

    renderCells() {
        while(this.cellList.firstChild) {
            this._removeCellListeners(this.cellList.firstChild as HTMLElement);
            this.cellList.removeChild(this.cellList.firstChild);
        }

        this.cells.forEach((cell) => {
            this.cellList.appendChild(this._createListItem(cell));
        });
    }
}
