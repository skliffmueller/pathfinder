/// <reference types="node" />
import { BaseEmitter } from "./BaseEmitter";

export interface DataLogRawItem {
    rawTimestamp: number;
    rawValue: number;
}

export interface DataLogItem {
    rawTimestamp: number;
    adjustedTimestamp: number;
    rawValue: number;
    adjustedValue: number;
    grams: number;
}

export interface DataLoggerConfig {
    zeroRawValue: number;
    unitsPerGram: number;
    triggerGrams: number;
}

export interface DataLog {
    name: string;
    config: DataLoggerConfig;
    items: DataLogItem[];

    startItem: DataLogItem;
    endItem: DataLogItem;
    peakItem: DataLogItem;

    fireTime: number;
    averageGrams: number;
}

export interface DataLoggerLocalStorageObject {
    [key: string]: DataLog;
}

export interface DataLoggerState {
    isZeroing: boolean;
    isCalibrating: boolean;
    isMonitoring: boolean;
    isCapturing: boolean;
    hasTriggered: boolean;
}

export interface DataLoggerEvent {
    state: DataLoggerState;
    data: DataLog;
    done: DataLog;
}

export class DataLogger extends BaseEmitter<DataLoggerEvent> {
    state: DataLoggerState;
    captureName: string;
    captureData: DataLog;
    _startTime: number;
    _tempItems: DataLogRawItem[];

    constructor() {
        super();
        this.state = {
            isZeroing: false,
            isCalibrating: false,
            isCapturing: false,
            hasTriggered: false,
            isMonitoring: false,
        };
        this._tempItems = [];
        this.captureData = {
            name: "",
            config: {
                zeroRawValue: 0,
                unitsPerGram: 0,
                triggerGrams: 0,
            },
            items: [],
            startItem: null,
            endItem: null,
            peakItem: null,
            fireTime: 0,
            averageGrams: 0,
        };
        this._startTime = -1;
        this.getConfig();
    }

    getConfig(key?: keyof DataLoggerConfig): number | DataLoggerConfig {
        const jsonString = localStorage.getItem("DataLogger_Config");
        if (jsonString) {
            const jsonObject = JSON.parse(jsonString);
            if(jsonObject !== null) {
                this.captureData.config = jsonObject as DataLoggerConfig;
            }
        }
        if (key !== undefined) {
            return this.captureData.config[key];
        }
        return this.captureData.config;
    }

    setConfig(key: keyof DataLoggerConfig, data: number) {
        this.captureData.config[key as keyof DataLoggerConfig] = data;
        localStorage.setItem("DataLogger_Config", JSON.stringify(this.captureData.config));
    }

    zeroCalibration() {
        this._startCalibrationTimeout("isZeroing", () => {
            const total = this._tempItems.reduce<number>((prev, next) => {
                prev += next.rawValue;
                return prev;
            }, 0);
            const average = total/this._tempItems.length;
            this.setConfig("zeroRawValue", average);
        });
    }

    referenceCalibration(grams: number) {
        this._startCalibrationTimeout("isCalibrating", () => {
            const zeroValue = this.getConfig("zeroRawValue") as number;
            const total = this._tempItems.reduce<number>((prev, next) => {
                prev += (next.rawValue - zeroValue);
                return prev;
            }, 0);
            const average = (total / this._tempItems.length) / grams;
            this.setConfig("unitsPerGram", average);
        });
    }

    _startCalibrationTimeout(stateKey: keyof DataLoggerState, callback: () => void) {
        this._tempItems = [];
        this.state[stateKey] = true;
        this.emit("state", this.state);
        setTimeout(() => {
            this.state[stateKey] = false;
            this.emit("state", this.state);
            callback();
        }, 5000);
    }

    addData({ rawTimestamp, rawValue }: DataLogRawItem) {

        // If Zeroing or Calibrating, only capture raw item and exit
        if (this.state.isZeroing || this.state.isCalibrating) {
            this._tempItems.push({ rawTimestamp, rawValue });
            return;
        }

        // We are not capturing or monitoring exit
        if (!this.state.isCapturing && !this.state.isMonitoring) {
            return;
        }

        // We are capturing or monitoring, grab configs and create currentItem
        const zeroRawValue = this.getConfig("zeroRawValue") as number;
        const unitsPerGram = this.getConfig("unitsPerGram") as number;
        const triggerGrams = this.getConfig("triggerGrams") as number;
        const adjustedValue = rawValue - zeroRawValue;
        const grams = adjustedValue / unitsPerGram;

        const currentItem: DataLogItem = {
            rawTimestamp,
            adjustedTimestamp: this._startTime !== -1 ? rawTimestamp - this._startTime : 0,
            rawValue,
            adjustedValue,
            grams,
        };

        // Monitor and Capture pushes currentItem into items array of captureData
        this.captureData.items.push(currentItem);

        if (this.state.isCapturing) {
            const minTimestamp = currentItem.rawTimestamp - 3000;

            if (this.state.hasTriggered) {
                if (this.captureData.peakItem === null
                    || this.captureData.peakItem.adjustedValue < currentItem.adjustedValue
                ) {
                    this.captureData.peakItem = currentItem;
                }

                this._updateCaptureLocalStorage();
                const stopCaptureItem = this.captureData.items.find(
                    (item) =>
                        (item.rawTimestamp >= minTimestamp && item.grams > triggerGrams)
                );
                if (!stopCaptureItem) {
                    this.state.hasTriggered = false;
                    this.state.isCapturing = false;
                    this._startTime = -1;
                    this.emit("state", this.state);
                    this.finalizeCaptureData();
                }
            } else {
                this.captureData.items = this.captureData.items.filter((item) => (item.rawTimestamp >= minTimestamp));
                if (currentItem.grams >= triggerGrams) {
                    this.state.hasTriggered = true;
                    this._startTime = currentItem.rawTimestamp;
                    this.captureData.items = this.captureData.items.map((item) => ({
                        ...item,
                        adjustedTimestamp: item.rawTimestamp - this._startTime,
                    }));
                    this.emit("state", this.state);
                }
            }
        } else if (this.state.isMonitoring) {
            const minTimestamp = currentItem.rawTimestamp - 5000;
            this.captureData.items = this.captureData.items.filter((item) => (item.rawTimestamp >= minTimestamp));
            this.captureData.peakItem = this.captureData.items.reduce((prev, curr) => {
                if (curr.adjustedValue > prev.adjustedValue) {
                    return curr;
                }
                return prev;
            }, currentItem);
        }
        this.emit("data", this.captureData);
    }

