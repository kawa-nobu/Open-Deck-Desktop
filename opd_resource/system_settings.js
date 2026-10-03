window.addEventListener("load", async function(){
    const get_settings_data = await opd_system.opd_get_data_store("opd_system_settings");
    const settings_data_obj = JSON.parse( get_settings_data);
    Object.keys(settings_data_obj).forEach((key)=>{
        switch(key){
            case 'color_mode':
                document.getElementById('opd_color_mode').value = settings_data_obj[key];
                break;
            case 'scrollbar_thin_mode':
                document.getElementById('opd_scrollbar_type').checked = settings_data_obj[key];
                break;
            case 'contents_hide_promotion':
                document.getElementById('opd_hide_promotion').checked = settings_data_obj[key];
                break;
            case 'bypass_url_open_msg':
                document.getElementById('opd_msg_bypass_url_open_msg').checked = settings_data_obj[key];
                break;
            case 'window_close_to_minimize':
                document.getElementById('opd_close_btn_mini').checked = settings_data_obj[key];
                break;
            case 'check_update':
                document.getElementById('opd_check_update').checked = settings_data_obj[key];
                break;
            case 'user_custom_css_twitter':
                document.getElementById('opd_custom_css_twitter').value = settings_data_obj[key];
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
    document.getElementById('opd_msg_bypass_url_open_msg').addEventListener("change", async function(){
        opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"bypass_url_open_msg", value:this.checked}])
    });
    document.getElementById('opd_check_update').addEventListener("change", async function(){
        opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"check_update", value:this.checked}])
    });
    document.getElementById('opd_custom_css_twitter_apply').addEventListener("click", async function(){
        const input_css = document.getElementById('opd_custom_css_twitter').value;
        const { css, removedRules } = sanitizeCss(input_css);
        await opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"user_custom_css_twitter", value:input_css}]);
        await opd_system.opd_set_data_store('opd_system_settings', [{setting_name:"user_custom_css_twitter_sanitized", value:css}]);
        if(removedRules.length > 0){
            opd_system.opd_custom_dialog('カスタムCSS', `カスタムCSSを設定しました。\r\n次回Open-Deckの起動時から適用されます。\r\n\r\n安全でない記述を含むため、次のルールは適用されません:\r\n\r\n${removedRules.join("\r\n\r\n")}`);
        }else{
            opd_system.opd_custom_dialog('カスタムCSS', "カスタムCSSを設定しました。\r\n次回Open-Deckの起動時から適用されます。");
        }
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

document.addEventListener('click', (event) => {
    const target = event.target.closest('a');
    const misskey_img_link_filter = target?.querySelector("canvas[title]") == undefined;
    if(target && target.href && misskey_img_link_filter){
        event.preventDefault();
        if(location.host != new URL(target.href).host){
            opd_system.open_default_browser(target.href);
        }
    }
});

/* CSSサニタイズ処理 */

//url()や文字列として許可するdataURL(画像とフォントのみ)
const ALLOWED_DATA_URL =
  /^data:\s*(?:image\/(?:png|jpeg|gif|webp|avif)|font\/(?:woff2?|ttf|otf))\s*[;,]/;

//CSSのエスケープ表記(\75や\(など)を元の文字に戻す
function decodeCssEscapes(cssText) {
  const escapePattern = /\\([0-9a-f]{1,6})\s?|\\([\s\S])/gi;

  return cssText.replace(
    escapePattern,
    (escapeSequence, hexCode, escapedCharacter) => {
      //\75のような16進数のエスケープは、文字コードから文字に戻す
      if (hexCode) {
        //Unicodeの最大値を超える文字コードは最大値に丸める
        const codePoint = Math.min(parseInt(hexCode, 16), 0x10ffff);
        return String.fromCodePoint(codePoint);
      }

      //それ以外のエスケープは、後ろの文字をそのまま使う
      return escapedCharacter;
    },
  );
}

//ルールに危険な記述(外部URLの読み込みなど)が含まれているか判定する
function isDangerous(cssText) {
  //エスケープ表記で危険な記述を隠せないよう、展開してから判定する
  const decodedText = decodeCssEscapes(cssText).toLowerCase();

  //url()の中身が許可されたdataURL以外なら危険
  const urlFunctionPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))/g;

  for (const match of decodedText.matchAll(urlFunctionPattern)) {
    //ダブルクォート・シングルクォート・クォート無しのいずれかの中身
    const urlValue = match[1] ?? match[2] ?? match[3];

    if (!ALLOWED_DATA_URL.test(urlValue)) {
      return true;
    }
  }

  //文字列でURLを受け取れる関数が無ければ安全とみなす(image-rectはFirefoxの-moz-image-rect)
  const urlStringFunctionPattern =
    /(?:src|image|image-set|image-rect|cross-fade)\(/;
  const hasUrlStringFunction = urlStringFunctionPattern.test(decodedText);

  if (!hasUrlStringFunction) {
    return false;
  }

  //var()で別ルールからURL文字列を差し込めるため、併用は危険とみなす
  const hasCssVariable = /var\(/.test(decodedText);

  if (hasCssVariable) {
    return true;
  }

  //文字列の中身が許可されたdataURL以外なら危険
  const stringPattern = /"([^"]*)"|'([^']*)'/g;

  for (const match of decodedText.matchAll(stringPattern)) {
    //ダブルクォート・シングルクォートのいずれかの中身
    const stringValue = match[1] ?? match[2];

    if (!ALLOWED_DATA_URL.test(stringValue)) {
      return true;
    }
  }

  return false;
}

//スタイルシート(または@mediaなどのグループルール)から危険なルールを削除する
function removeDangerousRules(container, removedRules) {
  //削除で添字がずれないよう後ろから走査する
  for (let index = container.cssRules.length - 1; index >= 0; index--) {
    const rule = container.cssRules[index];

    //@mediaなどの入れ子のルールは、中身を先に判定する
    //(@keyframesは中身だけ消せないため、丸ごと判定する)
    const hasChildRules = Boolean(rule.cssRules);
    const isKeyframesRule = rule instanceof CSSKeyframesRule;

    if (hasChildRules && !isKeyframesRule) {
      removeDangerousRules(rule, removedRules);
    }

    if (isDangerous(rule.cssText)) {
      removedRules.push(rule.cssText);
      container.deleteRule(index);
    }
  }
}

//カスタムCSSをサニタイズし、サニタイズ後のCSSと除去したルールの一覧を返す
function sanitizeCss(inputCss) {
  //ブラウザのCSSパーサーで解析する(@importはここで捨てられる)
  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(inputCss);

  const removedRules = [];
  removeDangerousRules(styleSheet, removedRules);

  //残ったルールをCSSテキストに戻す
  const remainingRuleTexts = Array.from(
    styleSheet.cssRules,
    (rule) => rule.cssText,
  );

  //style要素の外に抜け出せないよう<をエスケープする
  const sanitizedCss = remainingRuleTexts.join("\n").replace(/</g, "\\3C ");

  //@importは解析時に捨てられて一覧に残らないため、元のCSSから拾う
  const removedImportRules = inputCss.match(/@import[^;]*;?/gi) ?? [];

  //後ろから集めたので記述順に戻す
  removedRules.reverse();

  return {
    css: sanitizedCss,
    removedRules: [...removedImportRules, ...removedRules],
  };
}
