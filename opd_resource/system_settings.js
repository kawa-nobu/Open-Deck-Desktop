window.addEventListener("load", async function(){
    const get_settings_data = await opd_system.opd_get_data_store("opd_system_settings");
    const settings_data_obj = JSON.parse( get_settings_data);
    console.log(settings_data_obj);
    Object.keys(settings_data_obj).forEach((key)=>{
        console.log(settings_data_obj[key])
        switch(key){
            case 'color_mode':
                document.getElementById('opd_color_mode').value = settings_data_obj[key];
                break;
            case 'scrollbar_thin_mode':
                console.log(settings_data_obj[key])
                document.getElementById('opd_scrollbar_type').checked = settings_data_obj[key];
                break;
            case 'contents_hide_promotion':
                console.log(settings_data_obj[key])
                document.getElementById('opd_hide_promotion').checked = settings_data_obj[key];
                break;
            case 'window_close_to_minimize':
                document.getElementById('opd_close_btn_mini').checked = settings_data_obj[key];
                break;
            default:
                break;
        }
    })
    document.getElementById('opd_color_mode').addEventListener("change", async function(){
        opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"color_mode", value:Number(this.value)}])
    });
    document.getElementById('opd_close_btn_mini').addEventListener("change", async function(){
        opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"window_close_to_minimize", value:this.checked}])
    });
    document.getElementById('opd_scrollbar_type').addEventListener("change", async function(){
        opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"scrollbar_thin_mode", value:this.checked}])
    });
    document.getElementById('opd_hide_promotion').addEventListener("change", async function(){
        opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"contents_hide_promotion", value:this.checked}])
    });
    document.getElementById('opd_rebuild_sys_settings').addEventListener("click", async function(){
        if(await opd_system.opd_custom_dialog('システム設定の初期化', "システム設定を初期化してOpen-Deckを再起動します")){
            opd_system.opd_rebuild_sevedata('system_settings');
        }
    });
    document.getElementById('opd_rebuild_profile').addEventListener("click", async function(){
        if(await opd_system.opd_custom_dialog('プロファイルの初期化', "プロファイルを初期化してOpen-Deckを再起動します")){
            opd_system.opd_rebuild_sevedata('profile');
        }
    });
    document.getElementById('opd_app_exit').addEventListener("click", async function(){
        if(await opd_system.opd_custom_dialog('アプリケーションの終了', "Open-Deckを終了します")){
            opd_system.opd_app_exit();
        }
    });
});