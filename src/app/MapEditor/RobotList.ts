import {
    SPRITE_WIDTH,
    SPRITE_HEIGHT,
    MapRobot,
} from "./index";

export type RobotEvent = {
    seedId: number;
    rotation?: number;
    trackIds?: number[];
};

const RobotItemHTML = `
    <li class="px-2 py-3 border">
        <div class="flex justify-between w-full">
            <button id="rotateButton" class="inline-block bg-no-repeat bg-center bg-pyth-hyp">&nbsp;</button>
            <div>
                <input class="w-12" id="trackIdInput" type="number" min="1" max="255" value="1" />
                <button id="addTrackButton" class="inline-block">Add Track</button>
            </div>
            <button id="removeButton" class="inline-block px-3 py-2 border">X</button>
        </div>
        <div class="w-full" id="trackList"></div>
    </li>
`;
const RotationClassListLookup = [
    'rotate-0',
    'rotate-45',
    'rotate-135',
    'rotate-180',
    '-rotate-135',
    '-rotate-90',
    '-rotate-45'
];
export class RobotItem {
    seedId: number;
    rotation: number;
    trackIds: number[];

    onChange: (event: RobotEvent) => void;
    onRemove: (event: RobotEvent) => void;

    rootElement: HTMLElement;
    rotateButton: HTMLButtonElement;
    addTrackButton: HTMLButtonElement;
    trackIdInput: HTMLInputElement;
    removeButton: HTMLButtonElement;
    trackList: HTMLElement;

    constructor(robot: MapRobot, imageUrl: string, onChange: (event: RobotEvent) => void, onRemove: (event: RobotEvent) => void) {
        this.seedId = robot.seedId;
        this.rotation = robot.rotation;
        this.trackIds = robot.trackIds;
        this.onChange = onChange;
        this.onRemove = onRemove;

        const temp = document.createElement('div');
        temp.innerHTML = RobotItemHTML;
        this.rootElement = temp.querySelector<HTMLElement>('li');

        this.rotateButton = this.rootElement.querySelector<HTMLButtonElement>('#rotateButton');
        this.addTrackButton = this.rootElement.querySelector<HTMLButtonElement>('#addTrackButton');
        this.trackIdInput = this.rootElement.querySelector<HTMLInputElement>('#trackIdInput');
        this.removeButton = this.rootElement.querySelector<HTMLButtonElement>('#removeButton');
        this.trackList = this.rootElement.querySelector<HTMLElement>('#trackList');

        this.rotateButton.style.width = `${SPRITE_WIDTH}px`;
        this.rotateButton.style.height = `${SPRITE_HEIGHT}px`;
        this.rotateButton.style.backgroundImage = `url(${imageUrl})`;

        this.rotateButton.addEventListener('click', this._onRotateClick);
        this.removeButton.addEventListener('click', this._onRemoveClick);
        this.addTrackButton.addEventListener('click', this._onTrackClick);

        this._addRotateButtonStyles();
        this._updateTrackList();
    }
    destroy = () => {
        this.rotateButton.removeEventListener('click', this._onRotateClick);
        this.removeButton.removeEventListener('click', this._onRemoveClick);
        this.addTrackButton.removeEventListener('click', this._onTrackClick);

        this.rootElement.removeChild(this.rootElement.firstChild);
    }
    _onRotateClick = (event: Event) => {
        this._removeRotateButtonStyle();
        this.rotation++;
        if(this.rotation > 7) {
            this.rotation = 0;
        }
        this._addRotateButtonStyles();
        this.onChange({
            seedId: this.seedId,
            rotation: this.rotation,
        });
    }
    _onRemoveClick = (event: Event) => {
        this.onRemove({ seedId: this.seedId });
        this.destroy();
    }
    _onTrackClick = (event: Event) => {
        console.log(this.trackIds);
        this.trackIds.push(parseInt(this.trackIdInput.value));
        console.log(this.trackIds);
        this.trackIds.sort((a, b) => (a - b));
        console.log(this.trackIds);
        this.onChange({
            seedId: this.seedId,
            trackIds: this.trackIds,
        });
        this._updateTrackList();
    }
    _onTrackItemClick = (event: Event) => {
        const buttonElement = event.target as HTMLButtonElement;
        const trackId = parseInt(buttonElement.dataset.trackId);
        this.trackIds = this.trackIds.filter((t) => (t !== trackId));
        this.onChange({
            seedId: this.seedId,
            trackIds: this.trackIds,
        });
        this._updateTrackList();
    };
    _updateTrackList = () => {
        while(this.trackList.firstChild) {
            this.trackList.firstChild.removeEventListener('click', this._onTrackItemClick);
            this.trackList.removeChild(this.trackList.firstChild);
        }

        this.trackIds.forEach((trackId) => {
            const button = document.createElement('button');
            button.classList.add('px-2', 'py-1', 'border', 'rounded');
            button.innerHTML = `${trackId}`;
            button.dataset.trackId = `${trackId}`;
            button.addEventListener('click', this._onTrackItemClick);
            this.trackList.appendChild(button);
        });
    }
    _removeRotateButtonStyle = () => {
        this.rotateButton.classList.remove(RotationClassListLookup[this.rotation]);
    }
    _addRotateButtonStyles = () => {
        this.rotateButton.classList.add(RotationClassListLookup[this.rotation]);
    }
}

export class RobotList {
    image: HTMLImageElement;
    robotList: HTMLElement;

    robots: MapRobot[];
    robotItems: RobotItem[];

    onChange: (event: RobotEvent) => void;
    onRemove: (event: RobotEvent) => void;

    constructor(
        robotList: HTMLElement,
        onChange: (event: RobotEvent) => void,
        onRemove: (event: RobotEvent) => void
    ) {
        this.robots = [];
        this.robotItems = [];
        this.robotList = robotList;
        this.onChange = onChange;
        this.onRemove = onRemove;
    }

    setSpriteImage(imageUrl: string) {
        this.image = new Image();
        this.image.src = imageUrl;
    }

    updateRobots(robots: MapRobot[]) {
        this.robots = robots;
        this.renderRobots();
    }

    _onRobotItemChange = (event: RobotEvent) => {
        const index = this.robots.findIndex(({ seedId }) => (seedId === event.seedId));
        this.robots[index] = {
            ...this.robots[index],
            ...event,
        };
        this.onChange(event);
    }

    _onRobotItemRemove = (event: RobotEvent) => {
        this.robots = this.robots.filter(({ seedId }) => (seedId !== event.seedId));
        this.onRemove(event);
    }
    renderRobots() {
        this.robotItems.forEach(robotItem => (robotItem.destroy()));
        this.robotItems = [];

        while(this.robotList.firstChild) {
            this.robotList.removeChild(this.robotList.firstChild);
        }

        this.robots.forEach((robot) => {
            const robotItem = new RobotItem(robot, this.image.src, this._onRobotItemChange, this._onRobotItemRemove);
            this.robotList.appendChild(robotItem.rootElement);
        });
    }
}
