const {contextBridge, ipcRenderer} = require('electron');
//const path = require('path')
//const fs = require('fs');
contextBridge.exposeInMainWorld("opd_system",{
    load_resource(resource_name){
        const arg_resource_path = process.argv.find(arg => arg.startsWith('--opd_resource_path')).split('=')[1];
        return `file:///${arg_resource_path}${resource_name}`;
    },
    load_resource_to_b64(resource_name){
        const arg_resource_path = process.argv.find(arg => arg.startsWith('--opd_resource_path')).split('=')[1];
        const resource_b64 = (async ()=>{
            const response = await fetch(`file:///${arg_resource_path}${resource_name}`);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const fr = new FileReader();
                fr.onload = () => resolve(fr.result);
                fr.onerror = reject;
                fr.readAsDataURL(blob);
            });
        })();
        return resource_b64;
    },
    load_webview_preload_script(){
        const arg_resource_path = process.argv.find(arg => arg.startsWith('--opd_webview_preload_path')).split('=')[1];
        return `file:///${arg_resource_path}`;
    },
    auto_reload_helper_script(){
        const helper_script = ipcRenderer.invoke('OPD_Columun_HelperScripts', {message:"get_auto_reload"}).then((res)=>{
            return res;
        })
        return helper_script;
    },
    post_column_helper_script(){
        const helper_script = ipcRenderer.invoke('OPD_Columun_HelperScripts', {message:"get_post_column_text_review"}).then((res)=>{
            return res;
        })
        return helper_script;
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
            case 'opd_system_settings':
                const get_system_settings_data = ipcRenderer.invoke('OPD_GetStoreItem', {message:'opd_system_settings'}).then((res)=>{
                    return res;
                })
                return get_system_settings_data;
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
       ipcRenderer.on('OPD_update_api_limit', (event, data) => {
      func(data)
    })
    }, 
    async opd_custom_dialog(title, detail){
        const res = await ipcRenderer.invoke('open_custom_dialog', {title:title, detail:detail});
        return res;
    }
});