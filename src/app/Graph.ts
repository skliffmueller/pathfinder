import {HTMLView} from "../lib/HTMLView";
import { DataLog, DataLoggerState, DataLogItem } from "../lib/DataLogger";

interface GraphDisplayProperties {
    minTime: number;
    maxTime: number;
    minScale: number;
    maxScale: number;
}

interface DrawGraphOptions {
    hideTimeText?: boolean;
    hideScaleText?: boolean;
}

interface GraphCords {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface GraphOffsets {
    graph: GraphCords;
    metrics: GraphCords;
    statics: GraphCords;
}

export interface GraphMetrics {
    captureName: string;
    timestamp: number;
    value: number;
    adjustedValue: number;
    grams: number;
    peakGrams: number;
    isZeroing: boolean;
    isCalibrating: boolean;
    isCapturing: boolean;
    isMonitoring: boolean;
}

const graphStyles = {
    base: {
        width: 960,
        height: 540,
        backgroundColor: "#000000",
    },
    time: {
        axisStrokeStyle:"#ffffff",
        shortTickStrokeStyle: "#ffffff",
        longTickStrokeStyle: "#ffffff",
        gridStrokeStyle: "rgba(255,255,255,0.4)",
        tickFont: "1.5rem \"Tahoma\", sans-serif",
        tickFontFillStyle: "#ffffff",
    },
    scale: {
        axisStrokeStyle:"#ffffff",
        shortTickStrokeStyle: "#ffffff",
        longTickStrokeStyle: "#ffffff",
        gridStrokeStyle: "rgba(255,255,255,0.4)",
        tickFont: "1.5rem \"Tahoma\", sans-serif",
        tickFontFillStyle: "#ffffff",
    },
    metrics: {
        labelFont: "2rem \"Tahoma\", sans-serif",
        labelFontFillStyle: "#ffffff",
        valueFont: "2rem \"Tahoma\", sans-serif",
        valueFontFillStyle: "#ffffff",
    },
    lines: {
        // hotColor: "#ff4000",
        // warmColor: "#ffc000",
        // coldColor: "#00ffc0",
        hotColor: "#dc2626",
        warmColor: "#fde047",
        coldColor: "#22d3ee",
        peakLineColor: "#f43f5e",
        peakMarkerColor: "",
    },
};

export class Graph {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    displayProperties: GraphDisplayProperties;
    graphOffsets: GraphOffsets;
    counter: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvas.width = graphStyles.base.width * 2;
        this.canvas.height = graphStyles.base.height * 2;
        this.canvas.style.width = `${graphStyles.base.width}px`;
        this.canvas.style.height = `${graphStyles.base.height}px`;
        this.ctx = this.canvas.getContext("2d");
        this.displayProperties = {
            minTime: 189296,
            maxTime: 214450,
            minScale: 0,
            maxScale: 545679,
        };
        const widthUnit = this.canvas.width / 6;

        this.graphOffsets = {
            graph: {
                x: 0,
                y: 0,
                width: this.canvas.width - widthUnit,
                height: this.canvas.height
            },
            metrics: {
                x: this.canvas.width - widthUnit,
                y: 0,
                width: widthUnit,
                height: this.canvas.height,
            },
            statics: {
                x: this.canvas.width - widthUnit,
                y: this.canvas.height - 340,
                width: widthUnit,
                height: this.canvas.height,
            },
        };

        this.counter = 0;
    }
    clearStatics() {
        this.clearRect(this.graphOffsets.statics);
    }
    clearGraph() {
        this.clearRect(this.graphOffsets.graph);
    }
    clearMetrics() {
        this.clearRect(this.graphOffsets.metrics);
    }
    clearRect(cords: GraphCords) {
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.clearRect(cords.x,cords.y,cords.width,cords.height);

        this.ctx.fillStyle = graphStyles.base.backgroundColor;
        this.ctx.fillRect(cords.x,cords.y,cords.width,cords.height);
    }

