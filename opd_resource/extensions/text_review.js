// 文章校正機能で使用
class OpdExtTextReview {
    constructor() {
        this.Init = async (column_webview, icon, hashtag_restore_icon) => {
            //初期化
            const review_icon = await icon;
            const hashtag_icon = await hashtag_restore_icon;
            column_webview.insertCSS(`
                /* Premium 勧誘要素非表示 */
                div[aria-live="polite"][role="status"]:has(a[dir="ltr"]){
                    display: none;
                }
                [opd_hide]{
                    display: none !important;
                }
                .opd_post_functions{
                    display: flex;
                    flex-direction: row;
                    margin-left: -8px;
                }
                .opd_text_review_loader {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #ddd;
                    border-top-color: #3498db;
                    border-radius: 50%;
                    animation: opd_text_review_loader_spin 1s linear infinite;
                    margin: 20px auto;
                }

                @keyframes opd_text_review_loader_spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                .opd_function_btn{
                    width:34px;
                    height:34px;
                    margin:0 4px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer; 
                }
                .opd_text_review_btn_icon{
                    display: block;
                    mask: url(${review_icon}) no-repeat center;
                    width: 18px;
                    height: 18px;
                }
                .opd_hashtag_restore_btn_icon{
                    display: block;
                    mask: url(${hashtag_icon}) no-repeat center;
                    width: 18px;
                    height: 18px;
                }
                .opd_function_btn[disabled]{
                opacity: 0.5;
                }
                .opd_text_review_panel{
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    border-radius: 5px;
                }
                .opd_text_review_panel, .opd_text_review_result{
                    width: 100%;
                }
                .opd_text_review_result_preview{
                    white-space: pre-wrap;
                    padding: 5px;
                    max-height: 10rem;
                    overflow: hidden auto;
                    scrollbar-width: thin;
                    background: #c9c9c940;
                }
                .opd_text_review_indication_switcher{
                    max-height: 8rem;
                    overflow: hidden auto;
                    scrollbar-width: thin;
                    padding:5px;
                }
                .opd_text_review_indication_switch{
                    display: flex;
                    flex-direction: row;
                    padding: 5px;
                    border-radius: 5px;
                    margin: 5px;
                    background: #00000012;
                    scrollbar-width: thin;
                }
                span[opd_text_review_indication_hidden]{
                    display: none;
                }
                .opd_text_review_indication_apply_panel{
                    display: flex;
                    flex-direction: row;
                    justify-content: space-evenly;
                }
                .opd_text_review_indication_apply_panel button{
                    border-radius: 100px;
                    width: 5rem;
                    display: flex;
                    justify-content: center;
                    border: #0000005e 1px solid;
                    margin: 2px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    
                }
                .opd_text_review_indication_apply_panel button:hover{
                    opacity: 0.8;
                }
                /* 文章校正パネルなどの位置を含めて整える */
                [data-modal-slot-surface]:has([data-media-upload-dropzone]){
                    scrollbar-gutter: stable both-edges;
                }
                div[data-media-upload-dropzone] > .opd_post_functions{
                    margin-left: 1px;
                }
            `);
            //GIF ボタンを消す
            column_webview.insertCSS(`div[data-media-upload-dropzone] form button:has(svg[data-icon*="icon-gif"]), main button[data-testid="gifSearchButton"], div[role="group"] button[data-testid="app-bar-close"]{display:none;}div[data-testid="twc-cc-mask"]{display:none;}`);
            //ヘルパースクリプト追加
            column_webview.executeJavaScript(await opd_system.post_column_helper_script());
        }
    }
}