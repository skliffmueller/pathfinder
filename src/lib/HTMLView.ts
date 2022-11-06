import { BaseEmitter } from "./BaseEmitter";

export class HTMLView<T, U = HTMLElement, V = {}> extends BaseEmitter<V> {

    rootElement: U;
    childElements: T;

    constructor(html: string) {
        super();
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const rootElement = temp.querySelector('*:first-child');
        this.rootElement = rootElement as U;
        this.childElements = {} as T;
        const idElementList = rootElement.querySelectorAll('*[id]');
        for(let i=0;i < idElementList.length;i++) {
            const id = idElementList[i].id;
            if(typeof id === 'string') {
                idElementList[i].id = "";
                // @ts-ignore
                this.childElements[id] = idElementList[i];
            }
        }

    }

    destroy() {
        (this.rootElement as HTMLElement).parentNode.removeChild(this.rootElement as HTMLElement);
    }
}