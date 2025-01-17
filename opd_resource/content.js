const prototype_version = false;
//
console.log("Welcome to Open-Deck!");
if(prototype_version){
    console.log("%cOpen-Deck Prototype", "background:#a1f4ff;padding:5px;border-radius:5px", `Version:`);
}else{
    console.log("%cOpen-Deck", "background:#a1f4ff;padding:5px;border-radius:5px", `Version:`);
}
//
const url_path = new URL(location.href);
let profile_store;
let last_load_profile = 0;
const ui_icon_define = {
    banner_hide:"icon/banner_hide.svg",
    top_bar_hide:"icon/top_hide.svg",
    column_move:"icon/column_move.svg",
    column_close:"icon/column_close.svg",
    column_settings: "icon/settings.svg",
    column_pin:"icon/pin.svg",
    column_pinned:"icon/pinned.svg",
    column_widesize:"icon/column_w_size.svg",
    column_add_1:"icon/column_add_1st.svg",
    column_add_2:"icon/column_add_2nd.svg",
    add_timeline_column:"icon/tl_column.svg",
    add_notification_column:"icon/notice_column.svg",
    add_explore_column:"icon/exp_column.svg",
    column_single_rack:"icon/single_view.svg",
    column_second_rack:"icon/second_view.svg",
    profile_save:"icon/profile_save.svg",
    profile_delete:"icon/profile_delete.svg",
    change_session:"icon/select_session.svg",
    session_manager:"icon/session_namager.svg",
    system_settings: "icon/settings.svg"
}
//UNIX時間分秒変換
function unix_time_mmss(input){
    const date = new Date(input * 1000);
    return date.toLocaleTimeString();
}
//ランダム文字列生成
function random_string(){
    return crypto.randomUUID().replace(/(-|[0-9])/g, "");
}
//ストレージの書き込み監視(主にAPIリミット監視に使う)
let api_limit_obj = null;
let api_limit_dsc_obj = {time_line:"", recommend_timeline:"", search:""};
opd_system.opd_api_limit(function(api_access_limit){
    //console.log(api_access_limit)
    if(api_access_limit != undefined){
        //console.log(changes)
        api_limit_obj = api_access_limit;
        const api_linit_status_btn = document.querySelector("#api_limit_status");
        if(api_linit_status_btn != null){
            let timeline_limit_percentage = 100;
            let recommend_timeline_limit_percentage = 100;
            let search_limit_percentage = 100;
            if(api_limit_obj.time_line.remaining != null){
                timeline_limit_percentage = api_limit_obj.time_line.remaining / api_limit_obj.time_line.limit * 100;
                api_limit_dsc_obj.time_line = `タイムライン:${api_limit_obj.time_line.remaining}/${api_limit_obj.time_line.limit}-${unix_time_mmss(api_limit_obj.time_line.reset_unix_time)}\r\n`;
            }else{
                //初期状態
            }
            if(api_limit_obj.recommend_timeline.remaining != null){
                recommend_timeline_limit_percentage = api_limit_obj.recommend_timeline.remaining / api_limit_obj.recommend_timeline.limit * 100;
                api_limit_dsc_obj.recommend_timeline = `タイムライン(おすすめ):${api_limit_obj.recommend_timeline.remaining}/${api_limit_obj.recommend_timeline.limit}-${unix_time_mmss(api_limit_obj.recommend_timeline.reset_unix_time)}\r\n`;
            }else{
                //初期状態
            }
            if(api_limit_obj.search.remaining != null){
                search_limit_percentage = api_limit_obj.search.remaining / api_limit_obj.search.limit * 100;
                api_limit_dsc_obj.search = `検索:${api_limit_obj.search.remaining}/${api_limit_obj.search.limit}-${unix_time_mmss(api_limit_obj.search.reset_unix_time)}`;
            }else{
                //初期状態
            }
            api_linit_status_btn.textContent = `${Math.floor(Math.min(timeline_limit_percentage, recommend_timeline_limit_percentage, search_limit_percentage))}%`;
            api_linit_status_btn.title = `API使用状況(デフォルトセッション)\r\n${api_limit_dsc_obj.time_line}${api_limit_dsc_obj.recommend_timeline}${api_limit_dsc_obj.search}`;
        }
    }
})
if(true){
   window.addEventListener("load", function(){
    init();
    })
    //chrome.runtime.sendMessage({message: "dnr_upd"});
    async function init(){
        //console.log("Welcome to Open-Deck!");
        let settings_local_strage_settings = JSON.parse(await opd_system.opd_get_data_store('opd_settings'));
        
        init_settings_load(settings_local_strage_settings);
        async function init_settings_load(value){
            console.log(value?.opd_settings)
            if(value?.opd_settings == null){
                console.log("AAA")
                last_load_profile = 0;
                settings_init();
            }else{
                console.log(value.opd_settings.last_load_profile)
                if(value.opd_settings.last_load_profile == null){
                    if(confirm("プロファイルデータが壊れています。\r\n初期化するにはOKを押してください。\r\n初期化せずに続行する場合はキャンセルを押してください。")){
                        /*chrome.storage.local.remove("opd_settings", function(){
                            alert("初期化が完了しました");
                        });*/
                    }else{
                        last_load_profile = 0;
                    }
                }else{
                    last_load_profile = value.opd_settings.last_load_profile;
                }
                //console.log(last_load_profile);
            }
            await opd_system.opd_get_data_store('opd_profile_store').then(function (store_value){
                console.log(JSON.parse(store_value))
                profile_store = JSON.parse(store_value);
                //RUN
                let ext_update_flag = null;
                let ext_settings = null;
                console.log(value)
                if(value.opd_settings != null){
                    if(value != opd_system.opd_version()){
                        ext_update_flag = true;
                    }else{
                        ext_update_flag = false;
                    }
                    ext_update_flag = false;
                }
                if(value.opd_settings == null || ext_update_flag == true){
                    //settings_init();
                    //ext_settings = value;
                    if(profile_store[last_load_profile]?.profile == undefined){
                        let recovery_setting = value;
                        recovery_setting.opd_settings.last_load_profile = 0;
                        opd_system.opd_set_data_store('opd_settings', JSON.stringify(recovery_setting)).then(function(){
                            alert("破損した設定データの自動修復を行いました\r\n再読み込みします");
                            last_load_profile = 0;
                            window.reload();
                        });
                    }
                    ext_settings = {column_settings:profile_store[last_load_profile].profile};
                }else{
                    //ext_settings = value;
                    if(profile_store[last_load_profile]?.profile == undefined){
                        let recovery_setting = value;
                        recovery_setting.opd_settings.last_load_profile = 0;
                        opd_system.opd_set_data_store('opd_settings', JSON.stringify(recovery_setting)).then(function(){
                            alert("破損した設定データの自動修復を行いました\r\n再読み込みします");
                            last_load_profile = 0;
                            window.reload();
                        });
                    }
                    ext_settings = {column_settings:profile_store[last_load_profile].profile};
                }
                console.log(ext_settings);
                run(ext_settings);
            });
        };
    }
}
async function run(settings){
    //console.log(settings)
    let profile_list_html;
    let profile_list_btn_html = "";
    //プロファイルリスト初期化
    for (let index = 0; index < profile_store.length; index++) {
        profile_list_btn_html += `<div class="dsp_btn_parent" title="プロファイルを切り替える" id="userProfile-${index}"><div class="dsp_btn_change_profile_btn">P${index}</div></div>`;//<div class="profile_list"><input type="button" id="userProfile-${index}" value="P${index}"></div>
    }
    profile_list_html = `<div class="profile_val_now" title="使用中のプロファイル">${last_load_profile}</div><div class="dsp_profile_list"><div id="profile_btn_list">${profile_list_btn_html}</div>`;
    //console.log(profile_list_btn_html)
    //CSSタグ追加
    document.querySelector("head").insertAdjacentHTML("afterbegin", `<style second_column_css></style>
    <style opd_default_css>
    html{
        overflow-y:hidden !important;
    }
    .main_bar_functions{
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        margin-top: 0.5rem;
    }
    .main_bar_functions hr{
        width: 80%;
        margin: 0;
    }
    .opd_version_span{
        cursor: pointer;
    }
    .opd_debug_menu{
        display: none;
    }
    #opd_main_element{
        background: #e4e4e4 !important;
    }
    div[opd_column_type="dsp_column"]{
        overflow-x: scroll;
        scrollbar-width: none;
    }
    #main_bar_empty_column{
        background-color: white;
    }
    #api_limit_status{
        border-radius: 100px;
        width: 50px;
    }
    #api_limit_status:hover{
        background-color: #d5d5d5;
        cursor: help;
    }
    .opd_ui_logo_parent{
        overflow: hidden;
        display: flex;
        width: 50px;
        align-content: center;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
    .opd_ui_logo{
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource("icon/logo_icon.svg")});
        height: 50px;
        width: 50px;
        cursor: pointer;
    }
    .profile_val_now{
        border-radius: 100px;
        width: 55px;
    }
    .profile_val_now:hover{
        background-color: #d5d5d5;
    }
    #main_rack_element{
        position: fixed;
        left:60px;
        height:100vh;
        max-width:calc(100vw - 60px);
        width:calc(100vw - 60px);
        overflow:scroll hidden;
    }
    #first_rack_element{
        /*overflow: hidden;*/
    }
    #second_rack_element{
        /*overflow: hidden;*/
    }
    .dsp_column_emptycolumn p{
        text-align: center;
    }
    .dsp_column_second_emptycolumn p{
        text-align: center;
    }
    .dsp_btn_parent{
        overflow: hidden;
        border-radius: 100px;
        display: flex;
        width: 50px;
        height: 50px;
        align-content: center;
        justify-content: center;
        align-items: center;
    }
    .dsp_btn_parent:hover{
        background: #d5d5d5;
        cursor: pointer;
    }
    .dsp_btn_add_tl_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.add_timeline_column)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_add_ntfc_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.add_notification_column)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_add_explr_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.add_explore_column)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_second_rack_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.column_second_rack)});
        height: 69%;
        width: 69%;
    }
        .dsp_btn_profile_add_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.profile_save)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_sesssion_manager_add_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.session_manager)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_system_settings_add_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.system_settings)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_profile_delete_img{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
        background-size: cover;
        background-repeat: no-repeat;
        background-image: url(${opd_system.load_resource(ui_icon_define.profile_delete)});
        height: 69%;
        width: 69%;
    }
    .dsp_btn_change_profile_btn{
        display: flex;
        font-size: 1.2rem;
        justify-content: center;
        align-items: center;
        height: 69%;
        width: 69%;
    }
    .dsp_profile_list{
        max-height: 1000px;
        overflow-y: scroll;
        scrollbar-width: none;
    }
    .dsp_column_draggable_true{
        border-left: solid 3px #0000002e;
        border-right: solid 3px #0000002e;
        border-bottom: solid 3px #0000002e;
        /*overflow: hidden;*/
        background-color: white;
        border-radius: 6px 6px;
    }
    .dsp_column_draggable_true div[opd_column_type]{
        display: flex;
        flex-direction: column;
    }
    .dsp_column webview{
        border: 0;
    }
    .dsp_column_btn{
        width: 20px;
        min-width: 20px;
        border-radius: 2px;
        overflow: hidden;
        margin-right: 5px;
    }
    .dsp_column_btn:hover{
        background: #d5d5d5;
        cursor: pointer;
    }
    .column_bar{
        display: flex;
        flex-direction: row;
        width: 100%;
        min-height: 20px;
        overflow: hidden;
        border-top: solid #a0a0a073 1px !important;
        border-bottom: solid #a0a0a073 1px !important;
        border-radius: 4px 4px 0 0;
    }
    .dsp_column_title{
        width: auto;
        background-color: white;
        margin-right: 5px;
    }
    .dsp_column_move_icon_parent{
        max-height: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .dsp_column_move_icon{
        display: block;
        filter: brightness(0) saturate(100%) invert(61%) sepia(13%) saturate(13%) hue-rotate(335deg) brightness(89%) contrast(79%);
        background-image: url(${opd_system.load_resource(ui_icon_define.column_move)});
        background-size: cover;
        width: 15px;
        height: 15px;   
    }
    .dsp_column_settings_btn{
        display: block;
        background-image: url(${opd_system.load_resource(ui_icon_define.column_settings)});
        background-size: cover;
        width: 20px;
        height: 20px;    
    }
    .dsp_column_settings_btn:hover{
        cursor: pointer;
    }
    .dsp_column_settings_btn input{
        display: none;
    }
    .dsp_column_change_session_btn{
        display: block;
        background-image: url(${opd_system.load_resource(ui_icon_define.change_session)});
        background-size: cover;
        width: 20px;
        height: 20px;    
    }
    .dsp_column_change_session_btn:hover{
        cursor: pointer;
    }
    .dsp_column_change_session_btn input{
        display: none;
    }
    .dsp_column_close_btn{
        display: block;
        background-image: url(${opd_system.load_resource(ui_icon_define.column_close)});
        background-size: 15px;
        background-repeat: no-repeat;
        background-position: center;
        width: 20px;
        height: 20px;    
    }
    .dsp_column_close_btn:hover{
        cursor: pointer;
    }
    .dsp_column_close_btn input{
        display: none;
    }
    .dsp_column_banner_btn{
        display: block;
        background-image: url(${opd_system.load_resource(ui_icon_define.banner_hide)});
        transform: rotate(180deg);
        background-size: cover;
        width: 20px;
        height: 20px;
    }
    input:checked + .dsp_column_banner_btn{
        transform: rotate(0deg);
    }
    .dsp_column_btn input{
        opacity: 0;
        position: absolute;
        z-index: 10;
        margin: 0;
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    .dsp_column_top_btn{
        display: block;
        background-image: url(${opd_system.load_resource(ui_icon_define.top_bar_hide)});
        transform: rotate(180deg);
        background-size: cover;
        width: 20px;
        height: 20px;
        cursor: pointer;  
    }
    input:checked + .dsp_column_top_btn{
        transform: rotate(0deg);
    }
    .dsp_column_top_btn input{
        opacity: 0;
        position: absolute;
        z-index: 10;
        margin: 0;
        width: 20px;
        height: 20px;
    }
    .dsp_column_close_btn_wrap{
        display: flex;
        width: 100%;
        justify-content: flex-end;
    }
    .dsp_column_close_btn input{
        display: none;
    }

    .dsp_column_pin_btn{
        display: block;
        background-image: url(${opd_system.load_resource(ui_icon_define.column_pin)});
        background-size: cover;
        width: 20px;
        height: 20px;    
    }
    input:checked + .dsp_column_pin_btn{
        background-image: url(${opd_system.load_resource(ui_icon_define.column_pinned)});
    }
    .dsp_column_pin_btn input{
        opacity: 0;
        position: absolute;
        z-index: 10;
        margin: 0;
        width: 20px;
        height: 20px;
    }

    .dsp_column_settings_panel{
        display: none;
        position: relative;
        width: inherit;
        height: auto;
        background: #efefefeb;
        border: 1px solid #a9a9a9eb;
        flex-direction: column;
    }
    .dsp_column_settings_panel h2{
        /*margin: 0 0 0.2rem;*/
        margin: 0;
    }
    .dsp_column_settings_panel_content{
        margin-left: 0.5rem;
    }
    .dsp_column_settings_panel_content h2{
        font-size: 1.2rem;
    }
    .opd_column_settings_input_text{
        width: 5rem;
        margin-right: 0.2rem;
    }
    .dsp_column_settings_list{
        background: white;
        border-radius: 5px;
        margin: 0 0.5rem 0.5rem 0;
        padding: 0.5rem;
    }
    .dsp_column_settings_content_div{
        margin-bottom: 0.1rem;
        display: flex;
        justify-content: space-between;
    }
    .dsp_column_settings_panel_close_btn_wrap{
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin: 0 0.5rem 0.5rem 0;
    }
    .opd_ui_icon_color{
        filter: brightness(0) saturate(100%) invert(11%) sepia(16%) saturate(13%) hue-rotate(322deg) brightness(107%) contrast(80%);
    }
    /*#main_rack_element section:first-child{
        margin-left:110px
    }*/
    @media (prefers-color-scheme: dark) {
        #main_rack_element{
            background-color: black !important;
        }
        .dsp_column_draggable_false, #first_rack_element, #second_rack_element, #second_rack_element, #main_bar_empty_column{
            background-color: black !important;
        }
        .dsp_column_draggable_true, .dsp_column_title{
            background-color: #2e2e2e !important;
        }
        .dsp_btn_add_tl_img, .dsp_btn_add_ntfc_img, .dsp_btn_add_explr_img, .dsp_btn_second_rack_img, .dsp_btn_profile_add_img, .dsp_btn_sesssion_manager_add_img, .dsp_btn_profile_delete_img, .dsp_btn_system_settings_add_img, .dsp_column_move_icon, .opd_ui_icon_color{
            filter: brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(93%) hue-rotate(266deg) brightness(93%) contrast(86%);
        }
        #api_limit_status:hover {
            background: #555555;
        }
        .dsp_btn_parent:hover{
            background: #555555;
        }
        .dsp_column_btn:hover {
            background: #555555;
        }
        .profile_val_now:hover {
            background: #555555;
        }
        .dsp_column_settings_panel {
            background: #2e2e2e;
            border: 1px solid #5d5d5d;
        }
        .dsp_column_settings_list {
            background: #474747
        }
    }
    </style>
    <style opd_electron_style>
    .electron_opd_msgbox_bg{
        display: flex;
        position: absolute;
        z-index: 99999;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0000006e;
        flex-direction: column;
        align-items: center;
    }
    .electron_opd_msgbox_wrap{
        display: flex;
        margin: 1vh 0 0 0;
        width: 30rem;
        height: 15rem;
        background: white;
        border-radius: 10px;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
    }
    .electron_opd_msgbox_content{
        margin-top: 1.5rem;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .electron_opd_msgbox_confirm_btn{
        width: 40%;
        display: flex;
        margin-top: 2rem;
        justify-content: space-around;
    }
    </style>
    <style opd_electron_style>
    .electron_opd_select_as_bg{
        display: flex;
        position: absolute;
        z-index: 99999;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0000006e;
        flex-direction: column;
        align-items: center;
    }
    .electron_opd_select_as_wrap{
        display: flex;
        margin: 1vh 0 0 0;
        width: 30rem;
        height: 15rem;
        background: white;
        border-radius: 10px;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
    }
    .electron_opd_select_as_content{
        margin-top: 1.5rem;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .electron_opd_select_as_confirm_btn{
        width: 40%;
        display: flex;
        margin-top: 2rem;
        justify-content: space-around;
    }
    .electron_opd_select_as_bg table{
        border-collapse: collapse;
        border: 2px solid rgb(113, 113, 113);
    }
    .electron_opd_select_as_bg th,td {
        border: 1.5px solid rgb(135, 135, 135);
        padding: 0px 10px;
    }
    .electron_opd_select_as_bg .session_content{
        cursor: pointer;
    }
    .electron_opd_select_as_bg .session_content:hover{
        background: rgb(219 219 219);
    }
    @media (prefers-color-scheme: dark) {
        .electron_opd_msgbox_wrap{
            background: #474747;
            color: white;
        }
    }
    </style>
    <style opd_electron_style>
    div[opd_column_type][opd_column_mini] .dsp_column_now_session{
        display: none;
    }
    div[opd_column_type] .dsp_column_now_session{
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    @media (prefers-color-scheme: dark) {
        .electron_opd_select_as_wrap{
            background: #474747;
            color: white;
        }
        .electron_opd_select_as_bg .session_content:hover{
            background: #2e2e2e;
        }
        .dsp_column_title, .dsp_column_settings_panel{
            color: white;
        }
        .main_bar_functions{
            color: white;
        }
        :root {
            color-scheme: dark;
        }
    }
    </style>
    `);
    //カラム要素作成-挿入
    let default_element_bar = `<span class="dsp_column_btn"><label class="dsp_column_settings_btn opd_ui_icon_color" title="カラム設定"><input class="opd_settings_btn" type="button" value="S"></label></span><span class="dsp_column_btn"><label class="dsp_column_change_session_btn opd_ui_icon_color" title="セッション切替"><input class="opd_change_session_btn" type="button"></label></span><span class="dsp_column_btn"><input class="opd_banner" type="checkbox" title="バナー表示切り替え" %column_banner_ch%><label class="dsp_column_banner_btn opd_ui_icon_color"></label></span><span class="dsp_column_btn"><input class="opd_top_bar" type="checkbox" title="トップ表示切り替え" %column_top_bar_ch%><label class="dsp_column_top_btn opd_ui_icon_color"></label></span>`;
    let othersns_default_element_bar = `<span class="dsp_column_btn"><label class="dsp_column_settings_btn opd_ui_icon_color" title="カラム設定"><input class="opd_settings_btn" type="button" value="S"></label></span><span class="dsp_column_btn"><label class="dsp_column_change_session_btn opd_ui_icon_color" title="セッション切替"><input class="opd_change_session_btn" type="button"></label></span>`;
    let column_settings_panel = `<div class="dsp_column_settings_panel"><div class="dsp_column_settings_panel_content"><h2>設定</h2><div class="dsp_column_settings_list"><div class="dsp_column_settings_content_div">表示モード<span><select class="opd_tw_view_mode" column_tw_view_mode_val="%column_tw_view_mode%"><option value="0">すべて</option><option value="1">テキストのみ</option><option value="2">画像・動画付のみ</option></select></span></div><div class="dsp_column_settings_content_div">RT非表示<span><input class="opd_hide_rt_tweet" type="checkbox" %column_hide_rt_tweet%></span></div><div class="dsp_column_settings_content_div">カラム幅<span><select class="opd_column_size_preset"><option value="0">小</option><option value="1">中</option><option value="2">大</option><option value="3">カスタム</option></select></span></div><div class="dsp_column_settings_content_div">カラム幅カスタム<span><input type="button" class="column_width_btn" value="カスタム設定" style="vertical-align: text-top;font-size: 0.8rem;"/></span></div><div class="dsp_column_settings_content_div">自動更新<span><input class="opd_a_reload_bar" type="checkbox" %column_auto_reload_ch%></span></div><div class="dsp_column_settings_content_div">自動更新間隔<span><input class="opd_column_settings_input_text opd_a_reload_time_setting" type="number" value="%column_auto_reload_time%">秒</span></div></div><div class="dsp_column_settings_panel_close_btn_wrap"><input type="button" class="dsp_column_settings_panel_close_btn" value="設定を閉じる" style="vertical-align: text-top;font-size: 0.8rem;"/></div></div></div>` ;
    let column_settings_panel_no_auto = `<div class="dsp_column_settings_panel"><div class="dsp_column_settings_panel_content"><h2>設定</h2><div class="dsp_column_settings_list"><div class="dsp_column_settings_content_div">表示モード<span><select class="opd_tw_view_mode" column_tw_view_mode_val="%column_tw_view_mode%"><option value="0">すべて</option><option value="1">テキストのみ</option><option value="2">画像・動画付のみ</option></select></span></div><div class="dsp_column_settings_content_div">RT非表示<span><input class="opd_hide_rt_tweet" type="checkbox" %column_hide_rt_tweet%></span></div><div class="dsp_column_settings_content_div">カラム幅<span><select class="opd_column_size_preset"><option value="0">小</option><option value="1">中</option><option value="2">大</option><option value="3">カスタム</option></select></span></div><div class="dsp_column_settings_content_div">カラム幅カスタム<span><input type="button" class="column_width_btn" value="カスタム設定" style="vertical-align: text-top;font-size: 0.8rem;"/></span></div></div><div class="dsp_column_settings_panel_close_btn_wrap"><input type="button" class="dsp_column_settings_panel_close_btn" value="設定を閉じる" style="vertical-align: text-top;font-size: 0.8rem;"/></div></div></div>` ;
    let column_settings_panel_othersns = `<div class="dsp_column_settings_panel"><div class="dsp_column_settings_panel_content"><h2>設定</h2><div class="dsp_column_settings_list"><div class="dsp_column_settings_content_div">カラム幅<span><select class="opd_column_size_preset"><option value="0">小</option><option value="1">中</option><option value="2">大</option><option value="3">カスタム</option></select></span></div><div class="dsp_column_settings_content_div">カラム幅カスタム<span><input type="button" class="column_width_btn" value="カスタム設定" style="vertical-align: text-top;font-size: 0.8rem;"/></span></div></div><div class="dsp_column_settings_panel_close_btn_wrap"><input type="button" class="dsp_column_settings_panel_close_btn" value="設定を閉じる" style="vertical-align: text-top;font-size: 0.8rem;"/></div></div></div>` ;
    let default_element = {
        empty_column:{html:`<section draggable="false" id="column_%column_num%" class="dsp_column_draggable_false dsp_column dsp_column_emptycolumn"><div opd_column_type="empty_column" opd_column_width="%column_width_num%" style="height: 100%;min-width: 30rem;display: flex;align-items: center;justify-content: center;"><div><img src="${opd_system.load_resource(ui_icon_define.column_add_1)}" style="filter: brightness(0) saturate(100%) invert(61%) sepia(13%) saturate(13%) hue-rotate(335deg) brightness(89%) contrast(79%);"><p>ツールバーからカラムを追加</p></div></div></section>`},
        second_empty_column:{html:`<section draggable="false" id="column_%column_num%" class="dsp_column_draggable_false dsp_column dsp_column_second_emptycolumn"><div opd_column_type="second_empty_column" opd_column_width="%column_width_num%" style="height:100%;min-width: 30rem;overflow: hidden;display: flex;align-items: center;justify-content: center;"><div><img src="${opd_system.load_resource(ui_icon_define.column_add_2)}" style="filter: brightness(0) saturate(100%) invert(61%) sepia(13%) saturate(13%) hue-rotate(335deg) brightness(89%) contrast(79%);"><p>1段目のカラムが配置できます</p></div></div></section>`},
        home:{html:`<section draggable="true" id="column_%column_num%" class="dsp_column_draggable_true dsp_column"><div opd_column_type="home" opd_account_session="%column_account_session_name_setting%" opd_provider="twitter" opd_column_width="%column_width_num%" style="height: 100%;width: %column_width_num%rem;min-width: 1rem;"><div class="column_bar" style="height: 20px;"><span class="dsp_column_title"><div class="dsp_column_move_icon_parent"><span class="dsp_column_move_icon"></span><span>Timeline</span><span class="dsp_column_now_session">%column_account_session_name_dsp%</span></div></span>${default_element_bar}<div class="dsp_column_close_btn_wrap"><span class="dsp_column_btn"><label class="dsp_column_close_btn opd_ui_icon_color" title="カラムを閉じる"><input type="button" class="column_close_btn" value="X"/></label></span></div></div>${column_settings_panel}<webview preload="${opd_system.load_webview_preload_script()}" partition="%column_account_session_name%" auto_reload_mouse_hover="false" allow="fullscreen" src="https://x.com/home" type="text/html" style="width: 100%;height: 100%;" opd_init_webview></webview></div></section>`},
        notification:{html:`<section draggable="true" id="column_%column_num%" class="dsp_column_draggable_true dsp_column"><div opd_column_type="notification" opd_account_session="%column_account_session_name_setting%" opd_provider="twitter" opd_column_width="%column_width_num%" style="height: 100%;width: %column_width_num%rem;min-width: 1rem;"><div class="column_bar" style="height: 20px;"><span class="dsp_column_title"><div class="dsp_column_move_icon_parent"><span class="dsp_column_move_icon"></span><span>Notifications</span><span class="dsp_column_now_session">%column_account_session_name_dsp%</span></div></span>${default_element_bar}<div class="dsp_column_close_btn_wrap"><span class="dsp_column_btn"><label class="dsp_column_close_btn opd_ui_icon_color" title="カラムを閉じる"><input type="button" class="column_close_btn" value="X"/></label></span></div></div>${column_settings_panel_no_auto}<webview preload="${opd_system.load_webview_preload_script()}" partition="%column_account_session_name%" allow="fullscreen" src="https://x.com/notifications" type="text/html" style="width: 100%;height: 100%;" opd_init_webview></webview></div></section>`},
        explore:{html:`<section draggable="true" id="column_%column_num%" class="dsp_column_draggable_true dsp_column"><div opd_column_type="explore" opd_account_session="%column_account_session_name_setting%" opd_provider="twitter" opd_column_width="%column_width_num%" opd_explore_path="%column_save_path%" opd_explore_title="%column_save_title%" opd_pinned_path="%column_pinned_save_path%" style="height: 100%;width: %column_width_num%rem;min-width: 1rem;"><div class="column_bar" style="height: 20px;"><span class="dsp_column_title"><div class="dsp_column_move_icon_parent"><span class="dsp_column_move_icon"></span><span>Explore</span><span class="dsp_column_now_session">%column_account_session_name_dsp%</span></div></span>${default_element_bar}<span class="dsp_column_btn"><input class="opd_pinned_btn" type="checkbox" title="ピン止め切り替え" %column_pinned_ch%><label class="dsp_column_pin_btn opd_ui_icon_color"></label></span><div class="dsp_column_close_btn_wrap"><span class="dsp_column_btn"><label class="dsp_column_close_btn opd_ui_icon_color" title="カラムを閉じる"><input type="button" class="column_close_btn" value="X"/></label></span></div></div>${column_settings_panel}<webview preload="${opd_system.load_webview_preload_script()}" partition="%column_account_session_name%" auto_reload_mouse_hover="false" allow="fullscreen" src="https://x.com%column_save_path%" type="text/html" style="width: 100%;height: 100%;" opd_init_webview></webview></div></section>`},
        misskey:{html:`<section draggable="true" id="column_%column_num%" class="dsp_column_draggable_true dsp_column"><div opd_column_type="misskey" opd_account_session="%column_account_session_name_setting%" opd_provider="misskey" opd_column_width="%column_width_num%"  style="height: 100%;width: %column_width_num%rem;min-width: 1rem;"><div class="column_bar" style="height: 20px;"><span class="dsp_column_title"><div class="dsp_column_move_icon_parent"><span class="dsp_column_move_icon"></span><span>Misskey.io</span><span class="dsp_column_now_session">%column_account_session_name_dsp%</span></div></span>${othersns_default_element_bar}<div class="dsp_column_close_btn_wrap"><span class="dsp_column_btn"><label class="dsp_column_close_btn opd_ui_icon_color" title="カラムを閉じる"><input type="button" class="column_close_btn" value="X"/></label></span></div></div>${column_settings_panel_othersns}<webview preload="${opd_system.load_webview_preload_script()}" partition="%column_account_session_name%" allow="fullscreen" src="https://misskey.io" type="text/html" style="width: 100%;height: 100%;" opd_webview_width_only opd_init_webview></webview></div></section>`},
        bsky:{html:`<section draggable="true" id="column_%column_num%" class="dsp_column_draggable_true dsp_column"><div opd_column_type="bsky" opd_account_session="%column_account_session_name_setting%" opd_provider="bluesky" opd_column_width="%column_width_num%"  style="height: 100%;width: %column_width_num%rem;min-width: 1rem;"><div class="column_bar" style="height: 20px;"><span class="dsp_column_title"><div class="dsp_column_move_icon_parent"><span class="dsp_column_move_icon"></span><span>Bluesky</span><span class="dsp_column_now_session">%column_account_session_name_dsp%</span></div></span>${othersns_default_element_bar}<div class="dsp_column_close_btn_wrap"><span class="dsp_column_btn"><label class="dsp_column_close_btn opd_ui_icon_color" title="カラムを閉じる"><input type="button" class="column_close_btn" value="X"/></label></span></div></div>${column_settings_panel_othersns}<webview preload="${opd_system.load_webview_preload_script()}" partition="%column_account_session_name%" allow="fullscreen" src="https://bsky.app" type="text/html" style="width: 100%;height: 100%;" opd_webview_width_only opd_init_webview></webview></div></section>`}
    };
    let ins_html = document.createElement("div");
    ins_html.id = "opd_main_element";
    ins_html.style = "position: fixed;z-index: 9999;top:0;left:0;width: 100%;height: 100%;background: white;display: flex;flex-direction: row;overflow: hidden;";
    let side_bar = `<section class="dsp_column" style="position:fixed;z-index:999;height:98%;"><div draggable="false" class="dsp_column_draggable_false" opd_column_type="dsp_column" opd_column_width="%column_width_num%" style="height:100%;min-width: 60px;max-width: 60px;text-align: center;background-color: white;"><div class="main_bar_functions"><div class="opd_ui_logo_parent" title="Open-Deck\r\nPrototype\r\nv${opd_system.opd_version()}"><div class="opd_ui_logo"></div><span class="opd_version_span">${opd_system.opd_version()}</span></div><hr><p class="opd_debug_menu">Debug<br><input type="button" id="init_settings" value="初期化" /><br><input type="button" id="profile_load_save" value="プロファイルローダー" /><br><input type="button" id="dnr_reload" value="dNR_Reload" /><br><input type="button" id="ext_reload" value="拡張機能再読み込み" /><br><div id="api_limit_status">API</div><hr><div class="dsp_btn_parent" id="add_timeline" title="タイムラインカラム追加"><div class="dsp_btn_add_tl_img"></div></div><div class="dsp_btn_parent" id="add_notify" title="通知カラム追加"><div class="dsp_btn_add_ntfc_img"></div></div><div class="dsp_btn_parent" id="add_explore" title="Explore(ユニバーサル)カラム追加"><div class="dsp_btn_add_explr_img"></div></div><hr><div class="dsp_btn_parent" id="add_misskey" title="Misskeyカラム追加"><div class="dsp_btn_add_misskey_img">Mi</div></div><div class="dsp_btn_parent" id="add_bsky" title="BlueSkyカラム追加"><div class="dsp_btn_add_bsky_img">BS</div></div><hr><div class="dsp_btn_parent" title="カラム段切り替え" id="second_rack"><div class="dsp_btn_second_rack_img"></div></div><hr><div class="dsp_btn_parent" title="システム設定" id="open_system_settings"><div class="dsp_btn_system_settings_add_img"></div></div><div class="dsp_btn_parent" title="アカウントセッションマネージャー" id="open_session_manager"><div class="dsp_btn_sesssion_manager_add_img"></div></div><div class="dsp_btn_parent" title="プロファイル保存" id="profile_save"><div class="dsp_btn_profile_add_img"></div></div><div class="dsp_btn_parent" title="プロファイル削除" id="profile_delete"><div class="dsp_btn_profile_delete_img"></div></div>${profile_list_html}</p></div></div></section><section draggable="false" class="dsp_column_draggable_false dsp_column"><div opd_column_type="main_bar_empty_column" id="main_bar_empty_column" style="height:100%;min-width: 60px;max-width: 60px;"></div></section>`;
    let main_column_html = ``;
    let second_column_html = ``;
    //設定2段
    let first_column_end = false;
    let second_column_end = false;
    let second_rack_mode = false;
    //カラム横幅
    let column_width_init = "30";
    //スクロール検出用
    let scroll_block = true;
    //
    //console.log(settings.column_settings.length)
    for (let index = 0; index < settings.column_settings.length; index++) {
        //console.log(default_element)
        for (let default_index = 0; default_index < Object.keys(default_element).length; default_index++) {
            //console.log(settings.column_settings[index].type+"-"+Object.keys(default_element))
            if(settings.column_settings[index].type == Object.keys(default_element)[default_index]){
                //console.log(default_element[Object.keys(default_element)[default_index]]["html"])
                let banner_checked = "";
                let init_top_visible_checked = "";
                let init_pinned_checked = "";
                let init_pinned_path = "";
                let init_auto_reload_checked = "";
                let init_account_sesion = "";
                let init_account_sesion_name = "";
                let init_account_sesion_dsp = "";
                let init_hide_rt_checked = "";
                let init_column_save_path = settings.column_settings[index].column_save_path;
                let init_column_save_title = settings.column_settings[index].column_save_title;
                let tw_view_type = settings.column_settings[index].tw_view_mode;
                let auto_reload_time = settings.column_settings[index].auto_reload_time / 1000;
                //バナー表示
                if(settings.column_settings[index].banner == true){
                    banner_checked = "checked";
                }
                //アカウントセッション
                if(settings.column_settings[index].account_session_name != null && settings.column_settings[index].account_session_name != "default"){
                    const session_store = await opd_system.opd_get_session_store();
                    console.log(settings.column_settings[index].account_session_name)
                    session_store[settings.column_settings[index].sns_provider].forEach((session)=>{
                        if(session.session_name == settings.column_settings[index].account_session_name){
                            init_account_sesion_name = session.session_name;
                            init_account_sesion_dsp = `@${session.session_name}`;
                            init_account_sesion = `persist:${session.system_session_id}`;
                            return;
                        }
                    })
                }
                //トップ検索など
                if(settings.column_settings[index].top_visible == true){
                    init_top_visible_checked = "checked";
                }
                //RT非表示
                if(settings.column_settings[index].hide_rt_tweet == true){
                    init_hide_rt_checked = "checked";
                }
                //カラム横幅
                if(settings.column_settings[index].column_width != null){
                    column_width_init = settings.column_settings[index].column_width;
                }
                //Exproleピン止め
                if(settings.column_settings[index].type == "explore"){
                    if(settings.column_settings[index].column_pinned_path != ""){
                        init_pinned_checked = "checked";
                        init_pinned_path = settings.column_settings[index].column_pinned_path;
                        init_column_save_path = settings.column_settings[index].column_pinned_path;
                        //%column_pinned_ch%
                    }else{
                        init_column_save_path = settings.column_settings[index].column_save_path;
                    }
                }
                //自動更新
                if(settings.column_settings[index].type == "explore" || settings.column_settings[index].type == "home"){
                    if(settings.column_settings[index].auto_reload){
                        init_auto_reload_checked = "checked";
                        //%column_pinned_ch%
                    }
                }
                //一段目終了検出にもかかわらず設定が存在していた場合2段目の変数に保存
                if(first_column_end == true){
                    second_column_html += default_element[Object.keys(default_element)[default_index]]["html"].replaceAll("%column_save_path%", init_column_save_path).replaceAll("%column_num%", create_random_id()).replace("%column_banner_ch%", banner_checked).replace("%column_top_bar_ch%", init_top_visible_checked).replace("%column_tw_view_mode%", tw_view_type).replace("%column_hide_rt_tweet%", init_hide_rt_checked).replace("%column_pinned_ch%", init_pinned_checked).replaceAll("%column_pinned_save_path%", init_pinned_path).replaceAll("%column_save_title%", init_column_save_title).replaceAll("%column_width_num%", column_width_init).replaceAll("%column_auto_reload_ch%", init_auto_reload_checked).replaceAll("%column_auto_reload_time%", auto_reload_time).replaceAll("%column_account_session_name_setting%", init_account_sesion_name).replaceAll("%column_account_session_name%", init_account_sesion).replaceAll("%column_account_session_name_dsp%", init_account_sesion_dsp);
                }else{
                    main_column_html += default_element[Object.keys(default_element)[default_index]]["html"].replaceAll("%column_save_path%", init_column_save_path).replaceAll("%column_num%", create_random_id()).replace("%column_banner_ch%", banner_checked).replace("%column_top_bar_ch%", init_top_visible_checked).replace("%column_tw_view_mode%", tw_view_type).replace("%column_hide_rt_tweet%", init_hide_rt_checked).replace("%column_pinned_ch%", init_pinned_checked).replaceAll("%column_pinned_save_path%", init_pinned_path).replaceAll("%column_save_title%", init_column_save_title).replaceAll("%column_width_num%", column_width_init).replaceAll("%column_auto_reload_ch%", init_auto_reload_checked).replaceAll("%column_auto_reload_time%", auto_reload_time).replaceAll("%column_account_session_name_setting%", init_account_sesion_name).replaceAll("%column_account_session_name%", init_account_sesion).replaceAll("%column_account_session_name_dsp%", init_account_sesion_dsp);
                }
                //一段目読込終了検出
                if(first_column_end == false && settings.column_settings[index].type == "empty_column"){
                    first_column_end = true;
                }
                //二段目読込終了検出
                if(second_column_end == false && settings.column_settings[index].type == "second_empty_column"){
                    second_column_end = true;
                }
            }
        }
    }
    //初期挿入HTML作成
    ins_html.innerHTML = `${side_bar}<div id="main_rack_element" style=""><div id="first_rack_element" style="height: 100%;display:flex;flex-direction:row;">${main_column_html}</div><div id="second_rack_element" style="display:flex;flex-direction:row;">${second_column_html}</div></div>`;
    //HTML挿入
    document.body.insertAdjacentElement("afterbegin", ins_html);
    //APIリミット表示用
    document.querySelector("#api_limit_status").addEventListener("click", function(){
        if(api_limit_obj != null){
            alert(`現在のAPIリミット状況(デフォルトセッション)\r\n回数(使用回数/総使用可能数)-完全回復時間\r\n${api_limit_dsc_obj.time_line}${api_limit_dsc_obj.recommend_timeline}${api_limit_dsc_obj.search}`);
        }
    });
    //Open-Deckについて表示
    document.querySelector(".opd_ui_logo").addEventListener("click", function(){
        opd_system.open_about_opd_window();
    });
    //デバッグメニュー表示
    let debug_menu_click_counter = 0;
    document.querySelector(".opd_version_span").addEventListener("click", function(){
        if(debug_menu_click_counter >= 7){
            alert("デバッグメニューが利用できます!");
            document.querySelector(".opd_debug_menu").style.display = "block";
        }else{
            debug_menu_click_counter += 1;
        }
    });
    //2段目が存在する場合の処理
    if(first_column_end == true && second_column_end == true){
        second_rack_mode = true;
        document.querySelector("#first_rack_element").style.height = "50%";
        document.querySelector("#second_rack_element").style.height = "50%";
        /*for (let index = 0; index < document.querySelectorAll('.dsp_column[draggable="true"]').length; index++) {
            document.querySelectorAll('.dsp_column[draggable="true"]')[index].style.height = "calc(100% - 25px)";
        }*/

        //document.querySelector("style[second_column_css]").textContent = `#second_rack_element .dsp_column[draggable="true"]{height:calc(100% - 25px)}`;

        document.querySelector("#second_rack").value = "Single Rack";
        document.querySelector(".dsp_btn_second_rack_img").style.backgroundImage = `url(${opd_system.load_resource(ui_icon_define.column_single_rack)})`;
    }
    //
    create_profile_list_btn();
    column_dd();
    column_close();
    append_object_css();
    //プロファイルリスト切替イベント作成関数
    async function create_profile_list_btn(){
        //プロファイルリスト切替イベント初期化
        for (let index = 0; index < profile_store.length; index++) {
            document.querySelector(`#userProfile-${index}`).addEventListener("click",function(){
                //console.log(profile_store[index].profile)
                const preload_array = profile_store[index].profile;
                let preload_desc_array = new Array(); 
                let preload_desc_count = 0;
                for (let preload_index = 0; preload_index < preload_array.length; preload_index++) {
                    switch (preload_array[preload_index].type) {
                        case "dsp_column":
                            preload_desc_count = 0;
                            break;
                        case "main_bar_empty_column":
                            preload_desc_count = 0;
                            break;
                        case "empty_column":
                            preload_desc_array.push("<!-1段目終了-!>");
                            preload_desc_count = 0;
                            break;
                        case "second_empty_column":
                            preload_desc_array.push("<!-2段目終了-!>");
                            preload_desc_count = 0;
                            break;
                        case "home":
                            preload_desc_array.push(`${preload_desc_count}-タイムラインカラム`);
                            break;
                        case "notification":
                            preload_desc_array.push(`${preload_desc_count}-通知カラム`);
                            break;
                        case "explore":
                            preload_desc_array.push(`${preload_desc_count}-[${preload_array[preload_index].column_save_title}]-ユニバーサル(Explore)カラム`);
                            break;
                        case "misskey":
                            preload_desc_array.push(`Misskeyカラム`);
                            break;
                        case "bsky":
                            preload_desc_array.push(`Blueskyカラム`);
                            break;
                        default:
                            preload_desc_count = 0;
                            break;
                    }
                    preload_desc_count += 1;
                }
                //console.log(preload_desc_array)
                if(confirm(`プロファイル「${index}」を読み込みますか?\r\nカラム構成\r\n${preload_desc_array.join("\r\n")}`)){
                    document.querySelector("#opd_main_element").remove();
                    last_load_profile = index;
                    opd_system.opd_get_data_store('opd_settings').then(function(value){
                        let load_setting = JSON.parse(value);
                        load_setting.opd_settings.last_load_profile = index;
                        opd_system.opd_set_data_store('opd_settings', JSON.stringify(load_setting)).then(function () {
                        });
                    });
                    const column_settings = {column_settings:profile_store[index].profile};
                    //console.log(column_settings)
                    run(column_settings, profile_store);
                }
            })
        }
    }
    //CSS適用(追加/変更の時に呼び出し)
    function append_object_css(mode, session_webview_obj){
        let column_object = null;
        if(mode == "session_set" || mode == "add_column"){
            column_object = session_webview_obj;
            console.log(session_webview_obj)
        }else{
            column_object = document.getElementsByTagName("webview");
        }
        for (let index = 0; index < column_object.length; index++) {
            column_object[index].removeAttribute("opd_init_webview");
            column_object[index].addEventListener("dom-ready", function(){
                //Electron 外部URLオープン動作
                this.executeJavaScript(`
                    window.open = function(url, target, windowFeatures) {
                        if(location.host != new URL(url).host && target == '_blank'){
                            opd_system.open_default_browser(url);
                        }
                    };
                    document.addEventListener('click', (event) => {
                        const target = event.target.closest('a');
                        console.log(target)
                        const misskey_img_link_filter = target?.querySelector("canvas[title]") == undefined;
                        if(target && target.href && misskey_img_link_filter){
                            event.preventDefault();
                            if(location.host != new URL(target.href).host){
                                opd_system.open_default_browser(target.href);
                            }
                        }
                    });
                    document.addEventListener('auxclick', (event) => {
                        const target = event.target.closest('a');
                        const misskey_img_link_filter = target?.querySelector("canvas[title]") == undefined;
                        if(target && target.href && misskey_img_link_filter){
                            event.preventDefault();
                            if(location.host != new URL(target.href).host){
                                opd_system.open_default_browser(target.href);
                            }
                        }
                    })`);
                    //Blueskyレイアウトずれ防止
                    console.log(column_object[index])
                    if(column_object[index].closest("div[opd_column_type]").getAttribute("opd_provider") == "bluesky"){
                        column_object[index].insertCSS(`html{scrollbar-gutter: initial !important;}`);
                    }
            });
            //アカウントセッション切り替え動作
            if(mode != "session_set"){
                console.log("set")
                const account_session_target = column_object[index].closest("div[opd_column_type]");
                account_session_target.getElementsByClassName("opd_change_session_btn")[0].addEventListener("click", function(){
                    const session_change_btn_parent = this.closest("div[opd_column_type]");
                    let session_name_dsp = "";
                    let session_name_setting = "default";
                    console.log(session_change_btn_parent)
                    console.log(session_change_btn_parent.getAttribute('opd_provider'))
                    const column_type = session_change_btn_parent.getAttribute('opd_provider');
                    console.log(column_type)
                    electron_opd_select_session(column_type, function(session_id, session_name){
                        const before_change_webview = session_change_btn_parent.getElementsByTagName("webview")[0];
                        console.log(session_id)
                        const new_session_webview = document.createElement('webview');
                        for (let attr of before_change_webview.attributes) {
                            console.log(attr)
                            if(attr.name != 'partition'){
                                new_session_webview.setAttribute(attr.name, attr.value);
                            }
                        }
                        if(session_id != "default_session"){
                            new_session_webview.setAttribute('partition', `persist:${session_id}`);
                            session_name_dsp = `@${session_name}`;
                            session_name_setting = session_name;
                        }else{
                            new_session_webview.setAttribute('partition', '');
                        }
                        console.log(before_change_webview)
                        console.log(new_session_webview)
                        session_change_btn_parent.getElementsByTagName("webview")[0].remove();
                        session_change_btn_parent.insertAdjacentElement('beforeend', new_session_webview);
                        append_object_css("session_set", session_change_btn_parent.getElementsByTagName("webview"));
                        session_change_btn_parent.setAttribute('opd_account_session', session_name_setting);
                        session_change_btn_parent.getElementsByClassName("dsp_column_now_session")[0].textContent = session_name_dsp;
                        column_settings_save("", last_load_profile);
                    });
                });
            }
            //ElectronCSS挿入用
            let el_banner_key = null;
            let el_top_visible_key = null;
            let el_content_filter_key = null;
            let el_hide_rt_tweet = null;
            //バナー/表示モード変更
            column_object[index].addEventListener("did-finish-load", function(){
                console.log("load")
                console.log(this.getAttribute("opd_webview_width_only"))
                console.log("opd_webview_width_only")
                this.addEventListener("message", (response) => {
                    console.log(response)
                }) 
                if(this.getAttribute("opd_webview_width_only") != ''){
                    //console.log(this)
                    let opd_column_div = this.closest("div[opd_column_type]");
                    let opd_column_banner_checkbox = opd_column_div.querySelector(".opd_banner");
                    let opd_column_top_visible_checkbox = opd_column_div.querySelector(".opd_top_bar");
                    let opd_column_tw_view_mode_opt = opd_column_div.querySelector(".opd_tw_view_mode");
                    let opd_column_hide_rt_tweet_opt = opd_column_div.querySelector(".opd_hide_rt_tweet");
                    //バナー表示設定読み込み適用
                   //Electron CSS挿入キー
                    //バナー表示ロード
                    if(el_banner_key == null){
                        //this.contentWindow.document.querySelector("head").insertAdjacentHTML("beforeend", `<style opd_banner_css></style>`);
                        this.insertCSS('header[role="banner"]{};').then((key)=>{
                            console.log(key)
                            el_banner_key = key;
                        })
                    }
                    if(opd_column_banner_checkbox.checked != true){
                        //console.log(this)
                        //this.contentWindow.document.querySelector('head style[opd_banner_css]').textContent = `header[role="banner"]{display:none};`;
                        this.insertCSS('header[role="banner"]{display:none};').then((key)=>{
                            console.log(key)
                            el_banner_key = key;
                        })
                    }else{
                        //console.log("else")
                        //this.contentWindow.document.querySelector('head style[opd_banner_css]').textContent = ``;
                        if(el_banner_key != null){
                            this.removeInsertedCSS(el_banner_key)
                        }
                    }
                    
                    //トップ検索欄等削除適用
                    if(opd_column_top_visible_checkbox.checked != true){
                        if(this.closest("div[opd_column_type]").getAttribute("opd_column_type") == "explore"){
                            console.log("explore")
                            console.log(this)
                            //div[data-testid="primaryColumn"] div[tabindex="0"][aria-label] div:has(form[role="search"]){display:none;}
                            //this.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1)div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1)`;
                            this.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible; filter: none;}').then((key)=>{
                                console.log(key)
                                el_top_visible_key = key;
                            })
                        }else{
                            if(this.closest("div[opd_column_type]").getAttribute("opd_column_type") == "home"){
                                console.log("home")
                                //this.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){display:none;} div[role="progressbar"] + div{display:none;}`;
                                this.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible; filter: none;} div[role="progressbar"] + div{visibility: hidden;height: 0;padding: 0;}').then((key)=>{
                                    console.log(key)
                                    el_top_visible_key = key;
                                    console.log("home"+el_top_visible_key)
                                })
                            }else{
                                //this.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){display:none;}`;
                                this.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible; filter: none;}').then((key)=>{
                                    console.log(key)
                                    el_top_visible_key = key;
                                })
                            }
                        }
                    }else{
                        //console.log("else")
                        //this.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = ``;
                        /*if(el_top_visible_key != null){
                            this.removeInsertedCSS(el_top_visible_key)
                        }*/
                    }
                    //RT非表示設定読み込み適用
                    if(opd_column_hide_rt_tweet_opt != null){
                        console.log(opd_column_hide_rt_tweet_opt.checked)
                        if(opd_column_hide_rt_tweet_opt.checked){
                            console.log("checked")
                            this.insertCSS('div[data-testid="cellInnerDiv"]:has(a>span[data-testid="socialContext"]){visibility: hidden; height: 0;}').then((key)=>{
                                el_hide_rt_tweet = key;
                            })
                        }
                    }
                    //ツイート表示項目設定読み込み適用
                    opd_column_tw_view_mode_opt.value = opd_column_tw_view_mode_opt.getAttribute("column_tw_view_mode_val");
                    switch (opd_column_tw_view_mode_opt.getAttribute("column_tw_view_mode_val")) {
                        case "0":
                            //this.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = ``;
                            break;
                        case "1":
                            //this.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = `div[data-testid="cellInnerDiv"]:has(div[aria-labelledby]){visibility: hidden; height: 0;}`;
                            this.insertCSS('div[data-testid="cellInnerDiv"]:has(div[aria-labelledby]){visibility: hidden; height: 0;}').then((key)=>{
                                el_content_filter_key = key;
                            })
                            break;
                        case "2":
                            //this.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = `div[data-testid="cellInnerDiv"]:not(:has(div[aria-labelledby])){visibility: hidden; height: 0;}`;
                            this.insertCSS('div[data-testid="cellInnerDiv"]:not(:has(div[aria-labelledby])){visibility: hidden; height: 0;}').then((key)=>{
                                el_content_filter_key = key;
                            })
                            break;
                        default:
                            if(el_content_filter_key != null){
                                this.removeInsertedCSS(el_content_filter_key)
                            }
                            //this.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = ``;
                            break;
                    }
                }
            })
            //各カラム読み込み後の動作(init)
            column_object[index].addEventListener("did-finish-load", function(){
                //console.log(this)
                let opd_column_div = this.closest("div[opd_column_type]");
                let opd_column_width_btn = opd_column_div.querySelector(".column_width_btn");
                let opd_column_width_select = opd_column_div.querySelector(".opd_column_size_preset");
                let opd_column_banner_checkbox = opd_column_div.querySelector(".opd_banner");
                let opd_column_top_visible_checkbox = opd_column_div.querySelector(".opd_top_bar");
                let opd_column_pinned_checkbox = opd_column_div.querySelector(".opd_pinned_btn");
                let opd_column_auto_reload_checkbox = opd_column_div.querySelector(".opd_a_reload_bar");
                let opd_column_auto_reload_time_reload = opd_column_div.querySelector(".opd_a_reload_time_setting");
                let opd_column_tw_view_mode_opt = opd_column_div.querySelector(".opd_tw_view_mode");
                let opd_column_hide_rt_tweet_opt = opd_column_div.querySelector(".opd_hide_rt_tweet");
                //設定パネルイベント
                if(mode != "session_set"){
                    opd_column_div.querySelector(".opd_settings_btn").addEventListener("click", function(){
                        console.log("OK")
                        const settings_panel = this.closest("div[opd_column_type]").querySelector(".dsp_column_settings_panel");
                        if(settings_panel.getAttribute("open") == null){
                            settings_panel.setAttribute("open", "");
                            settings_panel.style.display = "flex";
                        }else{
                            settings_panel.removeAttribute("open");
                            settings_panel.style.display = "none";
                        }
                    });
                }
                /**/
                if(mode != "session_set"){
                    opd_column_div.querySelector(".dsp_column_settings_panel_close_btn").addEventListener("click", function(){
                        const settings_panel = this.closest("div[opd_column_type]").querySelector(".dsp_column_settings_panel");
                        settings_panel.removeAttribute("open");
                        settings_panel.style.display = "none";
                    });
                    //設定パネル&ホバー時動作
                    opd_column_div.querySelector(".dsp_column_settings_panel").addEventListener("mouseover", function(){
                        opd_column_div.closest(".dsp_column").setAttribute("draggable", "false");
                    });
                    opd_column_div.querySelector(".dsp_column_settings_panel").addEventListener("mouseleave", function(){
                        opd_column_div.closest(".dsp_column").setAttribute("draggable", "true");
                    });
                }
                //設定パネルカラム幅設定
                if(opd_column_width_select != null){
                    switch (opd_column_div.getAttribute("opd_column_width")){
                        case '15':
                            opd_column_width_select.value = 0;
                            break;
                        case '20':
                            opd_column_width_select.value = 1;
                            break;
                        case '30':
                            opd_column_width_select.value = 2;
                            break;
                        default:
                            opd_column_width_select.value = 3;
                            break;
                    }
                    if(Number(opd_column_div.getAttribute("opd_column_width")) < 20){
                        this.closest("div[opd_column_type]").setAttribute("opd_column_mini", '');
                    }else{
                        this.closest("div[opd_column_type]").removeAttribute("opd_column_mini");
                    }
                    if(mode != "session_set"){
                        opd_column_width_select.addEventListener("change", function(){
                            let preset_rem = null;
                            switch (this.value){
                                case '0':
                                    preset_rem = 15;
                                    break;
                                case '1':
                                    preset_rem = 20;
                                    break;
                                case '2':
                                    preset_rem = 30;
                                    break;
                                default:
                                    preset_rem = 30;
                                    break;
                            }
                            if(preset_rem < 20){
                                this.closest("div[opd_column_type]").setAttribute("opd_column_mini", '');
                            }else{
                                this.closest("div[opd_column_type]").removeAttribute("opd_column_mini");
                            }
                            this.closest("div[opd_column_type]").setAttribute("opd_column_width", preset_rem);
                            this.closest("div[opd_column_type]").style.width = `${preset_rem}rem`;
                            column_settings_save("", last_load_profile);
                        });
                    };
                }
                //カラム横幅設定イベント
                function electron_opd_msg_box(type, title, message, min_value, default_setting_value, run_func){
                    switch(type){
                        case 'prompt':
                            document.body.insertAdjacentHTML("afterbegin", `<div class="electron_opd_msgbox_bg"><div class="electron_opd_msgbox_wrap"><div class="electron_opd_msgbox_content"><div>${title}</div><div>${message}</div><input id="electron_msgbox_input_value" type="number" min=${min_value} value=${default_setting_value}><div class="electron_opd_msgbox_confirm_btn"><input id="electron_msgbox_ok_btn" type="button" value="OK"><input id="electron_msgbox_cancel_btn" type="button" value="キャンセル"></div></div></div></div>`);
                            break;
                        case 'alert':
                            document.body.insertAdjacentHTML("afterbegin", `<div class="electron_opd_msgbox_bg"><div class="electron_opd_msgbox_wrap"><div class="electron_opd_msgbox_content"><div>${title}</div><div>${message}</div><div class="electron_opd_msgbox_confirm_btn"><input id="electron_msgbox_ok_btn" type="button" value="OK"><input id="electron_msgbox_cancel_btn" type="button" value="キャンセル"></div></div></div></div>`);
                            break;
                    }
                    document.querySelector(".electron_opd_msgbox_wrap #electron_msgbox_ok_btn").addEventListener("click", function(){
                        run_func(Number(document.querySelector(".electron_opd_msgbox_wrap #electron_msgbox_input_value").value))
                        document.querySelector(".electron_opd_msgbox_bg").remove();
                    })
                    document.querySelector(".electron_opd_msgbox_wrap #electron_msgbox_cancel_btn").addEventListener("click", function(){
                        document.querySelector(".electron_opd_msgbox_bg").remove();
                    })
                }
                if(mode != "session_set"){
                    opd_column_width_btn.addEventListener("click", function(){
                        const btn_obj = this;
                        const now_width = btn_obj.closest("div[opd_column_type]").getAttribute("opd_column_width");
                        let column_width_preset  = btn_obj.closest("div[opd_column_type]").querySelector(".opd_column_size_preset");
                        //let setting_width = prompt("カラム横幅のremを半角数字で入力\r\n目安 小:15 中:20 大:30 初期値:30\r\n11以下は入力できません", now_width);
                        let setting_width = electron_opd_msg_box('prompt', 'カラム幅設定', 'カラム横幅のremを半角数字で入力<br>目安 小:15 中:20 大:30<br>初期値:30 11以下は入力できません', '11', now_width, function(input_value){
                            //console.log(input_value);
                            if(input_value != null){
                                const setting_width_num = input_value;
                                if(setting_width_num != NaN && setting_width_num > 11){
                                    btn_obj.closest("div[opd_column_type]").setAttribute("opd_column_width", setting_width_num);
                                    btn_obj.closest("div[opd_column_type]").style.width = `${setting_width_num}rem`;
                                    column_settings_save("", last_load_profile);
                                    switch (setting_width_num){
                                        case 15:
                                            column_width_preset.value = 0;
                                            break;
                                        case 20:
                                            column_width_preset.value = 1;
                                            break;
                                        case 30:
                                            column_width_preset.value = 2;
                                            break;
                                        default:
                                            column_width_preset.value = 3;
                                            break;
                                    }
                                    if(setting_width_num < 20){
                                        btn_obj.closest("div[opd_column_type]").setAttribute("opd_column_mini", '');
                                    }else{
                                        btn_obj.closest("div[opd_column_type]").removeAttribute("opd_column_mini");
                                    }
                                }else{
                                    alert("正しい値を入力してください");
                                }
                            }
                        });
                    });
                }
                //他SNSカラム対応
                if(this.getAttribute("opd_webview_width_only") != ''){
                    //自動更新初期適用
                    let reload_test = 0;
                    let auto_reload_int = null;//チェックボックスイベントにも再利用
                    if(opd_column_auto_reload_checkbox != null){
                        //Home, Exproleカラムホバー中 自動更新上部遷移停止
                        opd_column_div.querySelector("webview").addEventListener("mouseover", function(){
                            this.setAttribute("auto_reload_mouse_hover", "true");
                        });
                        opd_column_div.querySelector("webview").addEventListener("mouseleave", function(){
                            this.setAttribute("auto_reload_mouse_hover", "false");
                        });
                       const auto_reload_target_elem = this;
                        //console.log(opd_column_auto_reload_checkbox)
                        if(mode != "session_set"){
                            opd_column_auto_reload_time_reload.addEventListener("change", function(){
                                const auto_reload_time = auto_reload_target_elem.closest('div[opd_column_type]').querySelector(".opd_a_reload_time_setting");
                                if(Number(auto_reload_time.value) >= 1){
                                    alert(`自動更新の秒数を${auto_reload_time.value}秒に設定しました`);
                                    column_settings_save("", last_load_profile);
                                }else{
                                    alert(`1秒以上の秒数を入力してください`);
                                    auto_reload_time.value = '10';
                                    column_settings_save("", last_load_profile);
                                }
                            });
                        }
                        //初期チェック動作
                        if(opd_column_auto_reload_checkbox.checked){
                            //console.log("init update!")
                            const auto_reload_time_input = auto_reload_target_elem.closest('div[opd_column_type]').querySelector(".opd_a_reload_time_setting");
                            const auto_reload_load_time = Number(auto_reload_time_input.value) * 1000;
                            auto_reload_time_input.disabled = true;
                            auto_reload_int = setInterval(async function(){
                                //console.log("update!")
                                //console.log(auto_reload_target_elem.contentWindow)
                                const now_url = new URL(auto_reload_target_elem.getURL());
                                if(now_url.pathname == "/home"){
                                    if(auto_reload_target_elem.getAttribute("auto_reload_mouse_hover") == "false"){
                                        await auto_reload_target_elem.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){height:initial;}').then((key)=>{
                                            auto_reload_target_elem.executeJavaScript(`console.log("update");document.querySelector('h2[role="heading"][dir="ltr"]').click()`).then(()=>{
                                                auto_reload_target_elem.removeInsertedCSS(key)
                                            })
                                        })
                                    }
                                };
                                if(now_url.pathname == "/search"){
                                    reload_test += 1;
                                    //console.log(reload_test);
                                    if(auto_reload_target_elem.getAttribute("auto_reload_mouse_hover") == "false"){
                                        auto_reload_target_elem.executeJavaScript(`window.scrollTo(0, 500)`);
                                        setTimeout(function(){
                                            auto_reload_target_elem.executeJavaScript(`window.scrollTo(0, 0)`);
                                        }, 10);
                                    }
                                };
                            }, auto_reload_load_time);
                        }
                    }
                    if(mode != "session_set"){
                        //console.log(opd_column_div.querySelector(".opd_banner").checked)
                        //バナーチェックイベント
                        opd_column_banner_checkbox.addEventListener("change", async function(){
                            column_settings_save("", last_load_profile);
                            //console.log(this.closest("div[opd_column_type]").querySelector("webview"))
                            let banner_mode_target_object = this.closest("div[opd_column_type]").querySelector("webview");
                            //console.log(banner_mode_target_object.contentWindow.document.querySelector('head style[opd_banner_css]'))
                            if(el_banner_key == null){
                                //banner_mode_target_object.contentWindow.document.querySelector("head").insertAdjacentHTML("beforeend", `<style opd_banner_css></style>`);
                                banner_mode_target_object.insertCSS('header[role="banner"]{};').then((key)=>{
                                    el_banner_key = key;
                                })
                            }
                            if(this.checked != true){
                                //console.log(this)
                                //banner_mode_target_object.contentWindow.document.querySelector('head style[opd_banner_css]').textContent = `header[role="banner"]{visibility: hidden; width: 0;};`;
                                banner_mode_target_object.insertCSS('header[role="banner"]{display:none};').then((key)=>{
                                    el_banner_key = key;
                                })
                            }else{
                                //console.log("else")
                                //banner_mode_target_object.contentWindow.document.querySelector('head style[opd_banner_css]').textContent = ``;
                                if(el_banner_key != null){
                                    banner_mode_target_object.removeInsertedCSS(el_banner_key)
                                }
                            }
                        });

                        //トップ検索欄等削除イベント
                        opd_column_top_visible_checkbox.addEventListener("change", async function(){
                            column_settings_save("", last_load_profile);
                            let topvisible_mode_target_object = this.closest("div[opd_column_type]").querySelector("webview");
                            //console.log(topvisible_mode_target_object.contentWindow.document.querySelector('head style[opd_top_visible_css]'))
                            if(el_top_visible_key == null){
                                //topvisible_mode_target_object.contentWindow.document.querySelector("head").insertAdjacentHTML("beforeend", `<style opd_top_visible_css></style>`);
                                topvisible_mode_target_object.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){}[data-testid="app-bar-back"]{}').then((key)=>{
                                    el_top_visible_key = key;
                                })
                            }
                            if(this.checked != true){
                                //console.log(this)
                                //topvisible_mode_target_object.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"] div[tabindex="0"][aria-label] div:has(form[role="search"]), div[data-testid="primaryColumn"] div[tabindex="0"][aria-label] div:has(h2[role="heading"]){display:none;};`;
                                if(this.closest("div[opd_column_type]").getAttribute("opd_column_type") == "explore"){
                                    //topvisible_mode_target_object.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible;}`;
                                    topvisible_mode_target_object.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible; filter: none;}').then((key)=>{
                                        el_top_visible_key = key;
                                    })    
                                }else{
                                    //console.log(this.closest("div[opd_column_type]").getAttribute("opd_column_type"))
                                    if(this.closest("div[opd_column_type]").getAttribute("opd_column_type") == "home"){
                                        //topvisible_mode_target_object.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;} [data-testid="app-bar-back"]{visibility: visible;} div[aria-label="ホームタイムライン"] * +div:first-of-type [data-testid="cellInnerDiv"]{} div[role="progressbar"] + div{display:none;}`;
                                        topvisible_mode_target_object.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible; filter: none;} div[role="progressbar"] + div{visibility: hidden;height: 0;padding: 0;}').then((key)=>{
                                            el_top_visible_key = key;
                                        })
                                    }else{
                                        //topvisible_mode_target_object.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = `div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible;}`;
                                        topvisible_mode_target_object.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){visibility: hidden; height: 0;top: calc(100vh - 60px);position: sticky;backdrop-filter: blur(0px) !important;}[data-testid="app-bar-back"]{visibility: visible; filter: none;}').then((key)=>{
                                            el_top_visible_key = key;
                                        })
                                    }
                                }
                            }else{
                                //console.log("else")
                                //topvisible_mode_target_object.contentWindow.document.querySelector('head style[opd_top_visible_css]').textContent = ``;
                                if(el_top_visible_key != null){
                                    topvisible_mode_target_object.removeInsertedCSS(el_top_visible_key)
                                }
                            }
                        });
                    }
                    //Exproleピン止め
                    if(opd_column_pinned_checkbox != null){
                        if(mode != "session_set"){
                            opd_column_pinned_checkbox.addEventListener("click", function(){
                                if(this.checked){
                                    if(confirm("この場所でピン止めしますか?")){
                                        const now_path = this.closest("div[opd_column_type]").getAttribute("opd_explore_path");
                                        this.closest("div[opd_column_type]").setAttribute("opd_pinned_path",now_path);
                                        column_settings_save("", last_load_profile);
                                    }else{
                                        this.checked = false;
                                    }
                                }else{
                                    if(confirm("ピン止めを解除します")){
                                        this.closest("div[opd_column_type]").setAttribute("opd_pinned_path","");
                                        column_settings_save("", last_load_profile);
                                        this.checked = false;
                                    }else{
                                        this.checked = true;
                                    }
                                }
                            });
                        }
                    }
                    //自動更新モードイベント
                    if(opd_column_auto_reload_checkbox != null){
                        if(mode != "session_set"){
                            opd_column_auto_reload_checkbox.addEventListener("click", function(){
                                let auto_reload_target_object = this.closest("div[opd_column_type]").querySelector("webview");
                                const auto_reload_time_input = this.closest("div[opd_column_type]").querySelector(".opd_a_reload_time_setting");
                                const auto_reload_time = Number(auto_reload_time_input.value) * 1000;
                                if(this.checked){
                                    auto_reload_time_input.disabled = true;
                                    auto_reload_int = setInterval(async function(){
                                        const now_url = new URL(auto_reload_target_object.getURL());
                                        //auto_reload_target_object.executeJavaScript('console.log("reload")')
                                        //console.log("update!")
                                        //console.log(auto_reload_target_object.contentWindow)
                                        if(now_url.pathname == "/home"){
                                            if(auto_reload_target_object.getAttribute("auto_reload_mouse_hover") == "false"){
                                                //auto_reload_target_object.contentWindow.document.querySelector('[aria-selected="true"]').click();
                                                await auto_reload_target_object.insertCSS('div[data-testid="primaryColumn"]>[tabindex="0"][aria-label]>div:nth-child(1){height:initial;}').then((key)=>{
                                                    auto_reload_target_object.executeJavaScript(`console.log("update");document.querySelector('h2[role="heading"][dir="ltr"]').click()`).then(()=>{
                                                        auto_reload_target_object.removeInsertedCSS(key)
                                                    })
                                                })
                                            }
                                        };
                                        if(now_url.pathname == "/search"){
                                            if(auto_reload_target_object.getAttribute("auto_reload_mouse_hover") == "false"){
                                                auto_reload_target_object.executeJavaScript(`window.scrollTo(0, 500)`);
                                                //auto_reload_target_object.contentWindow.scrollTo(0, 300);
                                                setTimeout(function(){
                                                    auto_reload_target_object.executeJavaScript(`window.scrollTo(0, 0)`);
                                                    //auto_reload_target_object.contentWindow.scrollTo(0, 0);
                                                }, 10);
                                            }
                                        };
                                    }, auto_reload_time);
                                    //console.log(auto_reload_time)
                                    column_settings_save("", last_load_profile);
                                }else{
                                    auto_reload_time_input.disabled = false;
                                    //console.log("update stop!")
                                    clearInterval(auto_reload_int);
                                    column_settings_save("", last_load_profile);
                                }
                            });
                        }
                    }
                    /*if(this.closest("div[opd_column_type]").getAttribute("opd_column_type") == "explore" || this.closest("div[opd_column_type]").getAttribute("opd_column_type") == "home"){
                    
                    }*/
                    //RT非表示変更イベント
                    if(mode != "session_set"){
                        if(opd_column_hide_rt_tweet_opt != null){
                            opd_column_hide_rt_tweet_opt.addEventListener("change", function(){
                                const target_webview = this.closest("div[opd_column_type]").querySelector("webview");
                                if(this.checked){
                                    target_webview.insertCSS('div[data-testid="cellInnerDiv"]:has(a>span[data-testid="socialContext"]){visibility: hidden; height: 0;}').then((key)=>{
                                        el_hide_rt_tweet = key;
                                    })
                                }else{
                                    target_webview.removeInsertedCSS(el_hide_rt_tweet)
                                }
                                column_settings_save("", last_load_profile);
                            })
                        }
                        //ツイート表示モードイベント
                        opd_column_tw_view_mode_opt.addEventListener("change", async function(){
                            console.log("visible")
                            column_settings_save("", last_load_profile);
                            //console.log(this.closest("div[opd_column_type]").querySelector("webview"))
                            let tw_view_mode_target_object = this.closest("div[opd_column_type]").querySelector("webview");
                            //console.log(this.value)
                            if(el_content_filter_key == null){
                                //tw_view_mode_target_object.contentWindow.document.querySelector("head").insertAdjacentHTML("beforeend", `<style opd_tw_view_mode_css></style>`);
                                await tw_view_mode_target_object.insertCSS('div[data-testid="cellInnerDiv"]:has(div[aria-labelledby]){}').then((key)=>{
                                    console.log(key)
                                    el_content_filter_key = key;
                                })
                            }
                            console.log(typeof el_content_filter_key)
                            if(el_content_filter_key != null){
                                await tw_view_mode_target_object.removeInsertedCSS(el_content_filter_key)
                            }
                            switch (this.value) {
                                case "0":
                                    //tw_view_mode_target_object.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = ``;
                                    break;
                                case "1":
                                    //tw_view_mode_target_object.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = `div[data-testid="cellInnerDiv"]:has(div[aria-labelledby]){visibility: hidden; height: 0;}`;
                                    tw_view_mode_target_object.insertCSS('div[data-testid="cellInnerDiv"]:has(div[aria-labelledby]){visibility: hidden; height: 0;}').then((key)=>{
                                        console.log(key)
                                        el_content_filter_key = key;
                                    })
                                    break;
                                case "2":
                                    //tw_view_mode_target_object.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = `div[data-testid="cellInnerDiv"]:not(:has(div[aria-labelledby])){visibility: hidden; height: 0;}`;
                                    tw_view_mode_target_object.insertCSS('div[data-testid="cellInnerDiv"]:not(:has(div[aria-labelledby])){visibility: hidden; height: 0;}').then((key)=>{
                                        console.log(key)
                                        el_content_filter_key = key;
                                    })
                                    break;
                                default:
                                    if(el_content_filter_key != null){
                                        tw_view_mode_target_object.removeInsertedCSS(el_content_filter_key)
                                    }
                                    //tw_view_mode_target_object.contentWindow.document.querySelector('head style[opd_tw_view_mode_css]').textContent = ``;
                                    break;
                                    }
                                })
                            }
                        }

                    }, {once: true})
            //exploreURL検出処理
            const opd_column_mutate = column_object[index].closest("div[opd_column_type]");
            if(opd_column_mutate.getAttribute("opd_column_type") == 'explore'){
                mutate_url(opd_column_mutate);
            }
        }
    }
    //URL, ページタイトル監視
    function mutate_url(element){
        let exp_object = element.querySelector("webview");
        exp_object.addEventListener("did-navigate-in-page", function(){
            const now_url = new URL(this.getURL());
            element.setAttribute("opd_explore_path", `${now_url.pathname}${now_url.search}`);
            column_settings_save("", last_load_profile);
        })
        exp_object.addEventListener("page-title-updated", function(){
            const now_text = this.getTitle();
            element.setAttribute("opd_explore_title", now_text);
            column_settings_save("", last_load_profile);
       })
    }
    //メインバーイベント
    document.getElementById("init_settings").addEventListener("click", function(){
        chrome.storage.local.remove("opd_settings", function(value){
            alert("設定を初期化しました。再読み込みしてください。");
        });
    });
    //画像付きを開いた時の自動スクロール阻止
    document.querySelector("#main_rack_element").addEventListener("scrollend", function(){
        document.querySelector("#main_rack_element").scrollTop = 0;
    })
    //二段表示
    document.getElementById("second_rack").addEventListener("click", function(){
        if(second_rack_mode == false){
            //document.querySelector("#main_rack_element").style.height = "50vh";
            document.querySelector("#first_rack_element").style.height = "50%";
            document.querySelector("#second_rack_element").style.height = "50%";
            //console.log(default_element.second_empty_column)
            //const second_rack_empty_html = `<section draggable="false" id="column_%column_num%" class="dsp_column dsp_column_second_emptycolumn"><div opd_column_type="second_empty_column" style="height: calc(100% - 20px);min-width: 30rem;display: flex;align-items: center;justify-content: center;"><p>2段目<br>1段目のカラムが配置できます</p></div></section>`;
            const second_rack_default_html = default_element.second_empty_column.html.replaceAll("%column_num%", create_random_id()).replace("%column_banner_ch%", "").replace("%column_tw_view_mode%", "0");
            document.querySelector("#second_rack_element").insertAdjacentHTML("beforeend", second_rack_default_html);
            /*for (let index = 0; index < document.querySelectorAll('.dsp_column[draggable="true"]').length; index++) {
                document.querySelectorAll('.dsp_column[draggable="true"]')[index].style.height = "calc(100% - 25px)";
            }*/
            //document.querySelector("style[second_column_css]").textContent = `.dsp_column[draggable="true"]{height:calc(100% - 25px)}`;
            //document.querySelector(".dsp_column_second_emptycolumn").scrollIntoView({behavior: "smooth",inline: "end"});
            //append_object_css();
            column_dd();
            column_close();
            column_settings_save("", last_load_profile);
            second_rack_mode = true;
            document.querySelector("#second_rack").value = "Single Rack";
            document.querySelector(".dsp_btn_second_rack_img").style.backgroundImage = `url(${opd_system.load_resource(ui_icon_define.column_single_rack)})`;
        }else{
            if(confirm("1段表示にします。\r\n2段目のカラムは全て閉じられます")){
                document.querySelector("#second_rack_element").textContent = "";
                document.querySelector("style[second_column_css]").textContent = ``;
                document.querySelector("#first_rack_element").style.height = "100%";
                document.querySelector("#second_rack_element").style.height = "0";
                document.querySelector("#second_rack_element").style.height = "0";
                //append_object_css();
                //column_dd();
                column_settings_save("", last_load_profile);
                second_rack_mode = false;
                document.querySelector("#second_rack").value = "Second Rack";
                document.querySelector(".dsp_btn_second_rack_img").style.backgroundImage = `url(${opd_system.load_resource(ui_icon_define.column_second_rack)})`;
            }
        }
    });
    //プロファイルローダー
    document.getElementById("profile_load_save").addEventListener("click", function(){
        window.open(opd_system.load_resource("profile_debug.html"), "OPD-Profile-Loader", 'width=720, height=600');
    });
    //
    document.getElementById("dnr_reload").addEventListener("click", function(){
        if(confirm("declarativeNetRequestの再読み込みします")){
            chrome.runtime.sendMessage({message: "dnr_upd"}).then((value)=>{
                if(value == true){
                    location.reload();
                }
            });
        }
    });
    document.getElementById("ext_reload").addEventListener("click", function(){
        if(confirm("拡張機能の再読み込みします")){
            chrome.runtime.sendMessage({message: "ext_reload"});
        }
    });
    //タイムラインカラム追加
    document.getElementById("add_timeline").addEventListener("click", function(){
        const new_column = default_element["home"]["html"].replaceAll("%column_num%", create_random_id()).replace("%column_banner_ch%", "").replace("%column_top_bar_ch%", "checked").replace("%column_tw_view_mode%", "0").replaceAll("%column_width_num%", "30").replaceAll("%column_auto_reload_ch%", "").replaceAll("%column_auto_reload_time%", "10000").replaceAll("%column_account_session_name_setting%", "default").replaceAll("%column_account_session_name%", "").replaceAll("%column_account_session_name_dsp%", "");
        document.querySelector(".dsp_column_emptycolumn").insertAdjacentHTML("beforebegin", new_column);
        document.querySelector(".dsp_column_emptycolumn").scrollIntoView({behavior: "smooth",inline: "end"});
        const all_webview = document.querySelectorAll('#main_rack_element webview[opd_init_webview]');
        console.log(all_webview)
        append_object_css("add_column", all_webview);
        column_dd();
        column_close();
        column_settings_save("", last_load_profile);
    });
    //通知カラム追加
    document.getElementById("add_notify").addEventListener("click", function(){
        const new_column = default_element["notification"]["html"].replaceAll("%column_num%", create_random_id()).replace("%column_banner_ch%", "").replace("%column_top_bar_ch%", "checked").replace("%column_tw_view_mode%", "0").replaceAll("%column_width_num%", "30").replaceAll("%column_account_session_name_setting%", "default").replaceAll("%column_account_session_name%", "").replaceAll("%column_account_session_name_dsp%", "");
        document.querySelector(".dsp_column_emptycolumn").insertAdjacentHTML("beforebegin", new_column);
        document.querySelector(".dsp_column_emptycolumn").scrollIntoView({behavior: "smooth",inline: "end"});
        const all_webview = document.querySelectorAll('#main_rack_element webview[opd_init_webview]');
        append_object_css("add_column", all_webview);
        column_dd();
        column_close();
        column_settings_save("", last_load_profile);
    });
    //Explore(ユニバーサル)カラム追加
    document.getElementById("add_explore").addEventListener("click", function(){
        const new_column = default_element["explore"]["html"].replaceAll("%column_save_path%", "/explore").replaceAll("%column_num%", create_random_id()).replace("%column_banner_ch%", "").replace("%column_top_bar_ch%", "checked").replace("%column_tw_view_mode%", "0").replaceAll("%column_pinned_save_path%", "").replaceAll("%column_width_num%", "30").replaceAll("%column_auto_reload_ch%", "").replaceAll("%column_auto_reload_time%", "10000").replaceAll("%column_account_session_name_setting%", "default").replaceAll("%column_account_session_name%", "").replaceAll("%column_account_session_name_dsp%", "");
        document.querySelector(".dsp_column_emptycolumn").insertAdjacentHTML("beforebegin", new_column);
        document.querySelector(".dsp_column_emptycolumn").scrollIntoView({behavior: "smooth",inline: "end"});
        const all_webview = document.querySelectorAll('#main_rack_element webview[opd_init_webview]');
        append_object_css("add_column", all_webview);
        column_dd();
        column_close();
        column_settings_save("", last_load_profile);
    });
    //他SNSカラム Electronのみ実装
    //Misskeyカラム追加
    document.getElementById("add_misskey").addEventListener("click", function(){
        const new_column = default_element["misskey"]["html"].replaceAll("%column_num%", create_random_id()).replaceAll("%column_width_num%", "30").replaceAll("%column_account_session_name_setting%", "default").replaceAll("%column_account_session_name%", "").replaceAll("%column_account_session_name_dsp%", "");
        document.querySelector(".dsp_column_emptycolumn").insertAdjacentHTML("beforebegin", new_column);
        document.querySelector(".dsp_column_emptycolumn").scrollIntoView({behavior: "smooth",inline: "end"});
        const all_webview = document.querySelectorAll('#main_rack_element webview[opd_init_webview]');
        append_object_css("add_column", all_webview);
        column_dd();
        column_close();
        column_settings_save("", last_load_profile);
    });
    //BlueSkyカラム追加
    document.getElementById("add_bsky").addEventListener("click", function(){
        const new_column = default_element["bsky"]["html"].replaceAll("%column_num%", create_random_id()).replaceAll("%column_width_num%", "30").replaceAll("%column_account_session_name_setting%", "default").replaceAll("%column_account_session_name%", "").replaceAll("%column_account_session_name_dsp%", "");
        document.querySelector(".dsp_column_emptycolumn").insertAdjacentHTML("beforebegin", new_column);
        document.querySelector(".dsp_column_emptycolumn").scrollIntoView({behavior: "smooth",inline: "end"});
        const all_webview = document.querySelectorAll('#main_rack_element webview[opd_init_webview]');
        append_object_css("add_column", all_webview);
        column_dd();
        column_close();
        column_settings_save("", last_load_profile);
    });
    //セッションマネージャー
    document.getElementById("open_session_manager").addEventListener("click", async function(){
        opd_system.open_session_manager_window();
    });
    //システム設定
    document.getElementById("open_system_settings").addEventListener("click", async function(){
        opd_system.open_system_settings_window();
    });
    //プロファイル保存ボタン
    document.getElementById("profile_save").addEventListener("click", async function(){
        if(confirm("現在の構成でプロファイルを作成します")){
            let profile = column_settings_save("profile_out");
            const save_object = {name:"user_profile", profile:profile.column_settings};
            //console.log(profile)
            profile_store.push(save_object);
            //console.log(profile_store)
            await opd_system.opd_set_data_store('opd_profile_store',JSON.stringify(profile_store)).then(function () {
                let profile_list_btn_html = "";
                //プロファイルリスト初期化
                for (let index = 0; index < profile_store.length; index++) {
                    profile_list_btn_html += `<div class="dsp_btn_parent" id="userProfile-${index}"><div class="dsp_btn_change_profile_btn">P${index}</div></div>`;
                }
                document.querySelector("#profile_btn_list").innerHTML = profile_list_btn_html;
                create_profile_list_btn();
            });
        }
    });
    //プロファイル削除ボタン
    document.getElementById("profile_delete").addEventListener("click", function(){
        const delete_num = Number(prompt("削除するプロファイル番号を半角入力"));
        if(last_load_profile != delete_num){
            if(confirm(`プロファイル${delete_num}を削除しますか?\r\n※削除後、残ったプロファイル番号は0から再度割り振られます。`)){
                let after_profile_num = null;
                profile_store.splice(delete_num, 1);
                //console.log(profile_store)
                opd_system.opd_set_data_store('opd_profile_store', JSON.stringify(profile_store)).then(function () {
                    //
                    opd_system.opd_get_data_store('opd_settings').then(function(load_value){
                        //console.log(last_load_profile)
                        if(last_load_profile<delete_num){
                            after_profile_num = last_load_profile;
                        }else{
                            after_profile_num = last_load_profile - 1;
                        }
                        if(after_profile_num < 0){
                            after_profile_num = 0;
                        }
                        last_load_profile = after_profile_num;
                        //
                        console.log(after_profile_num)
                        let load_setting = JSON.parse(load_value.opd_settings);
                        load_setting.last_load_profile = after_profile_num;
                        opd_system.opd_set_data_store('opd_settings', JSON.stringify(load_setting)).then(function (){
                            let profile_list_btn_html = "";
                            //プロファイルリスト初期化
                            for (let index = 0; index < profile_store.length; index++) {
                                profile_list_btn_html += `<div class="dsp_btn_parent" id="userProfile-${index}"><div class="dsp_btn_change_profile_btn">P${index}</div></div>`;
                            }
                            document.querySelector(".profile_val_now").textContent = after_profile_num;
                            document.querySelector("#profile_btn_list").innerHTML = profile_list_btn_html;
                            create_profile_list_btn();
                            });
                        });
                });
            }
        }else{
            alert("表示中のプロファイルは削除できません");
        }
    });
    //カラム移動
    function column_dd(){
        let column_class = document.querySelectorAll(".dsp_column");
        let column_copy_source = null;
        for (let index = 0; index < column_class.length; index++) {
            column_class[index].addEventListener("dragstart", function(ev){
                //console.log(this)
                column_copy_source = this;
                ev.dataTransfer.setData('text/html', ev.target.id);
            });
            column_class[index].addEventListener("dragover", function(ev){
                ev.preventDefault();
                if(!window.matchMedia("(prefers-color-scheme: dark)").matches){
                    this.style.borderLeft = '15px solid #2e2e2e';
                }else{
                    this.style.borderLeft = '15px solid #a3a3a3';
                }
                
            });
            column_class[index].addEventListener("dragleave", function(){
                this.style.borderLeft = '';
            });
            column_class[index].addEventListener("drop", function(ev){
                ev.preventDefault();
                //移動時初期表示設定
                //bn_twview_mode(this.querySelector("webview"));
                //exploreのURLセット
                //console.log(column_class[index])
                //移動セット
                const dt_id = ev.dataTransfer.getData('text/html');
                const dr_elem = document.getElementById(dt_id);
                if(dr_elem != null){
                    if(dr_elem?.querySelector("div")?.getAttribute("opd_column_type") == 'explore'){
                        // && dr_elem.querySelector("div").querySelector("webview").src != `https://x.com${dr_elem.querySelector("div").getAttribute("opd_explore_path")}`
                        //console.log(dr_elem.querySelector("div").getAttribute("opd_explore_path"))
                        //console.log(dr_elem.querySelector("div").getAttribute("opd_pinned_path"))
                        if(dr_elem.querySelector("div").getAttribute("opd_pinned_path") != ""){
                            //console.log("Pinned")
                            dr_elem.querySelector("div").querySelector("webview").src = `https://x.com${dr_elem.querySelector("div").getAttribute("opd_pinned_path")}`;
                        }else{
                           //console.log("Exp_save")
                            dr_elem.querySelector("div").querySelector("webview").src = `https://x.com${dr_elem.querySelector("div").getAttribute("opd_explore_path")}`;
                        }
                    }
                    this.parentNode.insertBefore(dr_elem, this);
                    this.style.borderLeft = '';
                    //append_object_css();
                    //column_dd();
                    column_settings_save("", last_load_profile);
                }else{
                    this.style.borderLeft = '';
                }
            })
        }
    }
    //カラム終了
    function column_close(){
        for (let index = 0; index < document.querySelectorAll(".column_close_btn").length; index++) {
            document.querySelectorAll(".column_close_btn")[index].addEventListener("click", function(){
                const pin_checkbox = this.closest(".dsp_column").querySelector(".opd_pinned_btn")?.checked;
                if(pin_checkbox == false || pin_checkbox == undefined){
                    this.closest(".dsp_column").remove();
                    //append_object_css();
                    //column_dd();
                    column_settings_save("", last_load_profile);
                }else{
                    if(confirm("ピン止めされているカラムです\r\nカラムを閉じますか？")){
                        this.closest(".dsp_column").remove();
                        //append_object_css();
                        //column_dd();
                        column_settings_save("", last_load_profile);
                    }
                }
            })
        }
    }
    //カラム構成保存
    function column_settings_save(mode, profile_num){
        let settings_array = {
            column_settings:[],
            version:opd_system.opd_version()
        };
        for (let index = 0; index < document.querySelectorAll("#opd_main_element div[opd_column_type]").length; index++) {
            let banner_checked = null;
            let top_visible_checked = null;
            let tw_view_type = null;
            let column_open_path = null;
            let column_pinned_save_path = null;
            let column_page_title = null;
            let column_width_value = null;
            let column_auto_reload = null;
            let column_auto_reload_time = 10000;
            let column_session_name = null;
            let column_sns_provider = null;
            let column_hide_rt = null;
            //アカウントセッション
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_account_session") != null){
                column_session_name = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_account_session");
            }else{
                column_session_name = "default";
            }
            //SNSプロバイダ
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_provider") != null){
                column_sns_provider = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_provider");
            }
            //バナー表示
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_banner")?.checked == true){
                banner_checked = true;
            }else{
                banner_checked = false;
            }
            //トップ検索欄等 
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_top_bar")?.checked == true){
                top_visible_checked = true;
            }else{
                top_visible_checked = false;
            }
            //RT非表示
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_hide_rt_tweet")?.checked == true){
                column_hide_rt = true;
            }else{
                column_hide_rt = false;
            }
            //ツイート表示モード
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_tw_view_mode")?.value != undefined){
                tw_view_type = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_tw_view_mode").value;
            }else{
                tw_view_type = "0";
            }
            //横幅設定
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_width") != "null"){
                //console.log(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_width"))
                column_width_value = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_width");
            }
            //exploreの処理
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_type") == 'explore'){
                //console.log(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_explore_path"));
                column_open_path = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_explore_path");
                //ピン止め
                column_pinned_save_path = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_pinned_path");
                //タイトル
                column_page_title = document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_explore_title");
            }else{
                column_open_path = "";
                column_pinned_save_path = "";
            }
            //自動更新
            if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_type") == 'explore' || document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_type") == 'home'){
                if(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_a_reload_bar")?.checked == true){
                    column_auto_reload = true;
                }else{
                    column_auto_reload = false;
                }
                const column_setting_time = Number(document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].querySelector(".opd_a_reload_time_setting").value) * 1000;
                //console.log(column_setting_time)
                if(column_setting_time >= 1000){
                    
                    column_auto_reload_time = column_setting_time;
                }else{
                    column_auto_reload_time = 10000;
                }
            }
            settings_array["column_settings"].push({type:document.querySelectorAll("#opd_main_element div[opd_column_type]")[index].getAttribute("opd_column_type"), banner:banner_checked, top_visible:top_visible_checked, tw_view_mode:tw_view_type, hide_rt_tweet:column_hide_rt, column_save_path:column_open_path, column_save_title:column_page_title, column_pinned_path:column_pinned_save_path, auto_reload:column_auto_reload, auto_reload_time:column_auto_reload_time, column_width:column_width_value, sns_provider:column_sns_provider, account_session_name:column_session_name});
        }
        if(mode == "profile_out"){
            return settings_array;
        }else{
            //console.log(settings_array);
            /*chrome.storage.local.set({'opd_settings': JSON.stringify(settings_array)}, function () {
                console.log(settings_array);
            });*/
            const save_object = {name:"user_profile", profile:settings_array.column_settings};
            //profile_store.push(save_object);
            Object.assign(profile_store[profile_num], save_object);
            //console.log(profile_store);
            opd_system.opd_set_data_store('opd_profile_store', JSON.stringify(profile_store)).then(function () {
                //console.log(settings_array);
            });
        }
    }
    //ランダムID作成
    function create_random_id(){
        return Math.random().toString(32).substring(2);
    }
    //メインX動作マスク
    /*function main_dsp(){
        document.getElementById("react-root").style.visibility = "hidden";
        document.getElementById("react-root").style.overflow = "hidden";
    }
    const target_elem = document.getElementById("react-root");
    const observer = new MutationObserver(main_dsp);
    observer.observe(target_elem,{
        childList: true,
        characterData: true,
        subtree: false
    });
    //title変更監視
    const head_observer = new MutationObserver(function(){
        document.title = "Open-Deck(ProtoType)";
        document.querySelector('link[rel="shortcut icon"]').href = opd_system.load_resource("icon.png");
    }).observe(document.querySelector("head"),{
        childList: true,
        characterData: true,
        subtree: false
    })*/
}
//設定初期化
function settings_init(){
    const profile_store_default = [{type:"main_bar_empty_column", banner:false, top_visible:true, tw_view_mode:"0", column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null}, {type:"home", banner:true, top_visible:true, tw_view_mode:"0", column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null}, {type:"notification", banner:false, top_visible:true, tw_view_mode:"0", column_save_path:"", auto_reload:false, auto_reload_time:10000, column_pinned_path:"", column_save_title:"", column_width:null}, {type:"explore", banner:false, top_visible:true, tw_view_mode:"0", exp_type:"", column_save_path:"/explore", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null}, {type:"empty_column", banner:false, top_visible:true, tw_view_mode:"0", column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null}];
    const settings = {
        last_load_profile:0,
        //column_settings:[{type:"main_bar_empty_column", banner:false, top_visible:true, tw_view_mode:"0", column_save_path:"", column_pinned_path:"", column_width:null}, {type:"home", banner:true, top_visible:true, tw_view_mode:"0", column_save_path:"", column_pinned_path:"", column_width:null}, {type:"notification", banner:false, top_visible:true, tw_view_mode:"0", column_save_path:"", column_pinned_path:"", column_width:null}, {type:"explore", banner:false, top_visible:true, tw_view_mode:"0", exp_type:"", column_save_path:"/explore", column_pinned_path:"", column_width:null}, {type:"empty_column", banner:false, top_visible:true, tw_view_mode:"0", column_save_path:"", column_pinned_path:"", column_width:null}],
        version:opd_system.opd_version()
    };
    let profile = [{name:"default", profile: profile_store_default}];
    //console.log(profile);
    opd_system.opd_set_data_store('opd_profile_store', JSON.stringify(profile));
    opd_system.opd_set_data_store('opd_settings', JSON.stringify(settings))
    if(prototype_version){
        alert("初期設定構築が完了しました。\r\nようこそ！Open-Deck試作版へ！");
    }else{
        alert("初期設定構築が完了しました！\r\nようこそ！Open-Deckへ！");
    }
    //location.reload();
}
//アカウントセッション切り替え選択
async function electron_opd_select_session(column_provider, func){
    const account_session = await opd_system.opd_get_session_store();
    document.body.insertAdjacentHTML("afterbegin", `<div class="electron_opd_select_as_bg"><div class="electron_opd_select_as_wrap"><div class="electron_opd_select_as_content"><div>アカウントセッション選択</div><div>切り替えるアカウントセッションを選択してください</div><table><tbody id="opd_select_sessions"><tr><th class="session_content" opd_session="default">デフォルトセッション</th></tr></tbody></table><div class="electron_opd_select_as_confirm_btn"><input id="electron_opd_select_as_cancel_btn" type="button" value="キャンセル"></div></div></div></div>`);
    document.querySelector('.electron_opd_select_as_bg th[opd_session="default"]').addEventListener("click", function(){
        if(confirm(`デフォルトセッションに切り替えますか？`)){
            document.querySelector(".electron_opd_select_as_bg").remove();
            func("default_session");
        }
    });
    console.log(column_provider)
    switch(column_provider){
        case 'twitter':
            account_session['twitter'].forEach(sessions => {
                const randomid = random_string();
                console.log(randomid)
                document.getElementById("opd_select_sessions").insertAdjacentHTML("beforeend", `<tr><th class="session_content" opd_session="sessions_${randomid}">${sessions.session_name}</th></tr>`);
                document.querySelector(`.electron_opd_select_as_bg th[opd_session="sessions_${randomid}"]`).addEventListener("click", function(){
                    if(confirm(`セッション「${sessions.session_name}」に切り替えますか？`)){
                        document.querySelector(".electron_opd_select_as_bg").remove();
                        func(sessions.system_session_id, sessions.session_name);
                    }
                });
            });
            break;
        case 'misskey':
            account_session['misskey'].forEach(sessions => {
                const randomid = random_string();
                document.getElementById("opd_select_sessions").insertAdjacentHTML("beforeend", `<tr><th class="session_content" opd_session="sessions_${randomid}">${sessions.session_name}</th></tr>`);
                document.querySelector(`.electron_opd_select_as_bg th[opd_session="sessions_${randomid}"]`).addEventListener("click", function(){
                    if(confirm(`セッション「${sessions.session_name}」に切り替えますか？`)){
                        document.querySelector(".electron_opd_select_as_bg").remove();
                        func(sessions.system_session_id, sessions.session_name);
                    }
                });
            });
            break;
        case 'bluesky':
            account_session['bluesky'].forEach(sessions => {
                const randomid = random_string();
                document.getElementById("opd_select_sessions").insertAdjacentHTML("beforeend", `<tr><th class="session_content" opd_session="sessions_${randomid}">${sessions.session_name}</th></tr>`);
                document.querySelector(`.electron_opd_select_as_bg th[opd_session="sessions_${randomid}"]`).addEventListener("click", function(){
                    if(confirm(`セッション「${sessions.session_name}」に切り替えますか？`)){
                        document.querySelector(".electron_opd_select_as_bg").remove();
                        func(sessions.system_session_id, sessions.session_name);
                    }
                });
            });
            break;
    }
    document.querySelector(".electron_opd_select_as_wrap #electron_opd_select_as_cancel_btn").addEventListener("click", function(){
        document.querySelector(".electron_opd_select_as_bg").remove();
    })
}