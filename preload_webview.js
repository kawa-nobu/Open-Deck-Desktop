const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld("opd_system",{
    open_default_browser(url){
        ipcRenderer.send('open_default_browser', url);
        return true;
    },
    text_review(str){
        const result = ipcRenderer.invoke('start_text_review', {text:str});
        return result;
    },
    open_media_viewer(media_info, selected_index){
        ipcRenderer.send('open_media_viewer', media_info, selected_index);
        return true;
    }
});