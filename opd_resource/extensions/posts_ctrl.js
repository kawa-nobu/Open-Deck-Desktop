/* 各ポストの表示制御などを行う */
class OpdPostsController {
    constructor() {
        this.Init = async (column_webview) => {
            //非表示用CSS追加
            column_webview.insertCSS(`div[data-testid="cellInnerDiv"][opd_hide_tweet]{display:none;}`);
            //ヘルパースクリプト追加
            column_webview.executeJavaScript(await opd_system.posts_ctrl_script());
        }
    }
}