const { app, BrowserWindow } = require('electron');

// 메인창 인스턴스
let win;

/**
 * 창 생성
 */
function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('index.html');

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });
}

// 창 생성
app.on('ready', createWindow);

/**
 * 창 닫힘 이벤트
 */
app.on('window-all-closed', () => {
    if( process.platform !== 'darwin' ) {
        app.quit();
    }
});

/**
 * 창 활성화 이벤트
 */
app.on('activate', () => {
    if( win === null ) {
        createWindow();
    }
});