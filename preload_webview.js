const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld("opd_system",{
    async get_column_posts_settings(column_type){
        const result = await ipcRenderer.invoke('get_column_posts_settings', {type:column_type});
        return result;
    },
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
    },
});