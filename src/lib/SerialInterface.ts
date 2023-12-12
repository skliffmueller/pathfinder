/// <reference types="node" />
import { BaseEmitter } from "./BaseEmitter";

export class SerialInterface extends BaseEmitter<{"data":string,"connect": SerialPort}> {

    selectedPort: SerialPort;

    constructor() {
        super();
        // navigator.serial.addEventListener("connect", this._connect);
        // navigator.serial.addEventListener("disconnect", this._disconnect);
    }

    async requestDialog() {
        const port = await navigator.serial.requestPort();
        if(port) {
            this.selectedPort = port;
            await this.selectedPort.open({ baudRate: 9600 });
            this.emit("connect", this.selectedPort);
            this.startReading();
        }
    }

    async startReading() {
        const utf8Decoder = new TextDecoder("utf-8");
        const reader = this.selectedPort.readable.getReader();
        let { value: chunk, done: readerDone } = await reader.read();
        chunk = chunk ? utf8Decoder.decode(chunk, { stream: true }) : "";

        let re = /\r\n|\n|\r/gm;
        let startIndex = 0;

        for (;;) {
            let result = re.exec(chunk);
            if (!result) {
                if (readerDone) {
                    break;
                }
                let remainder = chunk.substring(startIndex);
                ({ value: chunk, done: readerDone } = await reader.read());
                chunk =
                    remainder + (chunk ? utf8Decoder.decode(chunk, { stream: true }) : "");
                startIndex = re.lastIndex = 0;
                continue;
            }
            this.emit("data", chunk.substring(startIndex, result.index));
            startIndex = re.lastIndex;
        }
        if (startIndex < chunk.length) {
            // last line didn't end in a newline char
            this.emit("data", chunk.substring(startIndex));
        }
    }

    // _connect = (event: Event) => this.emit("connect", event)
    // _disconnect = (event: Event) => this.emit("disconnect", event)
}