import '../assets/index.scss';
import { App } from "./App";

function main(): App {
    const app = new App();
    document.body.appendChild(app.rootElement);
    return app;
}

(function() {
    const instance: App = main();
})();
