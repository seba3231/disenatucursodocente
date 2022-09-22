const { app, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");
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

  appWindow.loadURL(
    url.format({
      pathname: path.join(
        __dirname,
        `/dist/disena-tu-curso-docente/index.html`
      ),
      protocol: "file:",
      slashes: true,
    })
  );

  appWindow.on("closed", function () {
    appWindow = null;
  });
}

app?.on("ready", initWindow);

app?.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app?.on("activate", function () {
  if (win === null) {
    initWindow();
  }
});
