// 文章校正機能で使用
(() => {
    class OpdExtTextReviewHelper {
        constructor() {
            this.Init = (column_webview) => {
                //初期化
                let editable_elem = null;
                let is_textarea_empty = true;
                let review_state = false;

                document.addEventListener("focusin", (ev) => {
                    //テキストエリアフォーカスタイミングで文字有無のカウンタを仕込む
                    if (ev.target && ev.target.isContentEditable) {
                        editable_elem = ev.target;
                        if(!editable_elem.getAttribute("opd_text_counter")){
                            //input イベントでは半角文字の削除が取得できないため、MutationObserver を使う
                            const editor_observer = new MutationObserver((mutations, obs) => {
                                is_textarea_empty = editable_elem.innerText.trim() === '';
                                if(is_textarea_empty){
                                    document.getElementById("opd_post_text_review").setAttribute("opd_text_review_is_empty", "");
                                }else{
                                    document.getElementById("opd_post_text_review").removeAttribute("opd_text_review_is_empty");
                                }
                            }).observe(editable_elem, {
                                childList: true,
                                subtree: true
                            });
                            editable_elem.setAttribute("opd_text_counter", "true");
                        }
                    }else{
                        editable_elem = null;
                    }
                });
                const observer = new MutationObserver((mutations, obs) => {
                    //文章校正ボタンを仕込む
                    //既存のボタン類のパネルに組み込むと、他のボタンが表示されなくなる現象があるので仕方なく文字数カウンタの下に配置している
                    const btnAddTarget = document.querySelector('div[data-testid="toolBar"]');
                    const function_panel = document.querySelector('div.opd_post_functions');
                    if (btnAddTarget && !function_panel) {
                        //テーマカラー取得&ボタンカラー設定
                        const theme_color = this.CssChecker(getComputedStyle(document.querySelector('div[data-testid="progressBar-bar"]')).backgroundColor);
                        document.head.insertAdjacentHTML("beforeend", `<style opd_post_textreview_theme_css>.opd_text_review_btn_icon{background-color:${theme_color};}.opd_text_review_btn:not([opd_text_review_is_empty]):hover{border-radius: 100px;transition-duration: 0.2s;background-color:${theme_color.replace(")", ", 0.1)")};}.opd_text_review_panel{background-color:${theme_color.replace(")", ", 0.1)")};}</style>`);
                        //校正ボタンパネル追加
                        //TODO:今後、他機能追加する際は opd_post_functions 追加処理を別の場所で1回のみ行う実装をする
                        btnAddTarget.insertAdjacentHTML('afterend', '<div class="opd_post_functions"><div id="opd_post_text_review" class="opd_text_review_btn" title="文章校正ができます(校正ログを一切保存しません)" opd_text_review_is_empty><div class="opd_text_review_btn_icon"></div></div></div><div class="opd_text_review_panel"></div>');
                        //校正ボタン動作追加
                        document.getElementById("opd_post_text_review").addEventListener("click", async ()=>{
                            if(!review_state && editable_elem && !is_textarea_empty){
                                review_state = true;
                                const review_panel = document.querySelector('div.opd_text_review_panel');
                                review_panel.textContent = "";
                                review_panel.insertAdjacentHTML("beforeend", `<div>文章校正 (試作版)</div><div><div class="opd_text_review_loader"></div>校正中...</div>`);
                                await this.Review(editable_elem.innerText.trim(), review_panel, column_webview);
                                review_state = false;
                            }
                        });
                    }
                }).observe(document, {
                    childList: true,
                    subtree: true
                });
            }
            this.Review = async(text, panel_elem, column_webview) => {
                //校正開始
                const review_request = await this.ReviewRquest(text);

                //校正に失敗したら終了
                if(!review_request){
                    panel_elem.textContent = "";
                    panel_elem.insertAdjacentHTML("beforeend", `<div>文章校正 (試作版)</div><div>校正に失敗しました</div>`);
                    return;
                }
                //校正パネルを空にする
                panel_elem.textContent = "";

                //指摘箇所がなければ終了
                if(review_request.indications.length === 0){
                    panel_elem.insertAdjacentHTML("beforeend", `<div>文章校正 (試作版)</div><div>指摘箇所はありません</div>`);
                    return;
                }
                //校正結果がある場合
                let result = [];
                let indication_id = [];
                const indications_fix_enabled = [];
                let indication_fix_str = text;

                //indicationsの分だけ校正パネルへ指摘リストを表示
                review_request.indications.forEach((review) => {
                    const id = this.CreateRandomID();
                    let suggest_elem = "";
                    if(review.params?.suggests != null){
                        suggest_elem = `<span style="background:#14ff0063;">${this.EscapeHTML(review.params?.suggests?.at(-1))}</span>`;
                    }
                    result.push(`<div class="opd_text_review_indication_switch"><input id="opd_text_review_iid_${id}" type="checkbox" opd_indication_id="${id}"><div><span style="font-size: 0.8em;">(${this.EscapeHTML(review.message)})</span><div><span style="text-decoration: line-through;background:#ff000054;">${this.EscapeHTML(review.relevant_part.problem)}</span>${suggest_elem}${this.EscapeHTML(review.relevant_part.after)}</div></div></div>`);
                    indication_id.push(id);
                    indications_fix_enabled.push(false);
                });
                //校正パネルへ全文指摘を表示
                const review_view = this.IndicationTexts(text, review_request.indications, indication_id);
                panel_elem.insertAdjacentHTML("beforeend", `<div>文章校正 (試作版)</div><div class="opd_text_review_result"><div class="opd_text_review_result_preview">${review_view}</div><div class="opd_text_review_indication_switcher">${result.join("")}</div><div class="opd_text_review_indication_apply_panel"><button id="opd_text_review_apply_selected">適用</button><button id="opd_text_review_apply_all">すべて適用</button></div></div>`);

                indication_id.forEach((id, i)=>{
                    panel_elem.querySelector(`#opd_text_review_iid_${id}`).addEventListener("change", (ev)=>{
                        const indcation_target = panel_elem.querySelector(`#opd_text_review_problem_id_${id}`)
                        indcation_target.scrollIntoView({behavior: "smooth",inline: "end"});
                        if(ev.target.checked){
                            indcation_target.setAttribute("opd_text_review_indication_hidden", "");
                            indications_fix_enabled[i] = true;
                        }else{
                            indcation_target.removeAttribute("opd_text_review_indication_hidden");
                            indications_fix_enabled[i] = false;
                        }
                        indication_fix_str = this.GetReviewedText(text, review_request.indications, indications_fix_enabled);
                    });
                });

                //指摘適用ボタンの動作を追加
                panel_elem.querySelector(`#opd_text_review_apply_selected`).addEventListener("click", (ev)=>{
                    document.dispatchEvent(new CustomEvent('opd_text_review_apply', {
                        bubbles: true,
                        composed: true,
                        detail: JSON.stringify({ text: indication_fix_str, is_firefox: false })
                    }));
                });
                panel_elem.querySelector(`#opd_text_review_apply_all`).addEventListener("click", (ev)=>{
                    indication_id.forEach((id)=>{
                        const target = panel_elem.querySelector(`#opd_text_review_iid_${id}`);
                        if(!target.checked){
                            panel_elem.querySelector(`#opd_text_review_iid_${id}`).click();
                        }
                    });
                    document.dispatchEvent(new CustomEvent('opd_text_review_apply', {
                        bubbles: true,
                        composed: true,
                        detail: JSON.stringify({ text: indication_fix_str, is_firefox: false })
                    }));
                });
            }
            this.IndicationTexts = (text, result, indication_ids) =>{
                //全文指摘表示機能用のHTML生成関数
                if (!result?.length) return this.EscapeHTML(text);

                //offsetの昇順で処理
                const sorted = [...result].sort((a, b) => a.offset - b.offset);

                let cur = 0;
                let html = "";

                for (const [i, ind] of sorted.entries()) {
                    const { offset, length, params } = ind;
                    const start = offset;
                    const end = start + length;
                    const suggest = params?.suggests?.at(-1) ?? "";

                    //範囲チェック
                    if (start < cur || start > text.length) continue;
                    if (end > text.length) continue;

                    html += this.EscapeHTML(text.slice(cur, start));

                    let suggest_elem = "";
                    if(suggest !== ""){
                        suggest_elem = `<span style="padding:3px;border-radius:3px;background:#14ff0063;">${this.EscapeHTML(suggest)}</span>`;
                    }

                    html += `<span class="patch" data-offset="${start}" data-length="${length}"><span id="opd_text_review_problem_id_${indication_ids[i]}" style="padding:3px;border-radius:3px;text-decoration: line-through;background:#ff000054;">${this.EscapeHTML(text.slice(start, end))}</span>${suggest_elem}</span>`;

                    cur = end;
                }

                html += this.EscapeHTML(text.slice(cur));

                return html;
            }
            this.GetReviewedText = (text, result, indication_enabled) =>{
                //指摘適用済みのテキストを生成生成する関数
                if (!result?.length) return text;

                //offsetの昇順で処理
                const sorted = [...result].sort((a, b) => a.offset - b.offset);

                let cur = 0;
                let output = "";

                for (const [i, ind] of sorted.entries()) {
                    const { offset, length, params } = ind;
                    const start = offset;
                    const end = start + length;
                    const suggest = params?.suggests?.at(-1) ?? "";
                    const problem = text.slice(start, end);

                    //範囲チェック
                    if (start < cur || start > text.length) continue;
                    if (end > text.length) continue;

                    //前の修正部分の後から今回の修正部分の前までを追加
                    output += text.slice(cur, start);

                    if (indication_enabled[i]) {
                        output += String(suggest);
                    } else {
                        output += String(problem);
                    }

                    cur = end;
                }

                output += text.slice(cur);

                return output;
            }
            this.ReviewRquest = async(str)=>{
                //校正を開始し、結果を得る関数
                const review_result = opd_system.text_review(str);

                if(review_result){
                    return review_result;
                }else{
                    return false;
                }
            }
            this.CreateRandomID = () =>{
                //ランダムなIDを生成する関数
                return Math.random().toString(32).substring(2);
            }
            this.CssChecker = (str) =>{
                //CSSが正常かどうかチェックする関数
                return CSS.supports('color', str) ? str : 'black'
            }
            this.EscapeHTML = (str) =>{
                //文字列をエスケープ化する関数
                if (str == null) return '';
                return String(str)
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            }
        }
    }

    const ext_text_review = new OpdExtTextReviewHelper();
    ext_text_review.Init();

    const isAllowed = (u) => {
        const url = new URL(u, location.href);
        return url.origin === location.origin && url.pathname.startsWith("/compose/post");
    };
    new MutationObserver(function(){
        const back_button = document.querySelector('main button[data-testid="app-bar-back"]');
        if(!back_button) return;
        if(location.pathname === "/compose/post"){
            back_button.style.display = "none";
        }else{
            back_button.style.display = "block";
        }
    }).observe(document, {childList: true, subtree: true});
    
    (function() {
        //投稿後の遷移メッセージを無効化する
        const native_add_evt = EventTarget.prototype.addEventListener;
        native_add_evt.call(window, 'beforeunload', function (e){
            // 既存イベントをストップさせる
            e.stopImmediatePropagation();
        }, {capture: true});
        
        //以後追加されるイベントを阻止する
        EventTarget.prototype.addEventListener = function (type, listener, options){
            if(String(type).toLowerCase() === 'beforeunload'){
                return;
            }
            return native_add_evt.call(this, type, listener, options);
        };
        
        //投稿後は home に戻ってほしくないので遷移を阻止する
        const originalPushState = history.pushState;
        history.pushState = function(state, title, url) {
            const dest = url ? new URL(url, location.href).href : location.href;
            if (!isAllowed(dest)){
                //home への遷移を阻止
                location.replace(location.href);
                return;
            }
            return originalPushState.apply(this, arguments);
        };
    })();

    //校正周りの処理
    let target_editor_elem = null;
    let opd_paste_token = null;
    document.addEventListener("focusin", (ev) => {
        if(ev.target && ev.target.isContentEditable){
            target_editor_elem = ev.target;
        }
    });
    const handler = async(e) => {
        //Firefox では detail にオブジェクトを乗せられない様なので、JSON化している
        const detail = JSON.parse(e.detail);
        //貼り付け時のトークンをチェックする
        if(opd_paste_token && opd_paste_token !== detail.token) return;

        //X側のテキストエディタの内部関数を利用してテキストを正しく入力させる
        if(target_editor_elem && target_editor_elem.isContentEditable){
            //文字を全て選択する
            text_all_select(target_editor_elem);
            //選択が終わるまで待機
            await new Promise(resolve => setTimeout(resolve, 30));

            //Firefox では　DataTransfer や ClipboardEvent 使えないので動作を分ける
            if (!detail.is_firefox) {
                //ReactPropsを入手する
                const propsKey = Object.getOwnPropertyNames(target_editor_elem).find(k => k.includes('__reactProps$'));
                const props = propsKey ? target_editor_elem[propsKey] : null;
                const editor = props?.children?.props?.editor ??props?.children?.[0]?.props?.editor ?? null;
                
                //校正結果のテキストの DataTransfer を作成
                const dt = new DataTransfer();
                dt.setData('text/plain', detail.text);

                //クリップボードのペーストのイベントを作成する
                const evt = new ClipboardEvent('paste', {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: dt
                });
                //内部関数を使って校正文章を擬似的にペーストさせる
                editor?._onPaste(evt, editor);
            }else{
                //execCommand は非推奨だが、Firefox では仕方なく使う様にする
                //文字を置換する
                document.execCommand('insertText', false, detail.text);
            }
        }
    };

    async function text_all_select(target){
        //テキスト全選択させる関数
        if(!target && !target.isContentEditable) return false;

        const win = target.ownerDocument.defaultView;
        const doc = target.ownerDocument;

        target.focus();
        const sel = win.getSelection();
        sel.removeAllRanges();

        const range = doc.createRange();
        range.selectNodeContents(target);
        sel.addRange(range);

        return true;
    }

    //テキスト貼り付けの認証トークン受付イベントを作成する
    window.addEventListener('opd_text_review_init', (e)=>{
        const detail = JSON.parse(e.detail);
        opd_paste_token = detail.token;
    }, true);

    //テキストを貼り付けさせるイベントを作成する
    window.addEventListener('opd_text_review_apply', handler, true);
})();