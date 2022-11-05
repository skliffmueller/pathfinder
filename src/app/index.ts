import '../assets/index.scss';
import { App } from "./App";
import { Editor } from "./Editor";


function main(): void {
    const app = new App();
    document.body.appendChild(app.rootElement);
}

function sub(): void {
    const app = new Editor();
    document.body.appendChild(app.rootElement);
}

(function() {
    //main();
    sub();
})();
