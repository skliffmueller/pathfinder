import {HTMLView} from "./HTMLView";

export class SVGIcon extends HTMLView<{}, SVGElement> {
    constructor(svgHtml: string, className: string) {
        super(svgHtml);
        this.rootElement.classList.add(...className.split(" "));
    }
}