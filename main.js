const {app, BrowserWindow, session, protocol, net, nativeTheme, dialog, shell, ipcMain, screen, Menu, clipboard} = require('electron');
const {get_update} = require('./lib/app_update');
const { pathToFileURL } = require('url');
const path = require("path");
const test = require("url")
const fs = require("fs");

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
//アプリケーション UA 設定
app.userAgentFallback = app.userAgentFallback.replace(/\sOpen-Deck\/[^\s]+/g, '').replace(/\sElectron\/[^\s]+/g, '').replace(/\s{2,}/g, ' ').trim();
//初回起動検出関数&ドキュメント閲覧
function is_first_running(check_flag){
  debug_stdout("first_running")
  if(!check_flag){
    dialog.showMessageBox({
      type: 'info',
      message: "ようこそOpen-Deckへ！",
      detail:`使い方の映像や公式マニュアル(ドキュメント)を視聴・確認しますか？(はじめての方は視聴を推奨)\r\nツールバーのOpen-Deckアイコンをクリックし、「Help」下から再度ドキュメントの確認ができます`,
      buttons: ["今すぐ映像を見る", "今すぐマニュアルを見る", "OK"],
      defaultId: 0
    }).then((res)=>{
      if(res.response == 0){
        shell.openExternal(`https://www.youtube.com/watch?v=nQyuR3_-CqM`);
      }
      if(res.response == 1){
        shell.openExternal(`https://kawa-nobu.github.io/Open-Deck-Wiki/`);
      }
    });
  }
}
//警告付きURLオープン
function open_external_with_warning(url_string) {
  const url = new URL(url_string);
  
  //メッセージ表示無効化が設定されていたらそのまま開く
  const settings = load_system_settings();
  if (settings.bypass_url_open_msg) {
    shell.openExternal(url.href);
    return;
  };

  
  dialog.showMessageBox({
      type: "warning",
      message: "外部のURLを開こうとしています！",
      detail: `信頼できるURLのみ開く事を推奨します。\r\nURL: ${decodeURIComponent(url.href)}\r\n「開く」押下でウェブサイトへ移動します`,
      buttons: ["開く", "キャンセル"],
      defaultId: 0,
    }).then((res) => {
      if (res.response === 0) {
        shell.openExternal(url.href);
      }
    });
}
//アプリケーションアップデートチェック
async function check_update(){
  const app_update = await get_update();
  if(app_update.is_update){
    dialog.showMessageBox({
      type: 'info',
      message: "新バージョンが公開されています！",
      detail:`最新バージョンにすることで新機能やバグ修正が適用可能です！\r\n最新バージョン: ${app_update.latest_version}`,
      buttons: ["GitHubから入手する", "無視する"],
      defaultId: 0
    }).then((res)=>{
      if(res.response == 0){
        shell.openExternal(`https://github.com/kawa-nobu/Open-Deck-Desktop/releases/`);
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
    last_window_x: null,
    last_window_y: null,
    last_window_maximized: false,
    color_mode:0,
    scrollbar_thin_mode:true,
    contents_hide_promotion:false,
    bypass_url_open_msg:false,
    window_close_to_minimize:false,
    check_update:true,
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
    if(settings.setting_name in settings_obj){
      switch(settings.setting_name){
        case 'last_window_width':
          settings_obj.last_window_width = settings.value;
          break;
        case 'last_window_height':
          settings_obj.last_window_height = settings.value;;
          break;
        case 'last_window_x':
          settings_obj.last_window_x = settings.value;
          break;
        case 'last_window_y':
          settings_obj.last_window_y = settings.value;
          break;
        case 'last_window_maximized':
          settings_obj.last_window_maximized = settings.value;
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
        case 'bypass_url_open_msg':
          settings_obj.bypass_url_open_msg = settings.value;
          break;
        case 'scrollbar_thin_mode':
          settings_obj.scrollbar_thin_mode = settings.value;
          break;
        case 'check_update':
          settings_obj.check_update = settings.value;
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

//webContentsが生成された際の動作
app.on("web-contents-created", (event, contents) => {
  //右クリックの動作を定義
  contents.on("context-menu", (e, params) => {
    const template = [];

    //テキストで右クリックされた場合
    if (params.selectionText) {
      template.push(
        {
          label: "コピー",
          click: () => contents.copy(),
        },
        { type: "separator" },
      );
    }

    //編集可能で右クリックされた場合
    if (params.isEditable) {
      template.push(
        { label: "元に戻す", click: () => contents.undo() },
        { label: "やり直し", click: () => contents.redo() },
        { type: "separator" },
        { label: "切り取り", click: () => contents.cut() },
        { label: "コピー", click: () => contents.copy() },
        { label: "貼り付け", click: () => contents.paste() },
        { label: "すべて選択", click: () => contents.selectAll() },
      );
    }

    //リンクが右クリックされた場合
    if (params.linkURL) {
      template.push(
        {
          label: "リンクをコピー",
          click: () => clipboard.writeText(params.linkURL),
        },
        {
          label: "ブラウザで開く",
          click: () => open_external_with_warning(params.linkURL),
        },
      );
    }

    //画像が右クリックされた場合
    if (params.mediaType === "image") {
      template.push({
        label: "画像URLをコピー",
        click: () => clipboard.writeText(params.srcURL),
      });
    }

    if (template.length === 0) return;

    const win = BrowserWindow.fromWebContents(
      contents.hostWebContents || contents,
    );
    Menu.buildFromTemplate(template).popup({ window: win });
  });
});

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
  const sys_settings_path = system_settings_store_init('nomal');
  const settings_path = settings_store_init('nomal');
  const profile_path = profile_store_init('nomal');
  const session_path = session_store_init('nomal');

  const system_settings = load_system_settings();

  opd_main_window = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth : 720,
    minHeight: 480,
    show: false,
    title: "Open-Deck",
    webPreferences: {
      preload: path.join(app.getAppPath(), './preload.js'),
      additionalArguments: [
        `--opd_resource_path=${path.join(app.getAppPath(), 'opd_resource')}`,
        `--opd_webview_preload_path=${path.join(app.getAppPath(), 'preload_webview.js')}`,
        `--opd_system_settings_path=${sys_settings_path}`,
        `--opd_settings_store_path=${settings_path}`,
        `--opd_profile_store_path=${profile_path}`,
        `--opd_session_store_path=${session_path}`,
        `--opd_version=${app.getVersion()}`
      ],
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag:true,
      backgroundThrottling: false,
    }
  })

  // 保存された位置・サイズを復元
  const window_restore_width = Math.max(system_settings.last_window_width || 1920, 720);
  const window_restore_height = Math.max(system_settings.last_window_height || 1080, 480);

  let window_target_x = null;
  let window_target_y = null;

  // 位置情報がディスプレイ範囲内なら座標も復元対象にする
  if (system_settings.last_window_x !== null && system_settings.last_window_y !== null) {
    const displays = screen.getAllDisplays();

    if (displays.length === 0) {
      debug_stdout('no displays detected!');
    }else{
      const is_in_display = displays.some(display => {
        const { x, y, width, height } = display.bounds;
        return (
          system_settings.last_window_x >= x &&
          system_settings.last_window_x < x + width &&
          system_settings.last_window_y >= y &&
          system_settings.last_window_y < y + height
        );
      });

      if (is_in_display) {
        window_target_x = system_settings.last_window_x;
        window_target_y = system_settings.last_window_y;
      }
    }
  }

  // 復元処理
  if (window_target_x !== null && window_target_y !== null) {
    // 目的のディスプレイに移動させる
    opd_main_window.setPosition(window_target_x, window_target_y);

    // ディスプレイ移動が完了後にサイズを設定し直す
    setImmediate(() => {
      if (opd_main_window && !opd_main_window.isDestroyed()) {
        opd_main_window.setSize(window_restore_width, window_restore_height);
        // 位置も再設定
        opd_main_window.setPosition(window_target_x, window_target_y);
        debug_stdout(`final bounds-> ${JSON.stringify(opd_main_window.getBounds())}`);
        opd_main_window.show();
      }
    });
  } else {
    // 位置情報がない or 範囲外なら、サイズだけ設定して中央配置
    opd_main_window.setSize(window_restore_width, window_restore_height);
    opd_main_window.center();
    opd_main_window.show();
  }
  
  //開発モードの場合、F12でDevToolsを開くようにする
  if(debug_mode_flag){
    opd_main_window.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        event.preventDefault();
        // メインウィンドウのDevToolsを明示的に開く
        opd_main_window.webContents.toggleDevTools();
      }
    });
  }

  // ウィンドウを表示
  opd_main_window.show();

  // 最大化状態を復元
  if (system_settings.last_window_maximized) {
    opd_main_window.maximize();
  }

  /* ウィンドウ関連設定保存 */
  let save_bounds_timer = null;
  const save_window_bounds = () => {
    if (save_bounds_timer) clearTimeout(save_bounds_timer);
    save_bounds_timer = setTimeout(() => {
      if (!opd_main_window || opd_main_window.isDestroyed()) return;

      const is_maximized = opd_main_window.isMaximized();
      const is_minimized = opd_main_window.isMinimized();
      const is_fullscreen = opd_main_window.isFullScreen();

      const settings_to_save = [
        { setting_name: 'last_window_maximized', value: is_maximized }
      ];

      if (!is_maximized && !is_minimized && !is_fullscreen) {
        // 通常状態のサイズを取得
        const bounds = opd_main_window.getNormalBounds();

        debug_stdout(`save bounds-> ${JSON.stringify(bounds)}`);

        settings_to_save.push(
          { setting_name: 'last_window_width', value: bounds.width },
          { setting_name: 'last_window_height', value: bounds.height },
          { setting_name: 'last_window_x', value: bounds.x },
          { setting_name: 'last_window_y', value: bounds.y }
        );
      }

      system_settings_save(settings_to_save);
      debug_stdout('window bounds saved');
    }, 500);
  };

  // ready-to-show 以降にリスナーを登録
  opd_main_window.once('ready-to-show', () => {
    opd_main_window.on('resize', save_window_bounds);
    opd_main_window.on('move', save_window_bounds);
    opd_main_window.on('maximize', save_window_bounds);
    opd_main_window.on('unmaximize', save_window_bounds);
  });
  
  //初期起動案内
  is_first_running(sys_settings_check_flag);
  debug_stdout(system_settings)
  //カラーモード
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
    opd_main_window.loadURL(`opd://resources/main.html`);
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
  //アセット関連のプロトコルを登録
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'opd',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true
      }
    }
  ]);
  function isPathInside(baseDir, targetPath) {
    //baseDir から見た相対パスを取得し、配下にあるかを判定する
    const relativePath = path.relative(baseDir, targetPath);
    return Boolean(
      relativePath &&
      !relativePath.startsWith('..') &&
      !path.isAbsolute(relativePath)
    );
  }
  app.whenReady().then(async () => {
    //登録したプロトコルに対してアクセスされた際の動作
    protocol.handle('opd', (request) => {
      const { host, pathname } = new URL(request.url);

      //opd://resources/ だけを公開する
      if (host !== 'resources') {
        return new Response('Not Found', { status: 404 });
      }

      if (pathname === '/') {
        return new Response('Not Found', { status: 404 });
      }

      // opd_resource をルートとして扱う
      const baseDir = path.join(app.getAppPath(), 'opd_resource');
      //pathname がフルパス扱いにならないように、先頭の / を除去してから resolve 
      const candidatePath = path.resolve(baseDir, pathname.replace(/^\/+/, ''));

      //パス文字列ベースで、baseDir 配下に収まっているか確認する
      if (!isPathInside(baseDir, candidatePath)) {
        return new Response('Bad Request', {
          status: 400,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }

      let finalPath = candidatePath;

      //念のため、realpath ベースでも確認する
      try {
        const realBaseDir = fs.realpathSync(baseDir);
        const realCandidatePath = fs.realpathSync(candidatePath);

        //realpath で解決した後も baseDir 配下にあることを確認する
        if (!isPathInside(realBaseDir, realCandidatePath)) {
          return new Response('Bad Request', {
            status: 400,
            headers: { 'content-type': 'text/plain; charset=utf-8' },
          });
        }

        finalPath = realCandidatePath;
      } catch {
        //realpath を解決できない場合は 404 を返す
        return new Response('Not Found', { status: 404 });
      }

      try {
        //最終的なパスが通常のファイルかどうかを確認
        const stat = fs.statSync(finalPath);
        if (!stat.isFile()) {
          return new Response('Not Found', { status: 404 });
        }
      } catch {
        return new Response('Not Found', { status: 404 });
      }

      //ファイルを返す
      return net.fetch(pathToFileURL(finalPath).toString());
    });
    
    //ウィンドウを作成する
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length == 0){
        createWindow();
      }
    });
    app.on('window-all-closed', () => {
      app.quit();
    });

    //アップデートをチェックする
    const settings = load_system_settings();
    if(settings.check_update){
      await check_update();
    }
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

  //不要なパーミッションを無効化してメモリを削減したい
  const denied_permissions = [
    'media', 'camera', 'microphone', 'display-capture',
    'geolocation', 'midi', 'midiSysex',
    'hid', 'serial', 'usb', 'bluetooth',
    'idle-detection', 'background-sync', 'window-management',
  ];
  session.setPermissionRequestHandler((webcontents, permission, callback) => {
    if (denied_permissions.includes(permission)) {
      debug_stdout(`Permission denied (session created)-> ${permission}`);
      return callback(false);
    }
    callback(true);
  });

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
    case 'get_posts_controller':
      const read_posts_controller_script = fs.readFileSync(`${app.getAppPath().replaceAll("\\", "/")}/opd_resource/extensions/posts_ctrl_helper.js`, {encoding:'utf-8'});
      return read_posts_controller_script;
  }
})
//表示ポスト設定返却
ipcMain.handle('get_column_posts_settings', function(e, data){
  debug_stdout(e.senderFrame)
  const system_setting = load_system_settings();
  let settings = null;
  switch (data.type) {
    case "twitter":
      settings = {
        is_hide_promotion: system_setting.contents_hide_promotion,
      }
      break;
  }
  return settings;
});
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
    parent: opd_main_window,
    resizable: true,
    minimizable: false,
    maximizable: false,
    title: "Open-Deckシステム設定",
    webPreferences: {
      preload: path.join(app.getAppPath(), './preload_system_settings.js'),
      additionalArguments: [
        `--opd_resource_path=${path.join(app.getAppPath(), 'opd_resource')}`,
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
  system_settings_window.loadURL(`opd://resources/system_settings.html`);
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
    parent: opd_main_window,
    resizable: true,
    minimizable: false,
    maximizable: false,
    title: "Open-Deckアカウントセッションマネージャー",
    webPreferences: {
      preload: path.join(app.getAppPath(), './preload_session_manager.js'),
      additionalArguments: [
        `--opd_resource_path=${path.join(app.getAppPath(), 'opd_resource')}`,
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
  session_manager_window.loadURL(`opd://resources/session_manager.html`);
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
    parent: opd_main_window,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: "Open-Deckについて",
    webPreferences: {
      preload: path.join(app.getAppPath(), './about_opd_preload.js'),
      additionalArguments: [
        `--opd_resource_path=${path.join(app.getAppPath(), 'opd_resource')}`,
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
  about_opd_window.loadURL(`opd://resources/about_opd.html`);
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
  open_external_with_warning(data);
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