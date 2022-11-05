import '../assets/index.scss';
import { App } from "./App";
import { Editor } from "./Editor";

function main(): App {
    const app = new App();
    document.body.appendChild(app.rootElement);
    return app;
}

function editor(): Editor {
    const app = new Editor();
    document.body.appendChild(app.rootElement);
    return app;
}

(function() {
    let instance: Editor | App;
    if(window.location.hash === "#editor") {
        instance = editor();
    } else {
        instance = main();
    }
    window.addEventListener('hashchange', (event) => {
        instance.destroy();
        if(window.location.hash === "#editor") {
            instance = editor();
        } else {
            instance = main();
        }
    });
})();
