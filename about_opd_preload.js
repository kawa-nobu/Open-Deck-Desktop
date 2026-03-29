const {contextBridge, ipcRenderer} = require('electron');
//const path = require('path')
//const fs = require('fs');
contextBridge.exposeInMainWorld("opd_system",{
    load_resource(resource_name){
        return `opd://resources/${resource_name.replace(/^\/+/, '')}`;
    },
    opd_version(){
        const opd_version = process.argv.find(arg => arg.startsWith('--opd_version')).split('=')[1];
        return opd_version;
    },
    open_default_browser(url){
        ipcRenderer.send('open_default_browser', url);
        return true;
    },
    open_license_browser(){
        ipcRenderer.send('open_license_directory');
        return true;
    }
});