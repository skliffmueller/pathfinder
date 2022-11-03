import {
    CELL_WIDTH,
    CELL_HEIGHT,
    SPRITE_WIDTH,
    SPRITE_HEIGHT,
    MapCell,
} from "./index";

export type CellEvent = {
    seedId: number;
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
    onRotate: (event: CellEvent) => void;
    onRemove: (event: CellEvent) => void;

    constructor(
        cellList: HTMLElement,
        onClick: (event: CellEvent) => void,
        onRotate: (event: CellEvent) => void,
        onRemove: (event: CellEvent) => void
    ) {
        this.cells = [];
        this.cellList = cellList;
        this.onClick = onClick;
        this.onRotate = onRotate;
        this.onRemove = onRemove;
        this.cellHTML = `
        <li class="flex justify-between px-2 py-3 border">
            <button id="rotateButton" class="inline-block bg-no-repeat"></button>
            <button id="selectButton" class="inline-block"></button>
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
        const buttonSelect = li.querySelector<HTMLButtonElement>('#selectButton');
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

        buttonSelect.dataset.seedId = `${cell.seedId}`;
        buttonSelect.innerHTML = `${cell.seedId}`;
        buttonSelect.addEventListener('click', this._onSelectClick);

        buttonRemove.dataset.seedId = `${cell.seedId}`;
        buttonRemove.innerHTML = 'X';
        buttonRemove.addEventListener('click', this._onRemoveClick);

        return li;
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

        this.onRotate({ seedId, rotation });
    }

    _onSelectClick = (event: Event) => {
        const buttonSelect = event.target as HTMLElement;
        const seedId = parseFloat(buttonSelect.dataset.seedId);
        this.onClick({ seedId });
    }

    _onRemoveClick = (event: Event) => {
        const buttonRemove = event.target as HTMLElement;
        const seedId = parseFloat(buttonRemove.dataset.seedId);
        this.onRemove({ seedId });

        const li = buttonRemove.parentElement;
        li.firstChild.removeEventListener('click', this._onRotationClick);
        li.removeChild(li.firstChild);
        li.firstChild.removeEventListener('click', this._onSelectClick);
        li.removeChild(li.firstChild);
        li.firstChild.removeEventListener('click', this._onRemoveClick);
        li.removeChild(li.firstChild);
        li.parentElement.removeChild(li);
    }

    renderCells() {
        while(this.cellList.firstChild) {
            this.cellList.firstChild.firstChild.removeEventListener('click', this._onRotationClick);
            this.cellList.firstChild.removeChild(this.cellList.firstChild.firstChild);
            this.cellList.firstChild.firstChild.removeEventListener('click', this._onSelectClick);
            this.cellList.firstChild.removeChild(this.cellList.firstChild.firstChild);
            this.cellList.firstChild.firstChild.removeEventListener('click', this._onRemoveClick);
            this.cellList.firstChild.removeChild(this.cellList.firstChild.firstChild);
            this.cellList.removeChild(this.cellList.firstChild);
        }

        this.cells.forEach((cell) => {
            this.cellList.appendChild(this._createListItem(cell));
        });
    }
}
