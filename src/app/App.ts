import {HTMLView} from "../lib/HTMLView";
import {SerialInterface} from "../lib/SerialInterface";
import {Graph, GraphMetrics} from "./Graph";
import {StringFormat} from "../lib/StringFormat";
import {CaptureList} from "./CaptureList";
import {DataLog, DataLogger, DataLoggerState} from "../lib/DataLogger";

type AppElements = {
    requestSerial: HTMLButtonElement;
    connectOverlay: HTMLDivElement;
    graphCanvas: HTMLCanvasElement;
    graphMessage: HTMLDivElement;
    graphMessageContent: HTMLDivElement;
    zeroScale: HTMLButtonElement;
    calibrateGrams: HTMLInputElement;
    calibrateScale: HTMLButtonElement;
    startMonitor: HTMLButtonElement;
    captureName: HTMLInputElement;
    triggerGrams: HTMLInputElement;
    startCapture: HTMLButtonElement;
    captureListContainer: HTMLDivElement;
    exportJSON: HTMLButtonElement;
};

const AppHTML = `
    <div class="flex w-screen max-w-7xl min-h-64">
        <div class="w-3/4">
            <div class="relative inline-block">
                <canvas id="graphCanvas"></canvas>
                <div id="graphMessage" class="absolute top-0 left-0 w-full h-full flex flex-1 justify-center items-center">
                    <div id="graphMessageContent" class="rounded-lg px-4 py-3 bg-sky-800">Calibrating...</div>
                </div>
            </div>
        </div>
        <div id="controls" class="w-1/4">
            <div class="relative mt-2 mx-3 px-3 py-4 rounded-lg bg-slate-800">
                <input id="calibrateGrams" name="calibrateGrams" placeholder="Calibration Grams (45g)" class="block rounded px-2 py-1 bg-slate-900 text-slate-100 w-full" />
                <div class="flex flex-1 justify-stretch items-center gap-2 mt-2">
                    <button id="zeroScale" class="bg-teal-700 px-4 py-2 rounded-lg w-full">Tare Scale</button>
                    <button id="calibrateScale" class="bg-teal-700 px-4 py-2 rounded-lg w-full">Calibrate</button>
                </div>
                <button id="startMonitor" class="block bg-teal-700 px-4 py-2 mt-4 rounded-lg w-full">Start Monitor</button>
                <input id="captureName" name="captureName" placeholder="Capture_Name" class="block rounded px-2 py-1 mt-4 bg-slate-900 text-slate-100 w-full" />
                <input id="triggerGrams" name="triggerGrams" placeholder="Trigger Grams (5)" class="block rounded px-2 py-1 mt-2 bg-slate-900 text-slate-100 w-full" />
                <button id="startCapture" class="block bg-teal-700 px-4 py-2 mt-2 rounded-lg w-full">Capture</button>
                <div id="connectOverlay" class="absolute top-0 left-0 w-full h-full flex flex-1 justify-center items-center rounded-lg bg-opaque-800">
                    <button id="requestSerial" class="bg-teal-700 px-4 py-2 rounded-lg">Connect</button>
                </div>
            </div>
            <div class="mt-2 mx-3 px-3 py-4 rounded-lg bg-slate-800">
                <div class="flex flex-1 justify-stretch items-center gap-2">
                    <button class="bg-teal-700 px-4 py-2 rounded-lg w-full">Export PNG</button>
                    <button id="exportJSON" class="bg-teal-700 px-4 py-2 rounded-lg w-full">Export JSON</button>
                </div>
                <button class="block bg-teal-700 px-4 py-2 mt-2 rounded-lg w-full">Import JSON</button>
                <div id="captureListContainer" class="mt-4"></div>
            </div>
        </div>
    </div>
`;

export class App extends HTMLView<AppElements> {

    serialInterface: SerialInterface;
    graph: Graph;
    dataLogger: DataLogger;
    captureList: CaptureList;
    currentDataLog: DataLog;
    currentDataLoggerState: DataLoggerState;

