type NodeKeyList = {
    [key:string]: Node
};

export class HTMLView<T> {

    rootElement: HTMLElement;
    childElements: T;

    constructor(html: string) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.rootElement = temp.querySelector<HTMLElement>('*:first-child');
        this.childElements = {} as T;
        const idElementList = this.rootElement.querySelectorAll('*[id]');
        for(let i=0;i < idElementList.length;i++) {
            const id = idElementList[i].id;
            if(typeof id === 'string') {
                idElementList[i].id = undefined;
                // @ts-ignore
                this.childElements[id] = idElementList[i];
            }
        }
    }

    destroy() {
        this.rootElement.parentNode.removeChild(this.rootElement);
    }
}