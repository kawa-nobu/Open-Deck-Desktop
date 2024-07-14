const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld("opd_system",{
    open_default_browser(url){
        ipcRenderer.send('open_default_browser', url);
        return true;
    }
});