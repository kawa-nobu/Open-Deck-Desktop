(() => {
    class OpdExtTextReviewHelper {
        constructor() {
            this.Init = (column_webview) => {
                //初期化
                let last_editor = null;
                let editable_elem = null;
                let is_textarea_empty = true;
                let review_state = false;

                //機能のボタン類を束ねる
                const function_btns = [
                    //文章校正機能
                    `<div id="opd_post_text_review" class="opd_function_btn" title="文章校正ができます(校正ログを一切保存しません)" disabled><div class="opd_functions_btn_icon_color opd_text_review_btn_icon"></div></div>`,
                    //ハッシュタグ埋め込み機能
                    `<div id="opd_hashtag_restore" class="opd_function_btn" title="ハッシュタグ埋め込み (試作版)&#13;&#10;Altキーを押しながらクリックでタグの記録を削除します" disabled><div class="opd_functions_btn_icon_color opd_hashtag_restore_btn_icon"></div></div>`,
                ]

                document.addEventListener("focusin", (ev) => {
                    //テキストエリアフォーカスタイミングで文字有無のカウンタを仕込む
                    const is_textarea = ev.target?.tagName === 'TEXTAREA' && ev.target.matches('[aria-multiline="true"]');

                    if (ev.target && (ev.target.isContentEditable || is_textarea)) {
                        editable_elem = ev.target;
                        last_editor = ev.target;
                        if (!editable_elem.getAttribute("opd_text_counter")) {
                            const update_empty = () => {
                                const text = is_textarea ? editable_elem.value : editable_elem.innerText;
                                is_textarea_empty = text.trim() === '';
                                if (is_textarea_empty) {
                                    document.getElementById("opd_post_text_review").setAttribute("disabled", "");
                                } else {
                                    document.getElementById("opd_post_text_review").removeAttribute("disabled");
                                }
                            };
                            if (is_textarea) {
                                editable_elem.addEventListener("input", update_empty);
                            } else {
                                //input イベントでは半角文字の削除が取得できないため、MutationObserver を使う
                                new MutationObserver(update_empty).observe(editable_elem, {
                                    childList: true,
                                    subtree: true
                                });
                            }
                            editable_elem.setAttribute("opd_text_counter", "true");
                        }
                    } else {
                        editable_elem = null;
                    }
                });
                const observer = new MutationObserver((mutations, obs) => {
                    //戻るボタンの表示を制御する
                    const allow_back_btn_path = ["/unsent"];
                    const current_path = location.pathname;
                    const target_btn = document.querySelector('button[data-testid="app-bar-back"]');
                    if(target_btn){
                        if(!allow_back_btn_path.some(path => current_path.includes(path))){
                            target_btn.setAttribute("opd_hide","");
                        }else{
                            target_btn.removeAttribute("opd_hide");
                        }
                    }

                    //文章校正ボタンを仕込む
                    //既存のボタン類のパネルに組み込むと、他のボタンが表示されなくなる現象があるので仕方なく文字数カウンタの下に配置している
                    const btnAddTarget = document.querySelector('div[data-testid="toolBar"]')
                        ?? [...document.querySelectorAll('div[data-media-upload-dropzone] form')].at(-1);

                    const function_panel = document.querySelector('div.opd_post_functions');
                    if (btnAddTarget && !function_panel) {
                        //テーマカラー取得&ボタンカラー設定
                        const progress_bar = document.querySelector('div[data-testid="progressBar-bar"]');
                        const theme_color = this.CssChecker((progress_bar && getComputedStyle(progress_bar).backgroundColor) || 'var(--x-fg-brand)');
                        const theme_alpha = `color-mix(in srgb, ${theme_color} 10%, transparent)`;
                        document.head.insertAdjacentHTML("beforeend", `<style opd_post_textreview_theme_css>.opd_functions_btn_icon_color{background-color:${theme_color};}.opd_function_btn:not([disabled]):hover{border-radius: 100px;transition-duration: 0.2s;background-color:${theme_alpha};}.opd_text_review_panel{background-color:${theme_alpha};}</style>`);
                        //校正ボタンパネル追加
                        btnAddTarget.insertAdjacentHTML('afterend', `<div class="opd_post_functions">${function_btns.join("")}</div><div class="opd_text_review_panel"></div>`);
                        //校正ボタン動作追加
                        document.getElementById("opd_post_text_review").addEventListener("click", async ()=>{
                            //最後にフォーカスしたエディタが画面に残っていればそれを使う
                            const focused_editor = last_editor?.isConnected ? last_editor : null;
                            editable_elem = focused_editor ?? document.querySelector('div[contenteditable="true"][data-testid*="tweetTextarea"], textarea[aria-multiline="true"]');

                            //選択中のエディタの中身を直接確認する(新クライアントはtextareaなのでvalue、旧UIはinnerTextで取得している)
                            const review_text = (editable_elem?.tagName === 'TEXTAREA' ? editable_elem.value : editable_elem?.innerText)?.trim();

                            if(!review_state && review_text){
                                review_state = true;
                                const review_panel = document.querySelector('div.opd_text_review_panel');
                                review_panel.textContent = "";
                                review_panel.insertAdjacentHTML("beforeend", `<div>文章校正 (試作版)</div><div><div class="opd_text_review_loader"></div>校正中...</div>`);

                                try {
                                    await this.Review(review_text, review_panel, column_webview);
                                }finally{
                                    review_state = false;
                                }
                            }
                        });

                        //ハッシュタグ埋め込み機能動作追加
                        document.getElementById("opd_hashtag_restore").addEventListener("click", async (e)=>{
                            if(e.target.closest("div.opd_function_btn")?.hasAttribute("disabled")) return;

                            //Altキーが押されている場合はタグの記録を削除
                            if(e.altKey){
                                if(!confirm("保存されたハッシュタグを削除しますか？")) return;

                                document.dispatchEvent(new CustomEvent('opd_text_hashtag_restore_tag_delete', {
                                    bubbles: true,
                                    composed: true,
                                }));
                                return;
                            }

                            document.dispatchEvent(new CustomEvent('opd_text_hashtag_restore', {
                                bubbles: true,
                                composed: true,
                                detail: JSON.stringify({ is_firefox: false })
                            }));
                        });
                    }else if(btnAddTarget && function_panel && function_panel.previousElementSibling !== btnAddTarget){
                        //新クライアントでは、フォームが変わったのでパネル類を移動する
                        btnAddTarget.after(function_panel, document.querySelector('div.opd_text_review_panel'));
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

    const is_new_client = !document.getElementById('react-root');
    let router = null;
    const textarea_hashtags = new Map();
    let in_compose = false;

    new MutationObserver(function(){
        const back_button = document.querySelector('header button:has(svg[data-icon*="icon-close"]), main button[data-testid="app-bar-back"]');
        if(!back_button) return;
        if(location.pathname === "/intent/tweet" || location.pathname === "/compose/post"){
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
    })();

    let instance = null;
    //pushを取得
    let push = tryGetPush();

    //pushの存在をチェックし、存在していればその他の機能を初期化する
    if (is_new_client){
        new MutationObserver(intercept).observe(document, { childList: true, subtree: true });
        intercept();
    }else if(push){
        onReady();
    }else{
        const waitObserver = new MutationObserver(() => {
            push = tryGetPush();
            if (push) {
                waitObserver.disconnect();
                onReady();
            }
        });
        waitObserver.observe(document, { childList: true, subtree: true });
    }

    //入力されたタイミングでエディタに入力されたハッシュタグを保持する
    document.addEventListener('input', (ev) => {
        const target = ev.target;
        if (!is_new_client || !target.matches?.('textarea[aria-multiline="true"]')) return;

        //スレッドから削除されたポストの分は破棄する
        for (const element of textarea_hashtags.keys()) {
            if (!element.isConnected) textarea_hashtags.delete(element);
        }
        textarea_hashtags.set(target, [...target.value.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(match => match[1]));
    }, true);

    //新クライアント向けのRouter取得
    function getRouter() {
        const start = document.querySelector('main') ?? document.querySelector('textarea[aria-multiline="true"]');
        let fallback = null;
        for (let fiber = start && getFiber(start); fiber; fiber = fiber.return) {
            const p = fiber.memoizedProps;
            if (p?.router?.navigate && p.router.subscribe) return p.router;
            if (!fallback && p?.value?.history && p.value.navigate && p.value.subscribe) fallback = p.value;
        }
        return fallback;
    }

    function interceptNewClient() {
        if (router) return;

        //投稿画面の時だけ取得を行う
        if (!location.pathname.startsWith('/compose/')) return;

        router = getRouter();
        if (!router) return;

        //ツイート完了後など、投稿画面を離れたら投稿画面に戻す
        in_compose = location.pathname.startsWith('/compose/');
        router.subscribe('onResolved', () => {
            const now = location.pathname.startsWith('/compose/');
            if (in_compose && !now) {
                saveHashtags();
                router.navigate({ to: '/intent/tweet', replace: true });
            }
            in_compose = now;
        });
    }

    function intercept() {
        //ハッシュタグ埋め込み機能の状態を制御する
        const hashtag_restore_btn = document.getElementById("opd_hashtag_restore");
        if (hashtag_restore_btn && hashtag_restore_btn.dataset.opd_hashtag_init !== "1"){
            hashtag_restore_btn.dataset.opd_hashtag_init = "1";

            //ハッシュタグを取得する
            const ls_hashtags = localStorage.getItem("opd_post_hashtags");
            const hashtags = ls_hashtags ? JSON.parse(ls_hashtags) : [];

            //ハッシュタグがあれば有効化、無ければ無効化
            if(hashtags.length){
                hashtag_restore_btn.removeAttribute("disabled");
            }else{
                hashtag_restore_btn.setAttribute("disabled", "");
            }
        }

        //新クライアント向けの遷移防止
        if (is_new_client) {
            interceptNewClient();
            return;
        }

        //投稿後の画面遷移問題を解消する
        const target_element = document.querySelector('button[data-testid="unsentButton"]')?.closest("div");
        if (!target_element) return;

        let fiber = getFiber(target_element);

        if (!fiber) return;

        while (fiber) {
            if (fiber.stateNode?._handleCloseComposer) {
                // インスタンスが変わってなければスキップ
                if (fiber.stateNode === instance) return;

                //変わっていれば再び注入する
                instance = fiber.stateNode;

                //クローズ処理を再びツイート画面へ遷移するように上書きする
                instance._handleCloseComposer = () => {
                    saveHashtags();
                    push("/compose/post");
                };
                return;
            }
            //returnで走査する
            fiber = fiber.return;
        }
    }

    //校正周りの処理
    let target_editor_elem = null;
    let opd_paste_token = null;
    document.addEventListener("focusin", (ev) => {
        if(ev.target && (ev.target.isContentEditable || ev.target.matches?.('textarea[aria-multiline="true"]'))){
            target_editor_elem = ev.target;
        }
    });
    const handler = async(e) => {
        //Firefox では detail にオブジェクトを乗せられない様なので、JSON化している
        const detail = JSON.parse(e.detail);
        //貼り付け時のトークンをチェックする
        if(opd_paste_token && opd_paste_token !== detail.token) return;

        //新クライアント向けの入力
        if(target_editor_elem && target_editor_elem.tagName === 'TEXTAREA' && target_editor_elem.isConnected){
            setTextareaText(target_editor_elem, detail.text);
            return;
        }

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
                //ハッシュタグが含まれていると、execCommandでは動作が崩れるのでこうする
                setEditorText(target_editor_elem, detail.text);
            }
        }
    };

    //組み込みエディタからテキストを取得する
    function getEditorText(editor){
        //新クライアントではtextareaが使われているので、そのままvalueを返す
        if(editor?.tagName === 'TEXTAREA') return editor.value;

        //エディタの内部インスタンスを取得する
        const instance = getDraftEditorInstance(editor);

        //エディタの状態を取得して入力されているテキストを取得する
        const editor_state = instance._latestEditorState;
        const content = editor_state.getCurrentContent();
        return content.getPlainText("\n");
    }

    //組み込みエディタからハッシュタグを取得
    function getEditorHashtags(){
        const target_editors = document.querySelectorAll('div[contenteditable="true"][data-testid*="tweetTextarea"], textarea[aria-multiline="true"]');

        //複数ツイートも考慮してすべてのエディタからハッシュタグを取得して返す
        const tags = [];
        target_editors.forEach((editor)=>{
            //エディタのテキストを取得する
            const text = getEditorText(editor);
            //入力されているハッシュタグを抽出して追加する
            const editor_tags = [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(m => m[1])
            tags.push(...editor_tags);
        });
        return tags;
    }

    //ハッシュタグをローカルストレージに保存させる
    //TODO:ハッシュタグをOpen-Deck側のストレージで保持するようにする
    function saveHashtags(){
        const hashtags = is_new_client ? [...textarea_hashtags.values()].flat() : getEditorHashtags();
        textarea_hashtags.clear();

        //ハッシュタグがない場合は何もしない
        if(!hashtags.length) return;

        localStorage.setItem("opd_post_hashtags", JSON.stringify(hashtags));
    }

    //保存されたハッシュタグをテキストエディタへ挿入する
    const restoreHashtags = async(e) => {
        const hashtag_restore_btn = document.getElementById("opd_hashtag_restore");
        //無効の場合は何もしない
        if(!hashtag_restore_btn || hashtag_restore_btn.hasAttribute("disabled")) return;

        const detail = JSON.parse(e.detail);

        const ls_hashtags = localStorage.getItem("opd_post_hashtags");
        if(!ls_hashtags) return;

        const hashtags = JSON.parse(ls_hashtags);

        const active_editor = hashtag_restore_btn.closest('[data-media-upload-dropzone]')?.querySelector('textarea[aria-multiline="true"]')
            ?? document.querySelector('[data-testid="toolBar"]')?.closest('div:has(.public-DraftEditor-content)')?.querySelector('.public-DraftEditor-content[contenteditable="true"]');

        //現在のテキストを取得して保存されたハッシュタグを付与する
        const editor_text = getEditorText(active_editor)
        const hashtag_text = " " + hashtags.map(tag => "#" + tag).join(" ");

        //ハッシュタグをエディタへ挿入する
        setEditorText(active_editor, editor_text + hashtag_text);
    }

    //保存されたハッシュタグを削除する
    function deleteStorageHashtags(){
        localStorage.removeItem("opd_post_hashtags");

        const hashtag_restore_btn = document.getElementById("opd_hashtag_restore");
        if(!hashtag_restore_btn) return;

        hashtag_restore_btn.setAttribute("disabled", "");
    }

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

    function setEditorText(target_editor_elem, text){
        //新クライアント向けの入力
        if(target_editor_elem?.tagName === 'TEXTAREA'){
            setTextareaText(target_editor_elem, text);
            return true;
        }

        //エディタと内部状態を取得
        const editor = getDraftEditorInstance(target_editor_elem);
        const editor_state = editor?._latestEditorState ?? editor?.props?.editorState;
        const on_change = editor?.props?.onChange;
        if(!editor_state || typeof on_change !== "function") return false;

        //取得した状態からクラスを取得する
        const EditorState  = editor_state.constructor;
        const ContentState = editor_state.getCurrentContent().constructor;

        //新しい状態を作ってエディタのonChangeに渡す
        const new_state = EditorState.moveFocusToEnd(
            EditorState.createWithContent(ContentState.createFromText(text), editor_state.getDecorator())
        );
        on_change(new_state);
        return true;
    }

    //新クライアント向けの書き戻し
    function setTextareaText(textarea, text){
        textarea.focus();
        textarea.select();
        //execCommandを使ってみて、失敗したら別の方法へフォールバックする
        if(!document.execCommand('insertText', false, text) || textarea.value !== text){
            const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
            setter.call(textarea, text);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    //テキスト貼り付けの認証トークン受付イベントを作成する
    window.addEventListener('opd_text_review_init', (e)=>{
        const detail = JSON.parse(e.detail);
        opd_paste_token = detail.token;
    }, true);

    //テキストを貼り付けさせるイベントを作成する
    window.addEventListener('opd_text_review_apply', handler, true);

    //ハッシュタグ埋め込み機能のイベントを作成する
    window.addEventListener('opd_text_hashtag_restore', restoreHashtags, true);

    //ハッシュタグ埋め込み機能のタグ記録を削除する
    window.addEventListener('opd_text_hashtag_restore_tag_delete', deleteStorageHashtags, true);

    //ReactProps取得
    function getProps(elem){
        const propsKey = Object.getOwnPropertyNames(elem).find(k => k.includes(`__reactProps$`));
        return propsKey ? elem[propsKey] : null;
    }

    //ReactFiber取得
    function getFiber(elem) {
        const fiberKey = Object.getOwnPropertyNames(elem).find(k => k.includes('__reactFiber$'));
        return fiberKey ? elem[fiberKey] : null;
    }

    //組み込みエディタ取得
    function getDraftEditorInstance(text_area){
        let target_element = text_area;
        while (target_element) {
            const props = getProps(target_element);
            const editor = props?.children?.props?.editor ?? props?.children?.[0]?.props?.editor;
            if (editor) {
                return editor;
            }
            target_element = target_element.parentElement;
        }
    }

    //push取得
    function tryGetPush(){
        const root = document.querySelector('#react-root > div');
        if (!root) return null;
        return getProps(root)?.children?.props?.children?.props?.history?.push ?? null;
    }

    //pushの取得後に実行
    function onReady(){
        const observer = new MutationObserver(intercept);
        observer.observe(document.querySelector('#react-root'), {
            childList: true, subtree: true
        });
        intercept();
    }
})();