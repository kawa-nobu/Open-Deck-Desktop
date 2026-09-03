//自動更新機能用
(() => {
    let path_old = null;
    let opd_reload_token = null;
    let reload_func = ()=>{};
    
    //タイムライン更新関数
    reload_func = ()=>{
        get_on_refresh_props(document.querySelector('section[role="region"]'))?.onRefresh();
    };

    //onRefreshの存在するmemoizedPropsを取得する
    function get_on_refresh_props(elem, max_hop = 30){
        let fiber = get_props(elem, "Fiber");
        let hop = 0;
        while (fiber && hop++ < max_hop) {
            const memoized_props = fiber.memoizedProps;
            if (typeof fiber.memoizedProps?.onRefresh === 'function') {
                return memoized_props;
            }
            fiber = fiber.return;
        }
        return null;
    }
    //ReactProps取得関数
    function get_props(elem, type){
        const prop_type = type === "Props" ? type : "Fiber";
        const propsKey = Object.getOwnPropertyNames(elem).find(k => k.includes(`__react${prop_type}$`));
        return propsKey ? elem[propsKey] : null;
    }
    //機能動作用のトークンを設定
    window.addEventListener('opd_column_reload_init', (e)=>{
        const detail = JSON.parse(e.detail);
        opd_reload_token = detail.token;
    }, true);
    //自動更新イベントを追加する
    window.addEventListener('opd_column_reload', (e) => {
        const detail = JSON.parse(e.detail);
        if(opd_reload_token && opd_reload_token !== detail.token) return;
        reload_func();
    }, true);
})();