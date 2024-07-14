const {contextBridge, ipcRenderer} = require('electron');
//const path = require('path')
//const fs = require('fs');
contextBridge.exposeInMainWorld("opd_system",{
    load_resource(resource_name){
        const arg_resource_path = process.argv.find(arg => arg.startsWith('--opd_resource_path')).split('=')[1];
        //console.log(process)
        return `file:///${arg_resource_path}${resource_name}`;
    },
    load_webview_preload_script(){
        const arg_resource_path = process.argv.find(arg => arg.startsWith('--opd_webview_preload_path')).split('=')[1];
        //console.log(process)
        return `file:///${arg_resource_path}`;
    },
    opd_version(){
        const opd_version = process.argv.find(arg => arg.startsWith('--opd_version')).split('=')[1];
        return opd_version;
    },
    open_about_opd_window(){
        ipcRenderer.send('open_about_opd');
        return true;
    },
    open_session_manager_window(){
        ipcRenderer.send('open_session_manager');
        return true;
    },
    open_system_settings_window(){
        ipcRenderer.send('open_system_settings');
        return true;
    },
    opd_get_session_store(){
        const get_session_data = ipcRenderer.invoke('OPD_SessionManager_GetStore', {message:"get_session_store"}).then((res)=>{
            return res;
        })
        return get_session_data;
    },
    opd_get_data_store(store_name){
        switch(store_name){
            case 'opd_settings':
                const get_settings_data = ipcRenderer.invoke('OPD_GetStoreItem', {message:'opd_settings'}).then((res)=>{
                    return res;
                })
                return get_settings_data;
            case 'opd_profile_store':
                const get_profile_data = ipcRenderer.invoke('OPD_GetStoreItem', {message:'opd_profile_store'}).then((res)=>{
                    return res;
                })
                return get_profile_data;
            default:
                return null;
        }
    },
    opd_set_data_store(store_name, write_data){
        switch(store_name){
            case 'opd_settings':
                const get_settings_data = ipcRenderer.invoke('OPD_SetStoreItem', {message:'opd_settings', json_data:write_data}).then((res)=>{
                    return res;
                })
                return get_settings_data;
            case 'opd_profile_store':
                const get_profile_data = ipcRenderer.invoke('OPD_SetStoreItem', {message:'opd_profile_store', json_data:write_data}).then((res)=>{
                    return res;
                })
                return get_profile_data;
            default:
                return null;
        }
    },
    opd_store_reset(){
        ipcRenderer.send('OPD_StoreReset');
        return true;
    },
    opd_api_limit(func){
        /*ipcRenderer.on('opd_update_access_limit', (e, data)=>{
            //func(data)
        })*/
       ipcRenderer.on('event-from-main', (event, data) => {
      func(data)
    })
    }
});