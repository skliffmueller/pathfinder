import {HTMLView} from "../../lib/HTMLView";
import type { MapData } from "../../typings/map.d";
import mapDataUrl from "../../assets/map.json";


const MapItemHTML = `
    <li class="py-1"><a href="#" class="underline" id="link"></a></li>
`;

type MapItemElements = {
    link: HTMLLinkElement;
}

const MapLoaderHTML = `
    <div class="px-2 py-3 w-64">
        <div class="my-2">Current Map: <br /><span id="currentMap">&nbsp;</span></div>
        <div class="flex justify-between">
            <button id="importButton" class="px-3 py-1 border rounded">Import JSON</button>
            <input class="hidden" type="file" id="importInput" accept=".json" />
            <button id="autosaveButton" class="border rounded px-2 py-1">Load Autosave</button>
        </div>
        <div id="mapListContainer" class="my-2 hidden">
            <label>Examples:</label>
            <ul id="mapList"></ul>
        </div>
    </div>
`;

type MapLoaderElements = {
    mapList: HTMLUListElement;
    mapListContainer: HTMLDivElement;
    currentMap: HTMLSpanElement;
    importButton: HTMLButtonElement;
    importInput: HTMLInputElement;
    autosaveButton: HTMLButtonElement;
}

export type MapLoaderEvent = {
    fileName: string;
    jsonUrl: string;
    mapData: MapData
};

export class MapLoader extends HTMLView<MapLoaderElements> {
    mapItemElements: HTMLView<MapItemElements>[];

    onLoad: (event: MapLoaderEvent) => void;

    constructor(onLoad: (event: MapLoaderEvent) => void) {
        super(MapLoaderHTML);
        this.mapItemElements = [];
        this.onLoad = onLoad;

        this.childElements.importButton.addEventListener('click', this._onImportButton);
        this.childElements.importInput.addEventListener('change', this._onImportFile);
        this.childElements.autosaveButton.addEventListener('click', this._onAutosave);
    }
    addElement(jsonUrl: string) {
        const mapItem = new HTMLView<MapItemElements>(MapItemHTML);
        mapItem.childElements.link.innerHTML = jsonUrl.split('/').pop();
        mapItem.childElements.link.href = jsonUrl;
        mapItem.childElements.link.addEventListener('click', this._onClick);
        this.childElements.mapList.appendChild(mapItem.rootElement);
        this.mapItemElements.push(mapItem);
        if(this.childElements.mapListContainer.classList.contains('hidden')) {
            this.childElements.mapListContainer.classList.remove('hidden');
        }
    }
    removeElement(jsonUrl: string) {
        const index = this.mapItemElements.findIndex((mapItem) => (mapItem.childElements.link.href === jsonUrl));
        this.mapItemElements[index].childElements.link.removeEventListener('click', this._onClick);
        this.mapItemElements[index].destroy();
        this.mapItemElements.splice(index, 1);
        if(!this.mapItemElements.length) {
            this.childElements.mapListContainer.classList.add('hidden');
        }
    }
    _onImportButton = (event: Event) => {
        this.childElements.importInput.click();
    };
    _onImportFile = (event: Event) => {
        const input = event.target as HTMLInputElement;
        const jsonFile = input.files[0];
        jsonFile.text()
            .then(jsonString => this._onLoad({
                fileName: jsonFile.name,
                jsonUrl: `file://./${jsonFile.name}`,
                mapData: JSON.parse(jsonString),
            }))
    }
    _onAutosave = (event: Event) => {
        const jsonString = localStorage.getItem('_autosave');
        if(jsonString) {
            this._onLoad({
                fileName: '(autosave)',
                jsonUrl:"localstorage://",
                mapData: JSON.parse(jsonString),
            })
        }
    }
    _onClick = (event: Event) => {
        event.preventDefault();
        const link = event.target as HTMLLinkElement;
        this.loadUrl(link.href);
        return false;
    }
    _onLoad = (event: MapLoaderEvent) => {
        this.childElements.currentMap.innerHTML = encodeURIComponent(event.fileName);
        this.onLoad(event);
    }
    autosave(mapData: MapData) {
        const jsonString = JSON.stringify(mapData);
        localStorage.setItem('_autosave', jsonString);
    }
    loadUrl(jsonUrl: string) {
        fetch(jsonUrl)
            .then<MapData>((response) => response.json())
            .then((mapData ) => this._onLoad({
                fileName: jsonUrl.split('/').pop(),
                jsonUrl,
                mapData,
            }))
            .catch((e) => {
                console.log(e);
            });
    }
    loadAutosave() {
        this._onAutosave({} as Event);
    }
    destroy() {
        this.mapItemElements.forEach((mapItem) => {
           mapItem.childElements.link.removeEventListener('click', this._onClick);
        });
        super.destroy();
    }
}