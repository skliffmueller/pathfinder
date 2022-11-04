

declare module '*.png' {
    const content: string
    export default content
}

interface MapRobot {
    seedId: number;
    rotation: number; // (rotation * 45deg)
    trackIds: number[];
    x: number;
    y: number;
}

type MapJson = {
    map: string;
    robots: MapRobot[];
}

declare module '*.json' {
    const content: MapJson
    export default content
}