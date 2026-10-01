const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld("opd_system",{
    async get_column_posts_settings(column_type){
        const result = await ipcRenderer.invoke('get_column_posts_settings', {type:column_type});
        return result;
    },
    open_default_browser(url){
        ipcRenderer.send('open_default_browser', url);
        return true;
    },
    text_review(str){
        const result = ipcRenderer.invoke('start_text_review', {text:str});
        return result;
    },
    open_media_viewer(media_info, selected_index){
        ipcRenderer.send('open_media_viewer', media_info, selected_index);
        return true;
    },
});

//マウスのサイドボタン(戻る/進む)の動作を追加する
const isSide = (e) => e.button === 3 || e.button === 4;

function onSideButton(e) {
  if (!isSide(e)) return;
  e.stopImmediatePropagation();
  if (e.type.startsWith('pointer')) return; // preventDefault すると mouseup が発生しなくなる
  e.preventDefault();
  if (e.type === 'mouseup') e.button === 3 ? history.back() : history.forward();
}

addEventListener('pointerdown', onSideButton, true);
addEventListener('pointerup', onSideButton, true);
addEventListener('mousedown', onSideButton, true);
addEventListener('mouseup', onSideButton, true);
addEventListener('auxclick', onSideButton, true);