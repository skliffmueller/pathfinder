import {
    CELL_WIDTH,
    CELL_HEIGHT,
    SPRITE_WIDTH,
    SPRITE_HEIGHT,
    MapRobot,
} from "./index";

export type RobotEvent = {
    seedId: number;
    rotation?: number;
};

export class RobotList {
    image: HTMLImageElement;
    robotList: HTMLElement;
    robots: MapRobot[];
    robotHTML: string;

    onClick: (event: RobotEvent) => void;
    onRotate: (event: RobotEvent) => void;
    onRemove: (event: RobotEvent) => void;

    constructor(
        robotList: HTMLElement,
        onClick: (event: RobotEvent) => void,
        onRotate: (event: RobotEvent) => void,
        onRemove: (event: RobotEvent) => void
    ) {
        this.robots = [];
        this.robotList = robotList;
        this.onClick = onClick;
        this.onRotate = onRotate;
        this.onRemove = onRemove;
        this.robotHTML = `
        <li class="flex justify-between px-2 py-3 border">
            <button id="rotateButton" class="inline-block bg-no-repeat bg-center bg-pyth-hyp"></button>
            <button id="selectButton" class="inline-block"></button>
            <button id="removeButton" class="inline-block px-3 py-2 border">X</button>
        </li>
        `;
    }

    setSpriteImage(imageUrl: string) {
        this.image = new Image();
        this.image.src = imageUrl;
    }

    updateRobots(robots: MapRobot[]) {
        this.robots = robots;
        this.renderRobots();
    }

    _createListItem(robot: MapRobot) {
        const temp = document.createElement('div');
        temp.innerHTML = this.robotHTML;
        const li = temp.querySelector<HTMLElement>('li');

        const buttonRotation = li.querySelector<HTMLButtonElement>('#rotateButton');
        const buttonSelect = li.querySelector<HTMLButtonElement>('#selectButton');
        const buttonRemove = li.querySelector<HTMLButtonElement>('#removeButton');

        buttonRotation.dataset.seedId = `${robot.seedId}`;
        buttonRotation.dataset.rotation = `${robot.rotation}`;
        buttonRotation.style.backgroundImage = `url(${this.image.src})`;

        buttonRotation.style.width = `${SPRITE_WIDTH}px`;
        buttonRotation.style.height = `${SPRITE_HEIGHT}px`;
        buttonRotation.innerHTML = `&nbsp;`;
        switch(robot.rotation) {
            case 1:
                buttonRotation.classList.add('rotate-45');
                break;
            case 2:
                buttonRotation.classList.add('rotate-90');
                break;
            case 3:
                buttonRotation.classList.add('rotate-135');
                break;
            case 4:
                buttonRotation.classList.add('rotate-180');
                break;
            case 5:
                buttonRotation.classList.add('-rotate-135');
                break;
            case 6:
                buttonRotation.classList.add('-rotate-90');
                break;
            case 7:
                buttonRotation.classList.add('-rotate-45');
                break;
            default:
                buttonRotation.classList.add('rotate-0');
        }
        buttonRotation.addEventListener('click', this._onRotationClick);

        buttonSelect.dataset.seedId = `${robot.seedId}`;
        buttonSelect.innerHTML = `${robot.seedId}`;
        buttonSelect.addEventListener('click', this._onSelectClick);

        buttonRemove.dataset.seedId = `${robot.seedId}`;
        buttonRemove.innerHTML = 'X';
        buttonRemove.addEventListener('click', this._onRemoveClick);

        return li;
    }

    _onRotationClick = (event: Event) => {
        const buttonRotation = event.target as HTMLElement;
        const seedId = parseFloat(buttonRotation.dataset.seedId);
        let rotation = parseInt(buttonRotation.dataset.rotation) + 1;
        if(rotation > 7) {
            rotation = 0;
        }
        buttonRotation.classList.remove('rotate-0');
        buttonRotation.classList.remove('rotate-45');
        buttonRotation.classList.remove('rotate-90');
        buttonRotation.classList.remove('rotate-135');
        buttonRotation.classList.remove('rotate-180');
        buttonRotation.classList.remove('-rotate-135');
        buttonRotation.classList.remove('-rotate-90');
        buttonRotation.classList.remove('-rotate-45');
        switch(rotation) {
            case 1:
                buttonRotation.classList.add('rotate-45');
                break;
            case 2:
                buttonRotation.classList.add('rotate-90');
                break;
            case 3:
                buttonRotation.classList.add('rotate-135');
                break;
            case 4:
                buttonRotation.classList.add('rotate-180');
                break;
            case 5:
                buttonRotation.classList.add('-rotate-135');
                break;
            case 6:
                buttonRotation.classList.add('-rotate-90');
                break;
            case 7:
                buttonRotation.classList.add('-rotate-45');
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

    renderRobots() {
        while(this.robotList.firstChild) {
            this.robotList.firstChild.firstChild.removeEventListener('click', this._onRotationClick);
            this.robotList.firstChild.removeChild(this.robotList.firstChild.firstChild);
            this.robotList.firstChild.firstChild.removeEventListener('click', this._onSelectClick);
            this.robotList.firstChild.removeChild(this.robotList.firstChild.firstChild);
            this.robotList.firstChild.firstChild.removeEventListener('click', this._onRemoveClick);
            this.robotList.firstChild.removeChild(this.robotList.firstChild.firstChild);
            this.robotList.removeChild(this.robotList.firstChild);
        }

        this.robots.forEach((robot) => {
            this.robotList.appendChild(this._createListItem(robot));
        });
    }
}
