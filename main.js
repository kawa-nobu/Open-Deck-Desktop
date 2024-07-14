const {app, BrowserWindow, session, nativeTheme, dialog, shell, ipcMain} = require('electron');
const path = require("path");
const fs = require("fs");
let settings_app_exit_flag = false;
//APIアクセスリミット保持
let access_limit = {
  search:{limit: null, remaining: null, reset_unix_time: null}, 
  time_line:{limit: null, remaining: null, reset_unix_time: null}, 
  recommend_timeline:{limit: null, remaining: null, reset_unix_time: null}
};
//初回起動検出関数&ドキュメント閲覧
function is_first_running(){
  const sys_settings = fs.existsSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`);
  const opd_settings = fs.existsSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_settings.json`);
  const opd_profile = fs.existsSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_profile.json`);
  if(!sys_settings && !opd_settings && !opd_profile){
    dialog.showMessageBox({
      type: 'info',
      message: "ようこそOpen-Deck試作版へ！",
      detail:`使い方の映像を視聴しますか？(はじめての方は視聴を推奨)`,
      buttons: ["映像を見る", "OK"],
      defaultId: 0
    }).then((res)=>{
      if(res.response == 0){
        shell.openExternal(`https://www.youtube.com/watch?v=nQyuR3_-CqM`);
      }
    });
  }
}
//ストアデータ作成関数
function system_settings_store_init(mode){
  //ElectronシステムUI設定
  const sys_settings_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`;
  console.log(fs.existsSync(sys_settings_filepath))
  if(fs.existsSync(sys_settings_filepath) && mode == 'nomal'){
    return sys_settings_filepath;
  }else{
    //カラーモード0:システム, 1:ライト, 2:ダーク
    const settings = {
      last_window_width:1920,
      last_window_height:1080,
      color_mode:0,
      window_close_to_minimize:false
    };
    fs.writeFileSync(sys_settings_filepath, JSON.stringify(settings));
    console.log("create system settings store ok");
    return sys_settings_filepath;
  }
}
function settings_store_init(mode){
  const settings_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_settings.json`;
  console.log(fs.existsSync(settings_filepath))
  if(fs.existsSync(settings_filepath) && mode == 'nomal'){
    return settings_filepath;
  }else{
    const settings = {
      last_load_profile:0,
      version:app.getVersion()
    };
    fs.writeFileSync(settings_filepath, JSON.stringify({opd_settings:settings}));
    console.log("create settings store ok");
    return settings_filepath;
  }
}
function profile_store_init(mode){
  const profile_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_profile.json`;
  console.log(fs.existsSync(profile_filepath))
  if(fs.existsSync(profile_filepath) && mode == 'nomal'){
    return profile_filepath;
  }else{
    const profile_store_default = [{type:"main_bar_empty_column", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:null, account_session_name:null}, {type:"home", banner:true, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:"twitter", account_session_name:"default"}, {type:"notification", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", auto_reload:false, auto_reload_time:10000, column_pinned_path:"", column_save_title:"", column_width:null, sns_provider:"twitter", account_session_name:"default"}, {type:"explore", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, exp_type:"", column_save_path:"/explore", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:"twitter", account_session_name:"default"}, {type:"empty_column", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:null, account_session_name:null}];
    const profile = [{name:"default", profile: profile_store_default}];
    fs.writeFileSync(profile_filepath, JSON.stringify(profile));
    console.log("create profile store ok");
    return profile_filepath;
  }
}
//セッションストア作成
function session_store_init(mode){
  const session_store_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`;
  console.log(fs.existsSync(session_store_filepath))
  if(fs.existsSync(session_store_filepath) && mode == 'nomal'){
    return session_store_filepath;
  }else{
    const profile_store_default = {twitter: [], misskey: [], bluesky: [], pawoo: [], taittsuu: [], threads: []};
    fs.writeFileSync(session_store_filepath, JSON.stringify(profile_store_default));
    console.log("create session store ok");
    return session_store_filepath;
  }
}
//設定データ保存関数
function system_settings_save(data){
  const settings_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`, {encoding:'utf-8'});
  const settings_obj = JSON.parse(settings_json);
  let set_status = 0;
  data.forEach((settings)=>{
    console.log(settings_obj[settings.setting_name])
    if(settings_obj[settings.setting_name] != undefined){
      switch(settings.setting_name){
        case 'last_window_width':
          settings_obj.last_window_width = settings.value;
          break;
        case 'last_window_height':
          settings_obj.last_window_height = settings.value;;
          break;
        case 'color_mode':
          if(settings.value == 0){
            nativeTheme.themeSource = 'system';
            settings_obj.color_mode = settings.value;
          }else if(settings.value == 1){
            nativeTheme.themeSource = 'light';
            settings_obj.color_mode = settings.value;
          }else if(settings.value == 2){
            nativeTheme.themeSource = 'dark';
            settings_obj.color_mode = settings.value;
          }else{
            set_status = 1;
          }
          break;
        case 'window_close_to_minimize':
          settings_obj.window_close_to_minimize = settings.value;;
          break;
        default:
          set_status = 1;
      }
    }else{
      set_status = 2;
    }
  });
  switch(set_status){
    case 0:
      console.log(JSON.stringify(settings_obj))
      fs.writeFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`, JSON.stringify(settings_obj))
      return "Success";
    case 1:
      return "SettingsSaveErr";
    case 2:
      return "NotFoundSettings";
    default:
      return "SettingsSaveErr";
  }
}
//設定データ読み出し関数
function load_system_settings(){
  const settings_data = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`, {encoding:'utf-8'});
  return JSON.parse(settings_data);
}
//ウィンドウ
let opd_main_window;
let session_manager_window;
let system_settings_window;
let about_opd_window;
//子ウィンドウオープンフラグ
let is_open_session_manager_window = false;
let is_open_system_settings_window = false;
let is_open_about_opd_window = false;
//メインウィンドウ作成
const createWindow = () => {
  
  opd_main_window = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth : 720,
    minHeight: 480,
    title: "Open-Deck",
    webPreferences: {
      preload: path.join(app.getAppPath(), './preload.js'),
      additionalArguments: [
        `--opd_resource_path=${app.getAppPath().replaceAll("\\", "/")}/opd_resource/`,
        `--opd_webview_preload_path=${app.getAppPath().replaceAll("\\", "/")}/preload_webview.js`,
        `--opd_system_settings_path=${system_settings_store_init('nomal')}`,
        `--opd_settings_store_path=${settings_store_init('nomal')}`,
        `--opd_profile_store_path=${profile_store_init('nomal')}`,
        `--opd_session_store_path=${session_store_init('nomal')}`,
        `--opd_version=${app.getVersion()}`
      ],
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag:true
    }
  })
  //初期起動案内
  is_first_running();
  const system_settings = load_system_settings();
  console.log(system_settings)
  switch(system_settings.color_mode){
    case 0:
      nativeTheme.themeSource = 'system';
      break;
    case 1:
      nativeTheme.themeSource = 'light';
      break;
    case 2:
      nativeTheme.themeSource = 'dark';
      break;
    default:
      nativeTheme.themeSource = 'system';
      break;
    }
    //is_first_running();
    //opd_main_window.setMenuBarVisibility(false);
    opd_main_window.loadURL(`file://${app.getAppPath()}/opd_resource/main.html`);
    //閉じるボタン最小化
    opd_main_window.on('close', (event) => {
      const close_system_settings = load_system_settings();
      if(close_system_settings.window_close_to_minimize && settings_app_exit_flag == false){
        event.preventDefault();
        console.log("close")
        opd_main_window.minimize();
      }else{
        app.quit();
      }
    });
  }
