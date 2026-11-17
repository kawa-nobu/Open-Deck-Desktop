//自動更新機能用
(() => {
    const is_new_client = !!window.__TSR_ROUTER__ || !document.getElementById('react-root');
    let opd_reload_token = null;
    let reload_func = () => { };
    
    //タイムライン更新関数
    reload_func = () => {
        //新クライアントの場合は新しいAPIを使うようにする
        if (is_new_client) return get_new_client_timeline_api(document.querySelector('main section[aria-labelledby]'))?.fetchTop({ requestContext: 'ptr' });

        //旧クライアントは従来通りのものを使う
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

    //新クライアントのタイムラインAPIを取得する
    function get_new_client_timeline_api(elem, max_hop = 30) {
        let fiber = get_props(elem, "Fiber");
        let hop = 0;
        while (fiber && hop++ < max_hop) {
            //ホームなど、外側からrefが渡されている場合
            const api = fiber.memoizedProps?.api?.current;
            if (typeof api?.fetchTop === 'function') {
                return api;
            }
            //外側からrefが渡されていない画面はラッパーがuseRefに保持しているものを使用する
            for (let state = fiber.memoizedState; state; state = state.next) {
                const state_api = state.memoizedState?.current?.api;
                if (typeof state_api?.fetchTop === 'function') {
                    return state_api;
                }
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