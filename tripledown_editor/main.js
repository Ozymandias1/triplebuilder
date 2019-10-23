const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const url = require('url');

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

    //win.loadFile(path.join(__dirname, '../index.html'));
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));


    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });

    // 메뉴 생성
    createMenu();
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

/**
 * 메뉴 생성
 */
function createMenu() {

    const template = [
        {
            label: 'File',
            submenu: [
                { 
                    label: 'Open OBJ Model',
                    click: function() {
                        dialog.showOpenDialog(win, {
                            title: 'OBJ 파일 열기',
                            filters: [
                                { name: 'OBJ Model (*.obj)', extensions: ['obj'] }
                            ],
                            properties: ['openFile']
                        }).then( (result) => {
                            if( result.canceled === false ) {
                                const dirName = path.dirname(result.filePaths[0]);
                                const fileNameOnly = path.basename(result.filePaths[0], '.obj');
                                const data = {
                                    dirPath: dirName + '\\',
                                    objName: fileNameOnly + '.obj',
                                    mtlName: fileNameOnly + '.mtl'
                                };
                                // 렌더러 프로세스로 전달
                                win.webContents.send('OpenObjModel', data);
                            }
                        });
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                { label: 'About...' }
            ]
        },
        {
            label: 'Dev',
            submenu: [
                { role: 'toggledevtools' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}