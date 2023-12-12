import {HTMLView} from "../lib/HTMLView";
import {SVGIcon} from "../lib/SVGIcon";
import TrashIcon from "heroicons/24/solid/trash.svg"
import LoadIcon from "heroicons/24/solid/arrow-up-on-square.svg"
import CheckIcon from "heroicons/24/solid/check.svg"
import XMarkIcon from "heroicons/24/solid/x-mark.svg"

interface CaptureListElements {
    listItem: HTMLLIElement;
}

interface CaptureListEvents {
    load: string;
    remove: string;
}

const trashIcon = new SVGIcon(TrashIcon, "inline-block w-6 h-6");
const loadIcon = new SVGIcon(LoadIcon, "inline-block w-6 h-6");
const checkIcon = new SVGIcon(CheckIcon, "inline-block w-6 h-6");
const xMarkIcon = new SVGIcon(XMarkIcon, "inline-block w-6 h-6");

const CaptureListHTML = `
    <ul class="overflow-x-hidden overflow-y-scroll h-32 max-h-64 rounded-lg">
        <li id="listItem" class="group relative flex flex-1 p-4 py-3 mb-1 justify-between items-center bg-teal-700">
            <span>Some Name</span>
            <div class="absolute invisible group-hover:visible flex flex-1 justify-center items-center top-0 left-0 w-full h-full bg-opaque-800 text-center">
                <button class="buttonPrimary bg-teal-700 mx-3 px-6 py-1 rounded-lg"></button>
                <button class="buttonSecondary bg-red-700 mx-3 px-6 py-1 rounded-lg"></button>
            </div>
        </li>
    </ul>
`;

export class CaptureList extends HTMLView<CaptureListElements, HTMLUListElement, CaptureListEvents> {
    listElement: HTMLLIElement;
    trashToggle: boolean;
    constructor() {
        super(CaptureListHTML);

        this.listElement = this.childElements.listItem.cloneNode(true) as HTMLLIElement;
        this.listElement.id = null;
        this.listElement.querySelector(".buttonPrimary").append(loadIcon.rootElement);
        this.listElement.querySelector(".buttonSecondary").append(trashIcon.rootElement);
        this.childElements.listItem.remove();
    }
    addNames(names:string | string[]) {
        if (!Array.isArray(names)) {
            names = [names];
        }
        names.forEach((name) => {
            const listItem = this.listElement.cloneNode(true) as HTMLLIElement;
            listItem.dataset.name = name;
            listItem.querySelector("span").innerHTML = name;
            const primaryButton = listItem.querySelector(".buttonPrimary");
            const secondaryButton = listItem.querySelector(".buttonSecondary");
            listItem.addEventListener("mouseleave", this._onMouseLeave(listItem));
            primaryButton.addEventListener("click", this._loadItem(listItem, name));
            secondaryButton.addEventListener("click", this._trashItem(listItem));

            this.rootElement.append(listItem);
        });
    }
    removeNames(names:string | string[]) {
        if (!Array.isArray(names)) {
            names = [names];
        }
        const items = this.rootElement.querySelectorAll("li");
        for (const listItem of items) {
            if (names.indexOf(listItem.dataset.name) !== -1) {
                listItem.parentNode.removeChild(listItem);
            }
        }
    }
    removeAllNames() {
        const items = this.rootElement.querySelectorAll("li");
        for (const listItem of items) {
            listItem.parentNode.removeChild(listItem);
        }
    }
    turnOnTrashStyles(listItem: HTMLLIElement) {
        const primaryButton = listItem.querySelector(".buttonPrimary");
        const secondaryButton = listItem.querySelector(".buttonSecondary");

        CaptureList.removeAllChildNodes(primaryButton);
        CaptureList.removeAllChildNodes(secondaryButton);

        primaryButton.append(checkIcon.rootElement.cloneNode(true));
        secondaryButton.append(xMarkIcon.rootElement.cloneNode(true));
    }
    turnOffTrashStyles(listItem: HTMLLIElement) {
        const primaryButton = listItem.querySelector(".buttonPrimary");
        const secondaryButton = listItem.querySelector(".buttonSecondary");

        CaptureList.removeAllChildNodes(primaryButton);
        CaptureList.removeAllChildNodes(secondaryButton);

        primaryButton.append(loadIcon.rootElement.cloneNode(true));
        secondaryButton.append(trashIcon.rootElement.cloneNode(true));
    }
    _onMouseLeave = (listItem: HTMLLIElement) => (event: Event) => {
        this.turnOffTrashStyles(listItem);
        this.trashToggle = false;
    }
    _trashItem = (listItem: HTMLLIElement) => (event: Event) => {
        if(this.trashToggle) {
            this.turnOffTrashStyles(listItem);
            this.trashToggle = false;
        } else {
            this.turnOnTrashStyles(listItem);
            this.trashToggle = true;
        }
    }
    _loadItem = (listItem: HTMLLIElement, name: string) => (event: Event) => {
        if (this.trashToggle) {
            this.turnOffTrashStyles(listItem);
            this.trashToggle = false;
            this.emit("remove", name);

        } else {
            this.emit("load", name);
        }
    }
    static removeAllChildNodes(element: Node) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}