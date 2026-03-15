const {contextBridge, ipcRenderer} = require('electron');
//const path = require('path')
//const fs = require('fs');
contextBridge.exposeInMainWorld("opd_system",{
    opd_get_data_store(store_name){
        switch(store_name){
            case 'opd_system_settings':
                const get_settings_data = ipcRenderer.invoke('OPD_GetStoreItem', {message:'opd_system_settings'}).then((res)=>{
                    return res;
                })
                return get_settings_data;
            default:
                return null;
        }
    },
    opd_set_data_store(store_name, write_data){
        switch(store_name){
            case 'opd_system_settings':
                const get_settings_data = ipcRenderer.invoke('OPD_SetStoreItem', {message:'opd_system_settings', settings_data:write_data}).then((res)=>{
                    return res;
                })
                return get_settings_data;
            default:
                return null;
        }
    },
    opd_rebuild_sevedata(store_name){
        switch(store_name){
            case 'system_settings':
                const sys_settings_rebuild = ipcRenderer.invoke('OPD_StoreReset', {message:'system_settings'}).then((res)=>{
                    return res;
                })
                return sys_settings_rebuild;
            case 'profile':
                const profile_rebuild = ipcRenderer.invoke('OPD_StoreReset', {message:'profile'}).then((res)=>{
                    return res;
                })
                return profile_rebuild;
            default:
                return null;
        }
    },
    async opd_custom_dialog(title, detail){
        const res = await ipcRenderer.invoke('open_custom_dialog', {title:title, detail:detail});
        return res;
    },
    opd_app_exit(){
        ipcRenderer.send('OPD_AppExit');
    }
});