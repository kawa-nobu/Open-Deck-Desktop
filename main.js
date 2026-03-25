const {app, BrowserWindow, Notification, session, nativeTheme, dialog, shell, ipcMain} = require('electron');
const path = require("path");
const fs = require("fs");
const { profile } = require('console');
let settings_app_exit_flag = false;
//デバッグモード引数フラグ
const debug_mode_flag = process.argv.some(arg => arg.startsWith('--opd-debug'));
debug_stdout(process.argv)
//デバッグログ標準出力
function debug_stdout(input){
  if(debug_mode_flag){
    console.log(`<-=DEBUG/${new Date()}=->`);
    console.trace(input);
  }
}
//APIアクセスリミット保持
let access_limit = {
  search:{limit: null, remaining: null, reset_unix_time: null}, 
  time_line:{limit: null, remaining: null, reset_unix_time: null}, 
  recommend_timeline:{limit: null, remaining: null, reset_unix_time: null}
};
//設定データ存在フラグ
const sys_settings_check_flag = fs.existsSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`);
//初回起動検出関数&ドキュメント閲覧
function is_first_running(check_flag){
  debug_stdout("first_running")
  if(!check_flag){
    dialog.showMessageBox({
      type: 'info',
      message: "ようこそOpen-Deck試作版へ！",
      detail:`使い方の映像を視聴しますか？(はじめての方は視聴を推奨)\r\nツールバーのOpen-Deckアイコンをクリックし、「Help」下のYouTubeのリンクから再度視聴できます`,
      buttons: ["今すぐ映像を見る", "OK"],
      defaultId: 0
    }).then((res)=>{
      if(res.response == 0){
        shell.openExternal(`https://www.youtube.com/watch?v=nQyuR3_-CqM`);
      }
    });
  }
}
//ストアデータアップデートチェック
function system_settings_update_checker(sys_settings_filepath, default_setting){
  const settings_json = fs.readFileSync(sys_settings_filepath, {encoding:'utf-8'});
  const settings = JSON.parse(settings_json);

  const default_setting_keys = Object.keys(default_setting);
  let updated_flag = false;

  //新規設定項目があれば新しく作成する
  for (let index = 0; index < default_setting_keys.length; index++) {
    if(!(default_setting_keys[index] in settings)){
      settings[default_setting_keys[index]] = default_setting[default_setting_keys[index]]
      updated_flag = true;
    }
  }

  //新規で設定項目があったら書き込む
  if(updated_flag){
    fs.writeFileSync(sys_settings_filepath, JSON.stringify(settings))
  }
}