    constructor() {
        super(AppHTML);

        this.currentDataLog = null;
        this.currentDataLoggerState = {
            isZeroing: false,
            isCalibrating: false,
            isCapturing: false,
            hasTriggered: false,
            isMonitoring: false,
        };
        this.dataLogger = new DataLogger();

        this.graph = new Graph(this.childElements.graphCanvas);
        setTimeout(() => {
            window.requestAnimationFrame(() => {
                this.graph.drawGraph();
                this.graph.drawMetrics();
            });
        }, 10);

        this.dataLogger.on("data", (data) => {
            window.requestAnimationFrame(() => {
                this.graph.drawMetrics(data);
                this.graph.drawGraph({}, data.items);
            });
        });
        this.dataLogger.on("state", this._dataLoggerState);

        this.serialInterface = new SerialInterface();
        this.serialInterface.on("data", (data) => {
            const splitLine = data.split(":");
            if(splitLine.length == 2) {
                this.dataLogger.addData({
                    rawTimestamp: parseInt(splitLine[0]),
                    rawValue: parseInt(splitLine[1])
                });
            }
        });
        this.serialInterface.on("connect", (event) => {
            this.childElements.connectOverlay.classList.add("hidden");
        });


        this.captureList = new CaptureList();
        this.childElements.captureListContainer.append(this.captureList.rootElement);
        this.refreshCaptureList();

        this.captureList.on("load", (name) => {
            this.currentDataLog = this.dataLogger.getCaptureData(name);
            this.graph.drawMetrics(this.currentDataLog);
            this.graph.drawGraph({}, this.currentDataLog.items);
            console.log("Name load: ", this.currentDataLog.name);
        });
        this.captureList.on("remove", (name) => {
            console.log("Name remove: ", name);
        });

        this.dataLogger.on("done", this._dataLoggerDone);

        this.childElements.graphMessage.classList.add("hidden");

        this.childElements.requestSerial.addEventListener("click", this._requestSerial);
        this.childElements.zeroScale.addEventListener("click", this._zeroScale);
        this.childElements.calibrateScale.addEventListener("click", this._calibrateScale);
        this.childElements.startMonitor.addEventListener("click", this._toggleMonitor);
        this.childElements.startCapture.addEventListener("click", this._startCapture);
        this.childElements.exportJSON.addEventListener("click", this._exportJSON);
    }
    _startCapture = () => {
        const captureName = StringFormat.parse(this.childElements.captureName.value);
        const triggerGrams = parseInt(this.childElements.triggerGrams.value);

        if (!captureName.length) {
            throw "Please set a capture name.";
        }

        this.dataLogger.startCapture(captureName, triggerGrams);
    }
    _requestSerial = () => {
        this.serialInterface.requestDialog();
    }
    _zeroScale = () => {
        this.dataLogger.zeroCalibration();
    }
    _calibrateScale = () => {
        const grams = parseInt(this.childElements.calibrateGrams.value);
        this.dataLogger.referenceCalibration(grams);
    }
    _toggleMonitor = () => {
        this.currentDataLoggerState.isMonitoring ? this.dataLogger.stopMonitor() : this.dataLogger.startMonitor();
    }
    _dataLoggerState = (state: DataLoggerState) => {
        if (state.isZeroing) {
            this.childElements.graphMessageContent.innerHTML = "Taring...";
        } else if (state.isCalibrating) {
            this.childElements.graphMessageContent.innerHTML = "Calibrating...";
        } else if (state.isCapturing && !state.hasTriggered) {
            this.childElements.graphMessageContent.innerHTML = "Capturing, Waiting for trigger...";
        }

        if (state.isZeroing || state.isCalibrating || (state.isCapturing && !state.hasTriggered)) {
            this.childElements.graphMessage.classList.remove("hidden");
        } else {
            this.childElements.graphMessage.classList.add("hidden");
        }

        if (state.isMonitoring) {
            this.childElements.startMonitor.innerHTML = "Stop Monitor";
        } else {
            this.childElements.startMonitor.innerHTML = "Start Monitor";
        }
        this.currentDataLoggerState = state;
        window.requestAnimationFrame(() => {
            this.graph.drawState(this.currentDataLoggerState);
        });
    }
    _dataLoggerDone = (data: DataLog) => {
        this.refreshCaptureList();
    }
    _exportJSON = () => {
        const downloadData = JSON.stringify(this.currentDataLog, null, 2);
        let element = document.createElement('a');
        element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(downloadData));
        element.setAttribute('download', `${this.currentDataLog.name}.json`);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
    refreshCaptureList() {
        const captureNames = this.dataLogger.getCaptureNames();
        this.captureList.removeAllNames();
        this.captureList.addNames(captureNames);
    }
}