    drawStatics() {
        this.clearStatics();
        //
        // const hotRgb = Graph.hex2rgb(graphStyles.lines.hotColor);
        // const warmRgb = Graph.hex2rgb(graphStyles.lines.warmColor);
        // const coldRgb = Graph.hex2rgb(graphStyles.lines.coldColor);
        //
        // this.ctx.beginPath();
        // this.ctx.lineWidth = 4;
        // if (percent > 0) {
        //     this.ctx.strokeStyle = Graph.rgb2hex(Graph.interpolateColor(warmRgb, hotRgb, percent));
        // } else if (percent < 0) {
        //     this.ctx.strokeStyle = Graph.rgb2hex(Graph.interpolateColor(warmRgb, coldRgb, percent*-1));
        // } else {
        //     this.ctx.strokeStyle = graphStyles.lines.warmColor;
        // }
        // this.ctx.moveTo(originX + prevX, originY + prevY);
        // this.ctx.lineTo(originX + currentX, originY + currentY);
        // this.ctx.stroke();
    }
    drawState(state: DataLoggerState) {
        // this.clearState();

        if (state?.isCalibrating) {
            this.drawLabelAndValue(
                "State:",
                "Calibrating",
                600
            );
        } else if (state?.isCapturing) {
            this.drawLabelAndValue(
                "State:",
                "Capturing",
                600
            );
        } else if (state?.isMonitoring) {
            this.drawLabelAndValue(
                "State:",
                "Monitoring",
                600
            );
        } else if (state?.isZeroing) {
            this.drawLabelAndValue(
                "State:",
                "Taring",
                600
            );
        } else {
            this.drawLabelAndValue(
                "State:",
                "Idle",
                600
            );
        }
    }
    drawMetrics(data?: DataLog) {
        const currentItem = data?.items[data.items.length-1] ?? null;
        const peakItem = data?.peakItem;

        this.clearMetrics();

        this.drawLabelAndValue(
            "Capture Name:",
            data?.name ? data.name : "(empty)",
            0
        );
        this.drawLabelAndValue(
            "Timestamp:",
            currentItem?.rawTimestamp ? `${currentItem.rawTimestamp}ms` : "0ms",
            100
        );
        this.drawLabelAndValue(
            "Raw Units:",
            currentItem?.rawValue ? `${currentItem.rawValue}` : "0",
            200
        );
        this.drawLabelAndValue(
            "Adjusted Units:",
            currentItem?.adjustedValue ? `${currentItem.adjustedValue.toFixed(3)}` : "0",
            300
        );
        this.drawLabelAndValue(
            "Grams:",
            currentItem?.grams ? `${currentItem.grams === Infinity ? "∞" : Math.round(currentItem.grams)}g` : "0g",
            400
        );
        this.drawLabelAndValue(
            "Peak:",
            peakItem?.grams ? `${peakItem.grams === Infinity ? "∞" : Math.round(peakItem.grams)}g` : "0g",
            500
        );
        this.drawLabelAndValue(
            "Fire Time:",
            data?.fireTime ? `${data.fireTime}ms` : "0ms",
            600
        );
    }

    drawLabelAndValue(label: string, value: string, offsetY: number) {
        const originX = this.graphOffsets.metrics.x + 20;
        const maxY = this.graphOffsets.metrics.y + 40;

        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.font = graphStyles.metrics.labelFont;
        this.ctx.fillStyle = graphStyles.metrics.labelFontFillStyle;
        const labelSize = this.ctx.measureText(label);
        this.ctx.fillText(label, originX, maxY + offsetY);
        this.ctx.font = graphStyles.metrics.valueFont;
        this.ctx.fillStyle = graphStyles.metrics.valueFontFillStyle;
        this.ctx.fillText(value, originX, maxY + offsetY + labelSize.actualBoundingBoxDescent + 6);
    }

