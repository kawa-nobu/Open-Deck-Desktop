// メディアビューワー停止用
class OpdMediaViewerBlocker {
    constructor() {
        this.opd_send_media_info_token = null;
        this.Init = async (column_webview) => {
            //ヘルパースクリプト追加
            column_webview.executeJavaScript(await opd_system.media_viwer_blocker_script());
        }
    }
}