//ストアデータ作成関数
function system_settings_store_init(mode){
  //ElectronシステムUI設定
  const sys_settings_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`;
  debug_stdout(fs.existsSync(sys_settings_filepath))
  //システム設定初期値(設定項目が増えていくごとにここを増やす)
  //カラーモード0:システム, 1:ライト, 2:ダーク
  const settings = {
    last_window_width:1920,
    last_window_height:1080,
    color_mode:0,
    scrollbar_thin_mode:true,
    contents_hide_promotion:false,
    window_close_to_minimize:false
  };

  if(fs.existsSync(sys_settings_filepath) && mode == 'nomal'){
    system_settings_update_checker(sys_settings_filepath, settings)
    return sys_settings_filepath;
  }else{
    fs.writeFileSync(sys_settings_filepath, JSON.stringify(settings));
    debug_stdout("create system settings store ok");
    return sys_settings_filepath;
  }
}
function settings_store_init(mode){
  const settings_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_settings.json`;
  debug_stdout(fs.existsSync(settings_filepath))
  if(fs.existsSync(settings_filepath) && mode == 'nomal'){
    return settings_filepath;
  }else{
    const settings = {
      last_load_profile:0,
      version:app.getVersion()
    };
    fs.writeFileSync(settings_filepath, JSON.stringify({opd_settings:settings}));
    debug_stdout("create settings store ok");
    return settings_filepath;
  }
}
function profile_store_init(mode){
  const profile_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_profile.json`;
  debug_stdout(fs.existsSync(profile_filepath))
  if(fs.existsSync(profile_filepath) && mode == 'nomal'){
    return profile_filepath;
  }else{
    const profile_store_default = [{type:"main_bar_empty_column", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:null, account_session_name:null}, {type:"home", banner:true, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:"twitter", account_session_name:"default"}, {type:"notification", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", auto_reload:false, auto_reload_time:10000, column_pinned_path:"", column_save_title:"", column_width:null, sns_provider:"twitter", account_session_name:"default"}, {type:"explore", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, exp_type:"", column_save_path:"/explore", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:"twitter", account_session_name:"default"}, {type:"empty_column", banner:false, top_visible:true, tw_view_mode:"0", hide_rt_tweet:false, column_save_path:"", column_save_title:"", column_pinned_path:"", auto_reload:false, auto_reload_time:10000, column_width:null, sns_provider:null, account_session_name:null}];
    const profile = [{name:"default", profile: profile_store_default}];
    fs.writeFileSync(profile_filepath, JSON.stringify(profile));
    debug_stdout("create profile store ok");
    return profile_filepath;
  }
}
//セッションストア作成
function session_store_init(mode){
  const session_store_filepath = `${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`;
  debug_stdout(fs.existsSync(session_store_filepath))
  if(fs.existsSync(session_store_filepath) && mode == 'nomal'){
    return session_store_filepath;
  }else{
    const profile_store_default = {twitter: [], misskey: [], bluesky: [], pawoo: [], taittsuu: [], threads: []};
    fs.writeFileSync(session_store_filepath, JSON.stringify(profile_store_default));
    debug_stdout("create session store ok");
    return session_store_filepath;
  }
}
//設定データ保存関数
function system_settings_save(data){
  const settings_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_system_settings.json`, {encoding:'utf-8'});
  const settings_obj = JSON.parse(settings_json);
  let set_status = 0;
  data.forEach((settings)=>{
    debug_stdout(settings_obj[settings.setting_name])
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
          settings_obj.window_close_to_minimize = settings.value;
          break;
        case 'contents_hide_promotion':
          settings_obj.contents_hide_promotion = settings.value;
          break;
        case 'scrollbar_thin_mode':
          settings_obj.scrollbar_thin_mode = settings.value;
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
      debug_stdout(JSON.stringify(settings_obj))
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
      webviewTag:true/*,
      backgroundThrottling: false*/
    }
  })
  //初期起動案内
  is_first_running(sys_settings_check_flag);
  const system_settings = load_system_settings();
  debug_stdout(system_settings)
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
    if(!debug_mode_flag){
      opd_main_window.setMenuBarVisibility(false);
    }
    opd_main_window.loadURL(`file://${app.getAppPath()}/opd_resource/main.html`);
    //閉じるボタン最小化
    opd_main_window.on('close', (event) => {
      const close_system_settings = load_system_settings();
      if(close_system_settings.window_close_to_minimize && settings_app_exit_flag == false){
        event.preventDefault();
        debug_stdout("close")
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
    debug_stdout(`loadExtension=>${id}`)
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
            //debug_stdout(key)
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
            //debug_stdout(key)
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
            opd_main_window.webContents.send('OPD_update_api_limit', access_limit);
      });
    }
  });
})
app.on('session-created', (session) => {
  debug_stdout(session);
  const block_rules = [
    {
      referer: 'https://x.com/compose/post',
      target: 'https://x.com/i/api/1.1/graphql/user_flow.json',
    },
    {
      referer: 'https://x.com/compose/post',
      target: 'https://x.com/i/api/2/badge_count/badge_count.json',
    },
    {
      referer: 'https://x.com/compose/post',
      target: 'https://x.com/i/api/1.1/graphql/error_log.json',
    }
  ];
  //各セッション内でユーザーエージェントを一般的なブラウザに戻す
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/142.0.0.0 Safari/537.36';
    callback({ requestHeaders: details.requestHeaders });
  });
  //ポストカラムでは通知取得やエラーログの収集をブロックする
  session.webRequest.onBeforeRequest((details, callback) => {
    const ref = details.referrer || '';
    const url = details.url;

    const is_blocked = block_rules.some((r) => ref.startsWith(r.referer) && url.includes(r.target));

    if (is_blocked) {
      return callback({ cancel: true });
    }
    callback({});
  });
});
//セッションマネージャー関連処理
ipcMain.handle('OPD_SessionManager_GetStore', (event, data) => {
  debug_stdout(data);
  const session_store_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, {encoding:'utf-8'});
  return JSON.parse(session_store_json);
})
ipcMain.handle('OPD_SessionManager_AddStore', (event, data) => {
  debug_stdout(data)
  const session_store_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, {encoding:'utf-8'});
  const session_store_obj = JSON.parse(session_store_json);
  debug_stdout(data.add_data.provider)
  debug_stdout(session_store_obj[data.add_data.provider])
  if(session_store_obj[data.add_data.provider] != undefined){
    let exis_session_name = null;
    session_store_obj[data.add_data.provider].forEach((obj)=>{
      debug_stdout(obj)
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
ipcMain.handle('OPD_SessionManager_DeleteStore', async function(event, data){
  debug_stdout(data)
  const session_store_json = fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, {encoding:'utf-8'});
  const session_store_obj = JSON.parse(session_store_json);
  if(session_store_obj[data.add_data.provider] != undefined){
    const write_data = [];
    for(const obj of session_store_obj[data.add_data.provider]){
      if(obj.session_name != data.add_data.session_name){
        write_data.push(obj)
      }else{
        debug_stdout("found!")
        const partition_dir = `${app.getPath('userData').replaceAll("\\", "/")}/Partitions/${obj.system_session_id}/`;
        const opd_settings = JSON.parse(fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_settings.json`, {encoding:'utf-8'}));
        const opd_profile = JSON.parse(fs.readFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_profile.json`, {encoding:'utf-8'}));
        //セッションオープンチェック
        let open_session_flag = false;
        for(const profile of opd_profile[opd_settings["opd_settings"]["last_load_profile"]]["profile"]){
          if(profile.account_session_name == data.add_data.session_name){
            open_session_flag = true;
          }
        }
        debug_stdout(open_session_flag)
        if(!open_session_flag){
          if(fs.existsSync(partition_dir)){
            debug_stdout("partiton_delete");
            try {
              fs.rmSync(partition_dir, {recursive: true, force: true});
            } catch (error) {
              debug_stdout(error.errno)
              if(error.errno == -4048){
                return {status:"SysOpen"};
              }else{
                return {status:"SysErr"};
              }
            }
          }
        }else{
          return {status:"OpenProfile"};
        }
      }
    }
    session_store_obj[data.add_data.provider] = write_data;
    fs.writeFileSync(`${app.getPath('userData').replaceAll("\\", "/")}/opd_session.json`, JSON.stringify(session_store_obj));
    return {status:"Complete"};
  }else{
    return {status:"NotFoundProvider"};
  }
})
//ストアデータ関連処理
ipcMain.handle('OPD_GetStoreItem', async function(e, data){
  debug_stdout(data)
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
  debug_stdout(data)
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
ipcMain.handle('OPD_StoreReset', function(e, data){
  debug_stdout("RESTART")
  debug_stdout(data)
  switch(data.message){
    case 'system_settings':
      system_settings_store_init('reset');
      app.relaunch();
      app.exit(0);
      break;
    case 'profile':
      settings_store_init('reset');
      profile_store_init('reset');
      app.relaunch();
      app.exit(0);
      break;
    default:
      return false;
}
  return true;
})
//ヘルパースクリプト
ipcMain.handle('OPD_Columun_HelperScripts', async function(e, data){
  debug_stdout(data)
  switch(data.message){
    case 'get_auto_reload':
      const read_auto_reload_script = fs.readFileSync(`${app.getAppPath().replaceAll("\\", "/")}/opd_resource/extensions/auto_reload_helper.js`, {encoding:'utf-8'});
      return read_auto_reload_script;
    case 'get_post_column_text_review':
      const read_post_text_review_script = fs.readFileSync(`${app.getAppPath().replaceAll("\\", "/")}/opd_resource/extensions/text_review_helper.js`, {encoding:'utf-8'});
      return read_post_text_review_script;
    case 'get_media_viewer_blocker':
      const read_media_viewer_blocker_script = fs.readFileSync(`${app.getAppPath().replaceAll("\\", "/")}/opd_resource/extensions/media_viewer_block_helper.js`, {encoding:'utf-8'});
      return read_media_viewer_blocker_script;
  }
})
//テキスト校正
ipcMain.handle('start_text_review', function(e, data){
  debug_stdout(e.senderFrame)
  const result = (async () => {
    const api_url = "https://opd.kwdev-sys.com/api/opd/text_review/review";

    try{
      const res = await fetch(api_url, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Origin": "chrome-extension://gmkadaeibmhchpimnfplodelecmogdic"},
        body: JSON.stringify({"text":data.text}),
      });

      if(!res.ok){
        return false;
      }
      const result = res.json();
      return await result;
    }catch(error){
      return false;
    }
  })();
  return result;
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
  if(!debug_mode_flag){
    system_settings_window.setMenuBarVisibility(false);
  }
  //system_settings_window.setAlwaysOnTop(true, "screen-saver");
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
    width: 900,
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
  if(!debug_mode_flag){
    session_manager_window.setMenuBarVisibility(false);
  }
  //session_manager_window.setAlwaysOnTop(true, "screen-saver");
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
  if(!debug_mode_flag){
    about_opd_window.setMenuBarVisibility(false);
  }
  //about_opd_window.setAlwaysOnTop(true, "screen-saver");
  about_opd_window.loadURL(`file://${app.getAppPath()}/opd_resource/about_opd.html`);
  about_opd_window.addListener("close", function(){
    is_open_about_opd_window = false;
  })
}
//メディアビューワーオープン
ipcMain.on('open_media_viewer', function(e, media_info, media_index){
  opd_main_window.webContents.send('OPD_open_media_viewer_dialog', media_info, media_index);
  return true;
})
ipcMain.on('open_about_opd', function(e, data){
  if(!is_open_about_opd_window){
    is_open_about_opd_window = true;
    about_opd_createWindow();
  }else{
    about_opd_window.focus();
  }
  return true;
})
//カスタムダイアログ
ipcMain.handle('open_custom_dialog', async function(e, data){
  const open_dialog = await dialog.showMessageBox({
    type: 'info',
    message: data.title,
    detail: data.detail,
    buttons: ["OK", "キャンセル"],
    defaultId: 0,
    noLink: true
  })
  if(open_dialog.response == 0){
    debug_stdout(open_dialog)
    return true;
  }else{
    return false;
  }
})
//外部URLオープン
ipcMain.on('open_default_browser', function(e, data){
  debug_stdout(data)
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