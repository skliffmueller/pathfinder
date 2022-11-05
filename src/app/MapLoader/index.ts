import {HTMLView} from "../../lib/HTMLView";
import type { MapData } from "../../typings/map.d";
import mapDataUrl from "../../assets/map.json";


const MapItemHTML = `
    <li class="bg-zinc-500 px-2 py-1"><a href="#" class="underline text-zinc-100" id="link"></a></li>
`;

type MapItemElements = {
    link: HTMLLinkElement;
}

const MapLoaderHTML = `
    <div class="bg-zinc-600 text-zinc-100 px-2 py-3 w-48">
        <span>Import JSON <input type="file" id="importInput" accept=".json" /></span>
        <button id="autosaveButton" class="border rounded px-2 py-1">Load Autosave</button>
        <ul id="mapList"></ul>
    </div>
`;

type MapLoaderElements = {
    mapList: HTMLUListElement;
    importInput: HTMLInputElement;
    autosaveButton: HTMLButtonElement;
}

export type MapLoaderEvent = {
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

        this.childElements.importInput.addEventListener('change', this._onImport);
        this.childElements.autosaveButton.addEventListener('click', this._onAutosave);
    }
    addElement(jsonUrl: string) {
        const mapItem = new HTMLView<MapItemElements>(MapItemHTML);
        mapItem.childElements.link.innerHTML = jsonUrl.split('/').pop();
        mapItem.childElements.link.href = jsonUrl;
        mapItem.childElements.link.addEventListener('click', this._onClick);
        this.childElements.mapList.appendChild(mapItem.rootElement);
        this.mapItemElements.push(mapItem);
    }
    removeElement(jsonUrl: string) {
        const index = this.mapItemElements.findIndex((mapItem) => (mapItem.childElements.link.href === jsonUrl));
        this.mapItemElements[index].childElements.link.removeEventListener('click', this._onClick);
        this.mapItemElements[index].destroy();
        this.mapItemElements.splice(index, 1);
    }
    _onImport = (event: Event) => {
        console.log(event);
        const input = event.target as HTMLInputElement;
        const jsonFile = input.files[0];
        jsonFile.text()
            .then(jsonString => this.onLoad({
                jsonUrl:"file://",
                mapData: JSON.parse(jsonString),
            }))
    }
    _onAutosave = (event: Event) => {
        const jsonString = localStorage.getItem('_autosave');
        if(jsonString) {
            this.onLoad({
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
    loadUrl(jsonUrl: string) {
        fetch(jsonUrl)
            .then<MapData>((response) => response.json())
            .then((mapData ) => this.onLoad({
                jsonUrl,
                mapData,
            }))
            .catch((e) => {
                console.log(e);
            });
    }
    destroy() {
        this.mapItemElements.forEach((mapItem) => {
           mapItem.childElements.link.removeEventListener('click', this._onClick);
        });
        super.destroy();
    }
}