    _updateCaptureLocalStorage() {
        const jsonObject = (() => {
            try {
                const jsonString = localStorage.getItem("DataLogger_Data");
                const jsonObject = JSON.parse(jsonString);
                return jsonObject ? jsonObject : {};
            } catch(e) {
                return {};
            }
        })();
        jsonObject[this.captureData.name] = this.captureData;
        localStorage.setItem("DataLogger_Data", JSON.stringify(jsonObject));
    }

    finalizeCaptureData() {
        const { items } = this.captureData;

        const beforeFireTimestamp = items[0].rawTimestamp + 2000;
        const startItems = items.filter(
            (item) => (item.rawTimestamp < beforeFireTimestamp)
        );
        const afterFireTimestamp = items[items.length-1].rawTimestamp - 2000;
        const endItems = items.filter(
            (item) => (item.rawTimestamp > afterFireTimestamp)
        );
        const peakBeforeFireGrams = startItems.reduce((prev, curr) => {
            return curr.grams > prev ? curr.grams : prev;
        }, 0);
        const peakAfterFireGrams = endItems.reduce((prev, curr) => {
            return curr.grams > prev ? curr.grams : prev;
        }, 0);

        const filteredData = items.filter((item) => (
            item.rawTimestamp > beforeFireTimestamp
            && item.rawTimestamp < afterFireTimestamp
            && item.grams > peakBeforeFireGrams
            && item.grams > peakAfterFireGrams
        ));

        this.captureData.peakItem = filteredData.reduce((prev, curr) => (
            curr.grams > prev.grams ? curr : prev
        ), filteredData[0]);
        this.captureData.startItem = filteredData[0];
        this.captureData.endItem = filteredData[filteredData.length-1];
        this.captureData.fireTime = this.captureData.endItem.rawTimestamp - this.captureData.startItem.rawTimestamp;
        this.captureData.averageGrams = (filteredData.reduce((prev, curr) => (
            prev + curr.grams
        ), 0) / filteredData.length);

        this.captureData.items = this.captureData.items.filter((item) => {
            return item.rawTimestamp >= (this.captureData.startItem.rawTimestamp - 1000)
                    && item.rawTimestamp <= (this.captureData.endItem.rawTimestamp + 1000)
        });

        this.captureData.items = this.captureData.items.map((item) => ({
            ...item,
            adjustedTimestamp: item.rawTimestamp - this.captureData.startItem.rawTimestamp,
        }));

        this._updateCaptureLocalStorage();
        this.emit("done", this.captureData);
    }

    getCaptureNames() {
        const jsonObject = (() => {
            try {
                const jsonString = localStorage.getItem("DataLogger_Data");
                const jsonObject = JSON.parse(jsonString);
                return jsonObject ? jsonObject : {};
            } catch(e) {
                return {};
            }
        })();
        return Object.keys(jsonObject);
    }

    startMonitor() {
        this._resetCaptureData();
        this.state.isMonitoring = true;
        this.emit("state", this.state);
    }

    stopMonitor() {
        this.state.isMonitoring = false;
        this.emit("state", this.state);
    }

    getCaptureData(name: string) {
        const jsonObject = (() => {
            try {
                const jsonString = localStorage.getItem("DataLogger_Data");
                const jsonObject = JSON.parse(jsonString);
                return jsonObject;
            } catch(e) {
                return {};
            }
        })();

        return jsonObject[name] ?? null;
    }

    startCapture(name: string, triggerGrams: number = 0) {
        const captureNames = this.getCaptureNames();
        if (captureNames.indexOf(name) !== -1) {
            throw "Capture name already exists.";
        }
        this.setConfig("triggerGrams", triggerGrams);

        if (this.state.isMonitoring) {
            this.stopMonitor();
        }

        this._resetCaptureData();
        this.captureData.name = name;

        this._updateCaptureLocalStorage();

        this.state.hasTriggered = false;
        this.state.isCapturing = true;

        this.emit("state", this.state);
    }

    stopCapture() {
        this.state.isCapturing = false;
        this.state.hasTriggered = false;
        this.emit("state", this.state);
        this.emit("done", this.captureData);
    }

    _resetCaptureData() {
        this.captureData.items = [];
        this.captureData.startItem = null;
        this.captureData.endItem = null;
        this.captureData.peakItem = null;
        this.captureData.fireTime = 0;
        this.captureData.averageGrams = 0;
        this._startTime = -1;
    }
}