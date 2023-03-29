const { app, BrowserWindow } = require("electron");
const { fork } = require("child_process");

let appWindow;
let ps;

function initWindow() {
    //Documentación opciones de BrowserWindow
    //https://www.electronjs.org/docs/latest/api/browser-window
    appWindow = new BrowserWindow(
        {
            show:false,
            webPreferences: {
                nodeIntegration: true,
            },
        }
    );

    //Para las ventanas del reporte PDF, oculto el menu
    appWindow.webContents.setWindowOpenHandler(({ url }) => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                autoHideMenuBar : true
            }
        }
    })

    //Mientras levanta el Backend, muestro Loading
    appWindow.loadFile('loading.html');
    appWindow.setMenu(null);
    appWindow.maximize();
    appWindow.show();
    //Inicia el Backend en otro thread
    ps = fork(
        `${__dirname}/Backend.js`
        , []
        , {
            cwd: `${__dirname}`,
        }
    );

    ps.on('message', function (message) {
        //Backend levantó y escribió el archivo port para el Frontend
        console.log('Message from Child process : ' + message);
        //Se carga el Frontend Angular en la ventana
        appWindow.loadFile('dist/disena-tu-curso-docente/index.html');

        appWindow.on("closed", function () {
            appWindow = null;
        });
    });
}

app?.on("ready", initWindow);

app?.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app?.on("activate", function () {
    if (appWindow === null) {
        initWindow();
    }
});