app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length == 0){
        createWindow();
      }
    });
    app.on('window-all-closed', () => {
      app.quit();
    });
  })
  
app.on("ready", ()=>{
  //CSLT読み込み(cookiesやpopup部分に難あり。実装はしばらく見送り)
  /*session.defaultSession.loadExtension(`${app.getAppPath().replaceAll("\\", "/")}/opd_extension/cslt/`).then(({ id }) => {
    console.log(`loadExtension=>${id}`)
  })*/
  //API使用率収集
  const status_get_urls = {
    urls: ["https://x.com/i/api/*", "https://api.x.com/*", "https://twitter.com/i/api/*", "https://api.twitter.com/*"]
  }
  session.defaultSession.webRequest.onHeadersReceived(status_get_urls, (details, callback) => {
    callback({})
    if(details.url.search(/(SearchTimeline|HomeLatestTimeline|HomeTimeline)/g)){
      Object.keys(details.responseHeaders).forEach((key) => {
        switch (key) {
          case "x-rate-limit-remaining":
            if(details.url.search(/SearchTimeline/g) != -1){
              access_limit.search.remaining = details.responseHeaders[key];
            }
            if(details.url.search(/HomeLatestTimeline/g) != -1){
              access_limit.time_line.remaining = details.responseHeaders[key];
            }
            if(details.url.search(/HomeTimeline/g) != -1){
              access_limit.recommend_timeline.remaining= details.responseHeaders[key];
            }
              break;
          case "x-rate-limit-limit":
            //console.log(key)
            if(details.url.search(/SearchTimeline/g) != -1){
              access_limit.search.limit = details.responseHeaders[key];
            }
            if(details.url.search(/HomeLatestTimeline/g) != -1){
              access_limit.time_line.limit = details.responseHeaders[key];
            }
            if(details.url.search(/HomeTimeline/g) != -1){
              access_limit.recommend_timeline.limit = details.responseHeaders[key];
            }
              break;
          case "x-rate-limit-reset":
            //console.log(key)
            if(details.url.search(/SearchTimeline/g) != -1){
              access_limit.search.reset_unix_time = details.responseHeaders[key];
            }
            if(details.url.search(/HomeLatestTimeline/g) != -1){
              access_limit.time_line.reset_unix_time = details.responseHeaders[key];
            }
            if(details.url.search(/HomeTimeline/g) != -1){
              access_limit.recommend_timeline.reset_unix_time = details.responseHeaders[key];
            }
              break;
          default:
              break;
            }
            //ipcRenderer.invoke('opd_update_access_limit', {limit_obj:access_limit});
            //opd_main_window.webContents.send('opd_update_access_limit', {limit_obj:access_limit})
            opd_main_window.webContents.send('event-from-main', access_limit);
      });
    }
  });
})
//セッションマネージャー関連処理
ipcMain.handle('OPD_SessionManager_GetStore', (event, data) => {
  console.log(data);
  const session_store_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, {encoding:'utf-8'});
  return JSON.parse(session_store_json);
})
ipcMain.handle('OPD_SessionManager_AddStore', (event, data) => {
  console.log(data)
  const session_store_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, {encoding:'utf-8'});
  const session_store_obj = JSON.parse(session_store_json);
  console.log(data.add_data.provider)
  console.log(session_store_obj[data.add_data.provider])
  if(session_store_obj[data.add_data.provider] != undefined){
    let exis_session_name = null;
    session_store_obj[data.add_data.provider].forEach((obj)=>{
      console.log(obj)
      if(obj.session_name == data.add_data.session_name){
        exis_session_name = data.add_data.session_name;
      }
    })
    if(exis_session_name == null){
      //システム固有名(デフォルト)チェック
      if(data.add_data.session_name.match(/(default|デフォルト)/g) == null){
        const sys_session_id = `OPDS_${crypto.randomUUID()}`;
        const write_data = {session_name: data.add_data.session_name, system_session_id:sys_session_id, server:data.add_data.server_name}
        session_store_obj[data.add_data.provider].push(write_data);
        fs.writeFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, JSON.stringify(session_store_obj));
        return {status:"Complete"};
      }else{
        return {status:"UnavailableString"};
      }
    }else{
      return {status:"ExistedSessionName"};
    }
  }else{
    return {status:"NotFoundProvider"};
  }
});
ipcMain.handle('OPD_SessionManager_DeleteStore', (event, data) => {
  console.log(data)
  const session_store_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, {encoding:'utf-8'});
  const session_store_obj = JSON.parse(session_store_json);
  if(session_store_obj[data.add_data.provider] != undefined){
    const write_data = [];
    session_store_obj[data.add_data.provider].forEach((obj)=>{
      if(obj.session_name != data.add_data.session_name){
        write_data.push(obj)
      }else{
        console.log("found!")
      }
    })
    session_store_obj[data.add_data.provider] = write_data;
    fs.writeFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, JSON.stringify(session_store_obj));
    return {status:"Complete"};
  }else{
    return {status:"NotFoundProvider"};
  }
})
//ストアデータ関連処理
ipcMain.handle('OPD_GetStoreItem', async function(e, data){
  console.log(data)
  switch(data.message){
    case 'opd_system_settings':
      const read_system_settings = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`, {encoding:'utf-8'});
      return read_system_settings;
    case 'opd_settings':
      const read_settings = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_settings.json`, {encoding:'utf-8'});
      return read_settings;
    case 'opd_profile_store':
      const read_profile = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_profile.json`, {encoding:'utf-8'});
      return read_profile;
  }
})
ipcMain.handle('OPD_SetStoreItem', function(e, data){
  console.log(data)
  switch(data.message){
    case 'opd_system_settings':
      const set_system_settings = system_settings_save(data.settings_data);
      return set_system_settings;
    case 'opd_settings':
      const set_settings = fs.writeFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_settings.json`, data.json_data);
      return set_settings;
    case 'opd_profile_store':
      const set_profile = fs.writeFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_profile.json`, data.json_data);
      return set_profile;
  }
})
ipcMain.on('OPD_StoreReset', function(e, data){
  system_settings_store_init('reset');
  settings_store_init('reset');
  profile_store_init('reset');
  return true;
})
//システム設定表示
const system_settings_createWindow = () => {
  system_settings_window = new BrowserWindow({
    width: 880,
    height: 550,
    resizable: true,
    minimizable: false,
    maximizable: false,
    title: "Open-Deckシステム設定",
    webPreferences: {
      preload: path.join(app.getAppPath(), './preload_system_settings.js'),
      additionalArguments: [
        `--opd_resource_path=${app.getAppPath().replaceAll("\\", "/")}/opd_resource/`,
        `--opd_settings_store_path=${system_settings_store_init('nomal')}`
      ],
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  system_settings_window.setMenuBarVisibility(false);
  system_settings_window.setAlwaysOnTop(true, "screen-saver");
  system_settings_window.loadURL(`file://${app.getAppPath()}/opd_resource/system_settings.html`);
  system_settings_window.addListener("close", function(){
    is_open_system_settings_window = false;
  });
}
ipcMain.on('open_system_settings', function(e, data){
  if(!is_open_system_settings_window){
    is_open_system_settings_window = true;
    system_settings_createWindow();
  }else{
    system_settings_window.focus();
  }
  return true;
})
//設定画面アプリケーション終了
ipcMain.on('OPD_AppExit', function(e, data){
  settings_app_exit_flag = true;
  app.quit();
  return true;
})
//セッションマネージャー表示
const session_manager_opd_createWindow = () => {
  session_manager_window = new BrowserWindow({
    width: 880,
    height: 550,
    resizable: true,
    minimizable: false,
    maximizable: false,
    title: "Open-Deckアカウントセッションマネージャー",
    webPreferences: {
      preload: path.join(app.getAppPath(), './preload_session_manager.js'),
      additionalArguments: [
        `--opd_resource_path=${app.getAppPath().replaceAll("\\", "/")}/opd_resource/`,
        `--opd_session_store_path=${session_store_init('nomal')}`
      ],
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  session_manager_window.setMenuBarVisibility(false);
  session_manager_window.setAlwaysOnTop(true, "screen-saver");
  session_manager_window.loadURL(`file://${app.getAppPath()}/opd_resource/session_manager.html`);
  session_manager_window.addListener("close", function(){
    is_open_session_manager_window = false;
  })
}
ipcMain.on('open_session_manager', function(e, data){
  if(!is_open_session_manager_window){
    is_open_session_manager_window = true;
    session_manager_opd_createWindow();
  }else{
    session_manager_window.focus();
  }
  return true;
})
//Open-Deck情報表示画面
const about_opd_createWindow = () => {
  about_opd_window = new BrowserWindow({
    width: 680,
    height: 310,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: "Open-Deckについて",
    webPreferences: {
      preload: path.join(app.getAppPath(), './about_opd_preload.js'),
      additionalArguments: [
        `--opd_resource_path=${app.getAppPath().replaceAll("\\", "/")}/opd_resource/`,
        `--opd_settings_store_path=${settings_store_init('nomal')}`,
        `--opd_profile_store_path=${profile_store_init('nomal')}`,
        `--opd_version=${app.getVersion()}`
      ],
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })
  about_opd_window.setMenuBarVisibility(false);
  about_opd_window.setAlwaysOnTop(true, "screen-saver");
  about_opd_window.loadURL(`file://${app.getAppPath()}/opd_resource/about_opd.html`);
  about_opd_window.addListener("close", function(){
    is_open_about_opd_window = false;
  })
}
ipcMain.on('open_about_opd', function(e, data){
  if(!is_open_about_opd_window){
    is_open_about_opd_window = true;
    about_opd_createWindow();
  }else{
    about_opd_window.focus();
  }
  return true;
})
//外部URLオープン
ipcMain.on('open_default_browser', function(e, data){
  console.log(data)
  const url = new URL(data)
  dialog.showMessageBox({
    type: 'warning',
    message: "外部のURLを開こうとしています！",
    detail:`信頼できるURLのみ開く事を推奨します。\r\nURL: ${decodeURIComponent(url.href)}\r\n「開く」押下でウェブサイトへ移動します`,
    buttons: ["開く", "キャンセル"],
    defaultId: 0
  }).then((res)=>{
    if(res.response == 0){
      shell.openExternal(url.href);
    }
  });
  return true;
})
//ライセンスディレクトリオープン
ipcMain.on('open_license_directory', function(){
  dialog.showMessageBox({
    type: 'info',
    message: "使用ライブラリ ライセンス",
    detail:`使用しているライブラリのライセンスはOpen-Deck格納ディレクトリに保存されています。\r\n今すぐ開きますか？`,
    buttons: ["開く", "キャンセル"],
    defaultId: 0
  }).then((res)=>{
    if(res.response == 0){
      shell.openPath(app.getAppPath());
    }
  });
  return true;
})