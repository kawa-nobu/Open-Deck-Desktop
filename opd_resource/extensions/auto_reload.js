// 自動更新機能で使用
class OpdExtAutoReload {
    constructor() {
        this.opd_reload_token = null;
        this.Init = async (column_webview) => {
            //ヘルパースクリプト追加
            column_webview.executeJavaScript(await opd_system.post_column_helper_script())

            this.opd_reload_token = crypto.randomUUID();
            setTimeout(() => {
                column_webview.executeJavaScript(`
                    window.dispatchEvent(new CustomEvent('opd_column_reload_init', {
                        detail: JSON.stringify(${JSON.stringify({ token:this.opd_reload_token })})
                    }));
                    console.log("executeOK")
                `);
            }, 10);
        }
        this.Reload = (column_webview)=>{
            if (!this.opd_reload_token) return false;
            column_webview.executeJavaScript(`
                window.dispatchEvent(new CustomEvent('opd_column_reload', {
                    bubbles: true,
                    composed: true,
                    detail: JSON.stringify(${JSON.stringify({ token:this.opd_reload_token })})
                }));
                `);
        }
    }
}
