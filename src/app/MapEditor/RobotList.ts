import {
    SPRITE_WIDTH,
    SPRITE_HEIGHT,
} from "./index";

import type { MapRobot } from "../../typings/map.d";

import { HTMLView } from "../../lib/HTMLView";

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
type RobotItemElementList = {
    rotateButton: HTMLButtonElement;
    addTrackButton: HTMLButtonElement;
    trackIdInput: HTMLInputElement;
    removeButton: HTMLButtonElement;
    trackList: HTMLElement;
}
const RotationClassListLookup = [
    'rotate-0',
    'rotate-45',
    'rotate-90',
    'rotate-135',
    'rotate-180',
    '-rotate-135',
    '-rotate-90',
    '-rotate-45'
];
export class RobotItem extends HTMLView<RobotItemElementList> {
    seedId: number;
    rotation: number;
    trackIds: number[];

    onChange: (event: RobotEvent) => void;
    onRemove: (event: RobotEvent) => void;

    constructor(robot: MapRobot, imageUrl: string, onChange: (event: RobotEvent) => void, onRemove: (event: RobotEvent) => void) {
        super(RobotItemHTML);

        this.seedId = robot.seedId;
        this.rotation = robot.rotation;
        this.trackIds = robot.trackIds;
        this.onChange = onChange;
        this.onRemove = onRemove;

        this.childElements.rotateButton.style.width = `${SPRITE_WIDTH}px`;
        this.childElements.rotateButton.style.height = `${SPRITE_HEIGHT}px`;
        this.childElements.rotateButton.style.backgroundImage = `url(${imageUrl})`;

        this.childElements.rotateButton.addEventListener('click', this._onRotateClick);
        this.childElements.removeButton.addEventListener('click', this._onRemoveClick);
        this.childElements.addTrackButton.addEventListener('click', this._onTrackClick);

        this._addRotateButtonStyles();
        this._updateTrackList();
    }
    destroy = () => {
        this.childElements.rotateButton.removeEventListener('click', this._onRotateClick);
        this.childElements.removeButton.removeEventListener('click', this._onRemoveClick);
        this.childElements.addTrackButton.removeEventListener('click', this._onTrackClick);

        super.destroy();
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
        this.trackIds.push(parseInt(this.childElements.trackIdInput.value));
        this.trackIds.sort((a, b) => (a - b));
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
        while(this.childElements.trackList.firstChild) {
            this.childElements.trackList.firstChild.removeEventListener('click', this._onTrackItemClick);
            this.childElements.trackList.removeChild(this.childElements.trackList.firstChild);
        }

        this.trackIds.forEach((trackId) => {
            const button = document.createElement('button');
            button.classList.add('px-2', 'py-1', 'border', 'rounded');
            button.innerHTML = `${trackId}`;
            button.dataset.trackId = `${trackId}`;
            button.addEventListener('click', this._onTrackItemClick);
            this.childElements.trackList.appendChild(button);
        });
    }
    _removeRotateButtonStyle = () => {
        this.childElements.rotateButton.classList.remove(RotationClassListLookup[this.rotation]);
    }
    _addRotateButtonStyles = () => {
        this.childElements.rotateButton.classList.add(RotationClassListLookup[this.rotation]);
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
