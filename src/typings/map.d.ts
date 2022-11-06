export interface MapCell {
    seedId: number;
    speed: number;
    trackId: number;
    spriteIndex: number;
    rotation: number; // (rotation * 90deg)
    x: number;
    y: number;
}
export interface MapCellOptions {
    seedId?: number;
    spriteIndex?: number;
    rotation?: number; // (rotation * 90deg)
    x?: number;
    y?: number;
}

export interface MapRobot {
    seedId: number;
    rotation: number; // (rotation * 45deg)
    trackIds: number[];
    x: number;
    y: number;
}

export interface MapRobotOptions {
    seedId?: number;
    rotation?: number; // (rotation * 45deg)
    x?: number;
    y?: number;
}

export interface MapData {
    cells: MapCell[],
    robots: MapRobot[],
    map: string, // base64 encoded image url
}