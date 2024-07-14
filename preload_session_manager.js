const {contextBridge, ipcRenderer} = require('electron');
//const path = require('path')
//const fs = require('fs');
contextBridge.exposeInMainWorld("opd_system",{
    opd_session_store_operation(mode, data){
        switch(mode){
            case 'get_store':
                const get_session_data = ipcRenderer.invoke('OPD_SessionManager_GetStore', {message:"get_session_store"}).then((res)=>{
                    return res;
                })
                return get_session_data;
            case 'add_store':
                const add_session_data = ipcRenderer.invoke('OPD_SessionManager_AddStore', {add_data:data}).then((res)=>{
                    return res;
                })
                return add_session_data;
            case 'delete_store':
                const delete_session_data = ipcRenderer.invoke('OPD_SessionManager_DeleteStore', {add_data:data}).then((res)=>{
                    return res;
                })
                return delete_session_data;
            default:
                return null;
        }
    }
});