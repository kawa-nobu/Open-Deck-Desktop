window.addEventListener("load", async function(){
    const get_session_data = await opd_system.opd_session_store_operation('get_store');
    console.log(get_session_data);
    let delete_btn_num = 0;
    get_session_data.twitter.forEach((array_data) => {
        document.getElementById("twitter_session_list").insertAdjacentHTML("beforeend", `<tr><th scope="row">${array_data.session_name}</th><td><input id="twitter_session_${delete_btn_num}" class="twitter_session_delete" type="button" value="削除"</td></tr>`);
        document.getElementById(`twitter_session_${delete_btn_num}`).addEventListener("click", async function(){
            if(confirm(`セッション「${array_data.session_name}」を削除します`)){
                const delete_session = await opd_system.opd_session_store_operation('delete_store', {provider:"twitter", session_name:array_data.session_name});
                if(delete_session.status == 'Complete'){
                    location.reload();
                }else{
                    alert("操作に失敗しました")
                }
            }
        });
        delete_btn_num += 1;
    });
    get_session_data.misskey.forEach((array_data) => {
        document.getElementById("misskey_session_list").insertAdjacentHTML("beforeend", `<tr><th scope="row">${array_data.session_name}</th><td><input id="misskey_session_${delete_btn_num}" class="misskey_session_delete" type="button" value="削除"</td></tr>`);
        document.getElementById(`misskey_session_${delete_btn_num}`).addEventListener("click", async function(){
            if(confirm(`セッション「${array_data.session_name}」を削除します`)){
                const delete_session = await opd_system.opd_session_store_operation('delete_store', {provider:"misskey", session_name:array_data.session_name});
                if(delete_session.status == 'Complete'){
                    location.reload();
                }else{
                    alert("操作に失敗しました")
                }
            }
        });
        delete_btn_num += 1;
    });
    get_session_data.bluesky.forEach((array_data) => {
        document.getElementById("bluesky_session_list").insertAdjacentHTML("beforeend", `<tr><th scope="row">${array_data.session_name}</th><td><input id="bluesky_session_${delete_btn_num}" class="bluesky_session_delete" type="button" value="削除"</td></tr>`);
        document.getElementById(`bluesky_session_${delete_btn_num}`).addEventListener("click", async function(){
            if(confirm(`セッション「${array_data.session_name}」を削除します`)){
                const delete_session = await opd_system.opd_session_store_operation('delete_store', {provider:"bluesky", session_name:array_data.session_name});
                if(delete_session.status == 'Complete'){
                    location.reload();
                }else{
                    alert("操作に失敗しました")
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
                    alert("エラー\r\n名前が他セッション名と重複しています！")
                    break;
                case 'UnavailableString':
                    alert("エラー\r\nシステム予約文字列が含まれています！")
                    break;
                default:
                    alert("エラー\r\n操作に失敗しました");
                    break;
                }
        }else{
            alert("セッション名を入力してください！");
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
                    alert("エラー\r\n名前が他セッション名と重複しています！")
                    break;
                case 'UnavailableString':
                    alert("エラー\r\nシステム予約文字列が含まれています！")
                    break;
                default:
                    alert("エラー\r\n操作に失敗しました");
                    break;
                }
        }else{
            alert("セッション名を入力してください！");
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
                    alert("エラー\r\n名前が他セッション名と重複しています！")
                    break;
                case 'UnavailableString':
                    alert("エラー\r\nシステム予約文字列が含まれています！")
                    break;
                default:
                    alert("エラー\r\n操作に失敗しました");
                    break;
                }
        }else{
            alert("セッション名を入力してください！");
        }
    });
});