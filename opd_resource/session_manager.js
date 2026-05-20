window.addEventListener("load", async function(){
    const get_session_data = await opd_system.opd_session_store_operation('get_store');
    let delete_btn_num = 0;
    get_session_data.twitter.forEach((array_data) => {
        document.getElementById("twitter_session_list").insertAdjacentHTML("beforeend", `<li class="session_item"><span>${array_data.session_name}</span><button id="twitter_session_${delete_btn_num}" class="twitter_session_delete">削除</button></li>`);
        document.getElementById(`twitter_session_${delete_btn_num}`).addEventListener("click", async function(){
            if(await opd_system.opd_custom_dialog("セッション削除", `セッション「${array_data.session_name}」を削除します`)){
                const delete_session = await opd_system.opd_session_store_operation('delete_store', {provider:"twitter", session_name:array_data.session_name});
                switch (delete_session.status) {
                    case 'Complete':
                        location.reload();
                        break;
                    case 'OpenProfile':
                        opd_system.opd_custom_dialog("セッションオープン中", "セッションが現在のプロファイル内のカラムで使用されています。\r\n削除対象のセッションを切り替えてください。");
                        break;
                    case 'SysOpen':
                        opd_system.opd_custom_dialog("セッションシステムオープン中", "セッションがシステム内部でオープンされています。\r\nアプリケーションの再起動後にもう一度操作をお試しください");
                        break;
                    default:
                        opd_system.opd_custom_dialog("システムエラー", "操作に失敗しました");
                        break;
                }
            }
        });
        delete_btn_num += 1;
    });
    get_session_data.misskey.forEach((array_data) => {
        document.getElementById("misskey_session_list").insertAdjacentHTML("beforeend", `<li class="session_item"><span>${array_data.session_name}</span><button id="misskey_session_${delete_btn_num}" class="misskey_session_delete">削除</button></li>`);
        document.getElementById(`misskey_session_${delete_btn_num}`).addEventListener("click", async function(){
            if(await opd_system.opd_custom_dialog("セッション削除", `セッション「${array_data.session_name}」を削除します`)){
                const delete_session = await opd_system.opd_session_store_operation('delete_store', {provider:"misskey", session_name:array_data.session_name});
                switch (delete_session.status) {
                    case 'Complete':
                        location.reload();
                        break;
                    case 'OpenProfile':
                        opd_system.opd_custom_dialog("セッションオープン中", "セッションが現在のプロファイル内のカラムで使用されています。\r\n削除対象のセッションを切り替えてください。");
                        break;
                    case 'SysOpen':
                        opd_system.opd_custom_dialog("セッションシステムオープン中", "セッションがシステム内部でオープンされています。\r\nアプリケーションの再起動後にもう一度操作をお試しください");
                        break;
                    default:
                        opd_system.opd_custom_dialog("システムエラー", "操作に失敗しました");
                        break;
                }
            }
        });
        delete_btn_num += 1;
    });
    get_session_data.bluesky.forEach((array_data) => {
        document.getElementById("bluesky_session_list").insertAdjacentHTML("beforeend", `<li class="session_item"><span>${array_data.session_name}</span><button id="bluesky_session_${delete_btn_num}" class="bluesky_session_delete">削除</button></li>`);
        document.getElementById(`bluesky_session_${delete_btn_num}`).addEventListener("click", async function(){
            if(await opd_system.opd_custom_dialog("セッション削除", `セッション「${array_data.session_name}」を削除します`)){
                const delete_session = await opd_system.opd_session_store_operation('delete_store', {provider:"bluesky", session_name:array_data.session_name});
                switch (delete_session.status) {
                    case 'Complete':
                        location.reload();
                        break;
                    case 'OpenProfile':
                        opd_system.opd_custom_dialog("セッションオープン中", "セッションが現在のプロファイル内のカラムで使用されています。\r\n削除対象のセッションを切り替えてください。");
                        break;
                    case 'SysOpen':
                        opd_system.opd_custom_dialog("セッションシステムオープン中", "セッションがシステム内部でオープンされています。\r\nアプリケーションの再起動後にもう一度操作をお試しください");
                        break;
                    default:
                        opd_system.opd_custom_dialog("システムエラー", "操作に失敗しました");
                        break;
                }
            }
        });
        delete_btn_num += 1;
    });
    //追加操作
    document.getElementById('add_twitter_session_button').addEventListener("click", async function(){
        const session_name = document.getElementById('add_twitter_session_name').value;
        if(session_name != ''){
            const add_session = await opd_system.opd_session_store_operation('add_store', {provider:"twitter", session_name:session_name, server_name:"x.com"});
            switch(add_session.status){
                case 'Complete':
                    location.reload();
                    break;
                case 'ExistedSessionName':
                    opd_system.opd_custom_dialog("セッション名重複", "エラー\r\n名前が他セッション名と重複しています！")
                    break;
                case 'UnavailableString':
                    opd_system.opd_custom_dialog("セッション名エラー", "エラー\r\nシステム予約文字列が含まれています！")
                    break;
                default:
                    opd_system.opd_custom_dialog("セッション名エラー", "エラー\r\n操作に失敗しました");
                    break;
                }
        }else{
            opd_system.opd_custom_dialog("セッション名エラー", "セッション名を入力してください！");
        }
    });
    document.getElementById('add_misskey_session_button').addEventListener("click", async function(){
        const session_name = document.getElementById('add_misskey_session_name').value;
        if(session_name != ''){
            const add_session = await opd_system.opd_session_store_operation('add_store', {provider:"misskey", session_name:session_name, server_name:"misskey.io"});
            switch(add_session.status){
                case 'Complete':
                    location.reload();
                    break;
                case 'ExistedSessionName':
                    opd_system.opd_custom_dialog("セッション名重複", "エラー\r\n名前が他セッション名と重複しています！")
                    break;
                case 'UnavailableString':
                    opd_system.opd_custom_dialog("セッション名エラー", "エラー\r\nシステム予約文字列が含まれています！")
                    break;
                default:
                    opd_system.opd_custom_dialog("セッション名エラー", "エラー\r\n操作に失敗しました");
                    break;
                }
        }else{
            opd_system.opd_custom_dialog("セッション名エラー", "セッション名を入力してください！");
        }
    });
    document.getElementById('add_bluesky_session_button').addEventListener("click", async function(){
        const session_name = document.getElementById('add_bluesky_session_name').value;
        if(session_name != ''){
            const add_session = await opd_system.opd_session_store_operation('add_store', {provider:"bluesky", session_name:session_name, server_name:"bsky.app"});
            switch(add_session.status){
                case 'Complete':
                    location.reload();
                    break;
                case 'ExistedSessionName':
                    opd_system.opd_custom_dialog("セッション名重複", "エラー\r\n名前が他セッション名と重複しています！")
                    break;
                case 'UnavailableString':
                    opd_system.opd_custom_dialog("セッション名エラー", "エラー\r\nシステム予約文字列が含まれています！")
                    break;
                default:
                    opd_system.opd_custom_dialog("セッション名エラー", "エラー\r\n操作に失敗しました");
                    break;
                }
        }else{
            opd_system.opd_custom_dialog("セッション名エラー", "セッション名を入力してください！");
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