    drawGraph(options: DrawGraphOptions = {}, scaleItems: DataLogItem[] = []) {
        this.clearGraph();

         const {
             minAdjustedTime,
             maxAdjustedTime,
             minTime,
             maxTime,
             minScale,
             maxScale,
             peakItem,
         } = scaleItems.reduce((prev, curr, index) => {
            if (index === 0) {
                return {
                    minAdjustedTime: curr.adjustedTimestamp,
                    maxAdjustedTime: curr.adjustedTimestamp,
                    minTime: curr.rawTimestamp,
                    maxTime: curr.rawTimestamp,
                    minScale: 0, // curr.grams,
                    maxScale: 5000,
                    peakItem: curr,
                }
            }
            return {
                minAdjustedTime: prev.minAdjustedTime > curr.adjustedTimestamp ? curr.adjustedTimestamp : prev.minAdjustedTime,
                maxAdjustedTime: prev.maxAdjustedTime > curr.adjustedTimestamp ? curr.adjustedTimestamp : prev.maxAdjustedTime,
                minTime: prev.minTime > curr.rawTimestamp ? curr.rawTimestamp : prev.minTime,
                maxTime: prev.maxTime < curr.rawTimestamp ? curr.rawTimestamp : prev.maxTime,
                minScale: 0, // prev.minScale > curr.grams ? curr.grams : prev.minScale,
                peakItem: prev.maxScale < curr.grams ? curr : prev.peakItem,
                maxScale: prev.maxScale < curr.grams ? curr.grams : prev.maxScale,
            }
        }, { minAdjustedTime: 0, maxAdjustedTime: 0, minTime: 0, maxTime: 0, minScale: 0, maxScale: 0, peakItem: null });

        this.displayProperties = {
            minTime,
            maxTime,
            minScale,
            maxScale,
        };
        this.displayProperties.maxScale += 1000;

        const originX = this.graphOffsets.graph.x + 120;
        const originY = (this.graphOffsets.graph.y + this.graphOffsets.graph.height) - 120;
        const maxX = (this.graphOffsets.graph.x + this.graphOffsets.graph.width) - 20;
        const maxY = this.graphOffsets.graph.y + 40;

        // Time ticks
        const totalMs = this.displayProperties.maxTime - this.displayProperties.minTime;
        const timeDivisions = Math.ceil(totalMs / 250);
        const timeRemainder = totalMs % 250;
        const xSteps = (maxX - originX) / timeDivisions;
        const xStepAdj = ((timeRemainder / 250) * xSteps) / timeDivisions;
        const timeLabelOffset = Math.floor(minAdjustedTime / 1000);

        for(let i=0;i<=timeDivisions;i++) {
            const xOffset = ((xSteps - xStepAdj) * i);
            const isLongLine = !(i % 4);

            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = isLongLine
                ? graphStyles.time.longTickStrokeStyle
                : graphStyles.time.shortTickStrokeStyle;
            this.ctx.moveTo(originX + xOffset, originY);
            this.ctx.lineTo(originX + xOffset, originY + (isLongLine ? 16 : 8));
            this.ctx.stroke();

            if (isLongLine) {
                if (!options.hideTimeText) {
                    const text = `${(i/4) + timeLabelOffset}`;
                    this.ctx.font = graphStyles.time.tickFont;
                    this.ctx.fillStyle = graphStyles.time.tickFontFillStyle;
                    this.ctx.textAlign = "center";
                    this.ctx.textBaseline = "top";
                    this.ctx.fillText(text, originX + xOffset, originY + 24);
                }

                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = graphStyles.time.gridStrokeStyle;
                this.ctx.moveTo(originX + xOffset, originY);
                this.ctx.lineTo(originX + xOffset, maxY);
                this.ctx.stroke();
            }

        }

        // Time Axis Draw
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = graphStyles.time.axisStrokeStyle;
        this.ctx.moveTo(originX, originY);
        this.ctx.lineTo(maxX, originY);
        this.ctx.stroke();


        // Scale ticks
        const totalScale = this.displayProperties.maxScale - this.displayProperties.minScale;
        const scaleDivisions = Math.ceil(totalScale / 500);
        const ySteps = (maxY - originY) / scaleDivisions;

        for(let i=0;i<=scaleDivisions;i++) {
            const yOffset = ySteps * i;
            const isLongLine = !(i % 5);

            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = isLongLine
                ? graphStyles.scale.longTickStrokeStyle
                : graphStyles.scale.shortTickStrokeStyle;
            this.ctx.moveTo(originX, originY + yOffset);
            this.ctx.lineTo(originX - (isLongLine ? 16 : 8), originY + yOffset);
            this.ctx.stroke();

            if (isLongLine) {
                if (!options.hideScaleText) {
                    const text = `${(i/2).toFixed(1)}`;
                    this.ctx.font = graphStyles.scale.tickFont;
                    this.ctx.fillStyle = graphStyles.scale.tickFontFillStyle;
                    this.ctx.textAlign = "right";
                    this.ctx.textBaseline = "middle";
                    this.ctx.fillText(text, originX - 24, originY + yOffset);
                }

                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = graphStyles.scale.gridStrokeStyle;
                this.ctx.moveTo(originX, originY + yOffset);
                this.ctx.lineTo(maxX, originY + yOffset);
                this.ctx.stroke();
            }
        }

        // Scale Axis Draw
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = graphStyles.scale.axisStrokeStyle;
        this.ctx.moveTo(originX, originY);
        this.ctx.lineTo(originX, maxY);
        this.ctx.stroke();

        const halfPi = Math.PI/2;
        const hotRgb = Graph.hex2rgb(graphStyles.lines.hotColor);
        const warmRgb = Graph.hex2rgb(graphStyles.lines.warmColor);
        const coldRgb = Graph.hex2rgb(graphStyles.lines.coldColor);
        const xUnitsPerMs = (maxX - originX) / totalMs;
        const yUnitsPerGram = (maxY - originY) / totalScale;
        for(let i=1;i<scaleItems.length;i++) {
            const prevItem = scaleItems[i-1];
            const currItem = scaleItems[i];

            const prevX = (prevItem.rawTimestamp - this.displayProperties.minTime) * xUnitsPerMs;
            const prevY = prevItem.grams * yUnitsPerGram;

            const currentX = (currItem.rawTimestamp - this.displayProperties.minTime) * xUnitsPerMs;
            const currentY = currItem.grams * yUnitsPerGram;

            // const opposite = currentY - prevY; // tangent
            // const adjacent = currentX - prevX;
            const opposite = currItem.grams - prevItem.grams; // tangent
            const adjacent = (currItem.rawTimestamp - prevItem.rawTimestamp) * 2;
            const percent = Math.atan(opposite / adjacent) / halfPi;

            this.ctx.beginPath();
            this.ctx.lineWidth = 4;
            if (percent > 0) {
                this.ctx.strokeStyle = Graph.rgb2hex(Graph.interpolateColor(warmRgb, hotRgb, percent));
            } else if (percent < 0) {
                this.ctx.strokeStyle = Graph.rgb2hex(Graph.interpolateColor(warmRgb, coldRgb, percent*-1));
            } else {
                this.ctx.strokeStyle = graphStyles.lines.warmColor;
            }
            this.ctx.moveTo(originX + prevX, originY + prevY);
            this.ctx.lineTo(originX + currentX, originY + currentY);
            this.ctx.stroke();

            if (peakItem.rawTimestamp === currItem.rawTimestamp) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = graphStyles.lines.peakLineColor;
                this.ctx.moveTo(originX + currentX, originY);
                this.ctx.lineTo(originX + currentX, maxY);
                this.ctx.stroke();
            }
        }
    }
    static hex2rgb(hex: string) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }
    static rgb2hex(rgb: number[]) {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    }
    static interpolateColor(color1: number[], color2: number[], factor: number) {
        if (arguments.length < 3) { factor = 0.5; }
        let result = color1.slice();
        for (let i=0;i<3;i++) {
            result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
        }
        return result;
    }
}