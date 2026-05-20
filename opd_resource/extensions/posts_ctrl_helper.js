/* ポストのメタデータを取り出して表示制御などを行う
Powered by CSLT (cslt_tweet_ctrl.js)
https://github.com/kawa-nobu/Clean-Spam-Link-Tweet/blob/Release/cslt_tweet_ctrl.js

TODO:CSLT が OpenDeck に統合されるようになったら、CSLT への自動切り替えを実装する
*/
(async () => {
    const OPD_SETTINGS = await opd_system.get_column_posts_settings("twitter");

    function get_tw_userdata(input_element, mode) {
        const input_pr_array = Object.getOwnPropertyNames(input_element);
        const props_pr_name = input_pr_array.find((input) => input.includes('__reactProps$'));
        const props_data = input_element[props_pr_name];
        switch (mode) {
            case "user_page":
                return props_data?.children[0][1]?.props?.children[0]?.props?.children[1]?.props?.user;
            case "user_page_ids":
                const user_obj = {
                    userId: props_data?.children[0][1]?.props?.children[0]?.props?.children[1]?.props.userId,
                    screen_name: props_data?.children[0][1]?.props?.children[0]?.props?.children[0]?.props?.screenName
                };
                return user_obj;
            case "reply":
                return props_data?.children[1]?.props?.retweetWithCommentLink?.state?.quotedStatus;
            case "login_user":
                return props_data?.children?.props?.children?.props?.children[1]?.props?.children?.props?.children?.props?.children?.props?.value?.loggedInUserId;
            case "user_page_info":
                return props_data?.children[0]?.props?.children[1]?.props?.user;
            case "settings_block_mute_user_id":
                return props_data?.children[0][1]?.props?.children[0]?.props?.children[1]?.props?.userId;
            case "notification_like_rt":
                return props_data?.children[0][1]?.props?.children?.props?.children[0]?.props?.children?.props?.users
        }
    }
    const root_elem = document.querySelector('#react-root');
    //ログインユーザーID出力関数
    function login_userid() {
        return document.querySelector('script[type="text/javascript"][charset="utf-8"][nonce]').textContent.match(/"screen_name":"(.*?)"/)[1];
    }
    const tweet_obs = new MutationObserver(function () {
        //console.log("obs_load");
        let tweet_elem = null;
        let page_mode = null;
        const page_path = window.location.pathname.split("/")[2];
        const page_path_status = window.location.pathname.split("/")[4];
        switch (page_path) {
            case 'status':
                //tweet_elem = document.querySelectorAll('main div[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[aria-label][role="group"][id]:not([opd_tweet_process="ok"])');
                tweet_elem = document.querySelectorAll('#react-root div[data-testid="cellInnerDiv"] article[data-testid="tweet"] div[aria-label][role="group"][id]:not([opd_tweet_process="ok"])');
                page_mode = 'status';
                break;
            case 'verified_followers':
            case 'followers':
            case 'following':
                tweet_elem = document.querySelectorAll('section[role="region"] div[data-testid="cellInnerDiv"] div[role="button"][tabindex="0"][data-testid="UserCell"]:not([opd_tweet_process="ok"]), section[role="region"] div[data-testid="cellInnerDiv"] [type="button"][data-testid="UserCell"]:not([opd_tweet_process="ok"])');
                page_mode = 'followers';
                break;
            case 'communities':
                tweet_elem = document.querySelectorAll('main div[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[aria-label][role="group"][id]:not([opd_tweet_process="ok"])');
                page_mode = 'communities';
                break;
            default:
                if (window.location.search.match(/f=user/g)?.length == 1) {
                    //ユーザー検索ページの場合
                    tweet_elem = document.querySelectorAll('section[role="region"] div[data-testid="cellInnerDiv"] div[role="button"][tabindex="0"][data-testid="UserCell"]:not([opd_tweet_process="ok"]), section[role="region"] div[data-testid="cellInnerDiv"] [type="button"][data-testid="UserCell"]:not([opd_tweet_process="ok"])');
                    page_mode = 'followers';
                    break;
                } else {
                    //その他の場合(通知欄も検出対象)
                    tweet_elem = document.querySelectorAll('main div[data-testid="cellInnerDiv"] article[data-testid="tweet"][tabindex="0"] div[aria-label][role="group"][id]:not([opd_tweet_process="ok"]), article[data-testid="notification"]:not([opd_tweet_process="ok"])');
                    page_mode = 'other';
                    break;
                }

        }
        //ツイートのリツイート、いいね画面の場合
        if (page_path == 'status' && page_path_status == 'retweets' || page_path_status == 'likes') {
            tweet_elem = document.querySelectorAll('section[role="region"] div[data-testid="cellInnerDiv"] div[role="button"][tabindex="0"][data-testid="UserCell"]:not([opd_tweet_process="ok"]), section[role="region"] div[data-testid="cellInnerDiv"] [type="button"][data-testid="UserCell"]:not([opd_tweet_process="ok"])');
            //ユーザーが出て来るだけなのでフォロワー欄扱いで処理
            page_mode = 'followers';
        }
        for (let tweet_index = 0; tweet_index < tweet_elem.length; tweet_index++) {
            let opd_tweet_info = null;
            let opd_user_info = null;
            if (tweet_elem[tweet_index] != null) {
                let video_info = [];
                switch (page_mode) {
                    case 'status':
                        //console.log("status")
                        const tweet_info_reply = get_tw_userdata(tweet_elem[tweet_index], "reply");

                        //console.dir(tweet_info_reply)

                        if (tweet_info_reply != undefined) {
                            //報告用JSON生成
                            let is_media_tweet = false;
                            let is_promo_tweet = false;
                            if (tweet_info_reply.extended_entities?.media != undefined) {
                                is_media_tweet = true;
                            }
                            if (tweet_info_reply.promoted_content != undefined) {
                                is_promo_tweet = true;
                            }
                            //動画・GIF情報取り出し
                            if (is_media_tweet) {
                                const media_info_obj = tweet_info_reply.entities?.media;
                                //console.log(media_info_obj)
                                for (let index = 0; index < media_info_obj.length; index++) {
                                    if (media_info_obj[index].type == "video") {
                                        //console.log(media_info_obj[index])
                                        let media_source_user_data = null;
                                        if (media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy != undefined) {
                                            media_source_user_data = {
                                                user_data: {
                                                    name: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.name,
                                                    description: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.description,
                                                    user_id: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.id_str,
                                                    scr_name: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.screen_name,
                                                    all_tweet_count: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.statuses_count,
                                                    is_blue: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.is_blue_verified,
                                                    location: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.location,
                                                    account_create_date: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.created_at
                                                }
                                            }
                                        }
                                        const media_info = {
                                            type: media_info_obj[index].type,
                                            duration_ms: media_info_obj[index].video_info.duration_millis,
                                            video_raw: media_info_obj[index].video_info.variants.at(-1),
                                            video_source_user_info: media_source_user_data
                                        }
                                        video_info.push(media_info);
                                    }
                                    if (media_info_obj[index].type == "animated_gif") {
                                        const media_info = {
                                            type: media_info_obj[index].type,
                                            duration_ms: null,
                                            video_raw: media_info_obj[index].video_info.variants.at(-1),
                                            video_source_user_info: null
                                        }
                                        video_info.push(media_info);
                                    }
                                }
                                if (video_info.length == 0) {
                                    video_info = null;
                                }
                            } else {
                                video_info = null;
                            }
                            //ツイート情報オブジェクト生成
                            let is_reply_root_tweet = false;
                            let reply_quoted_obj = null;
                            let reply_out_urls = null;
                            let quoted_urls = null;
                            let is_reply_status = false;
                            let reply_user_data_status_obj = null;
                            let reply_twitter_card_obj = null;
                            let reply_twitter_card_unified_obj = null;
                            let reply_blocked_by_flag = false;
                            let reply_quoted_blocked_by_flag = false;
                            if (tweet_info_reply.permalink == location.pathname) {
                                is_reply_root_tweet = true;
                            }
                            if (tweet_info_reply.quoted_status != undefined) {
                                if (tweet_info_reply.quoted_status.entities?.urls?.length != 0) {
                                    quoted_urls = tweet_info_reply.quoted_status.entities.urls;
                                }
                                if (tweet_info_reply.quoted_status.user.blocked_by) {
                                    reply_quoted_blocked_by_flag = true;
                                }
                                reply_quoted_obj = {
                                    text: tweet_info_reply.quoted_status.full_text,
                                    mentions: tweet_info_reply.quoted_status.entities?.user_mentions ?? null,
                                    possibly_sensitive: tweet_info_reply.quoted_status.possibly_sensitive,
                                    possibly_sensitive_editable: tweet_info_reply.quoted_status.possibly_sensitive_editable,
                                    "quoted_urls": quoted_urls,
                                    tweet_lang: tweet_info_reply.quoted_status.lang,
                                    content_disclosure: tweet_info_reply.quoted_status?.content_disclosure ?? null,
                                    user_data: {
                                        name: tweet_info_reply.quoted_status.user.name,
                                        description: tweet_info_reply.quoted_status.user.description,
                                        user_id: tweet_info_reply.quoted_status.user.id_str,
                                        scr_name: tweet_info_reply.quoted_status.user.screen_name,
                                        all_tweet_count: tweet_info_reply.quoted_status.user.statuses_count,
                                        is_blue: tweet_info_reply.quoted_status.user.is_blue_verified,
                                        location: tweet_info_reply.quoted_status.user.location,
                                        account_create_date: tweet_info_reply.quoted_status.user.created_at,
                                        blocked_by: reply_quoted_blocked_by_flag
                                    }
                                }
                            }
                            if (tweet_info_reply.entities?.urls?.length != 0) {
                                reply_out_urls = tweet_info_reply.entities.urls;
                            }
                            if (tweet_info_reply.in_reply_to_status_id_str != undefined) {
                                is_reply_status = true;
                                reply_user_data_status_obj = {
                                    name: tweet_info_reply.in_reply_to_user.name,
                                    user_id: tweet_info_reply.in_reply_to_user.id_str,
                                    scr_name: tweet_info_reply.in_reply_to_user.screen_name,
                                    all_tweet_count: tweet_info_reply.in_reply_to_user.statuses_count,
                                    is_blue: tweet_info_reply.in_reply_to_user.is_blue_verified,
                                    location: tweet_info_reply.in_reply_to_user.location,
                                    account_create_date: tweet_info_reply.in_reply_to_user.created_at
                                }
                            }
                            if (tweet_info_reply?.card?.binding_values?.domain?.string_value != undefined) {
                                reply_twitter_card_obj = {
                                    domain: tweet_info_reply.card.binding_values.domain.string_value
                                }
                            }
                            if (tweet_info_reply?.card?.binding_values?.unified_card?.string_value) {
                                reply_twitter_card_unified_obj = JSON.parse(tweet_info_reply?.card?.binding_values?.unified_card?.string_value)
                            }
                            if (tweet_info_reply.user.blocked_by) {
                                reply_blocked_by_flag = true;
                            }
                            const tweetinfo_attr_reply = {
                                is_root_tweet: is_reply_root_tweet,
                                mentions: tweet_info_reply.entities?.user_mentions ?? null,
                                text: tweet_info_reply.text,
                                tweet_id: tweet_info_reply.id_str,
                                tweet_client: tweet_info_reply.source_name,
                                is_reply: is_reply_status,
                                is_user_data_only: false,
                                tweet_lang: tweet_info_reply.lang,
                                is_promoted: is_promo_tweet,
                                grok_share_attachment: tweet_info_reply?.grok_share_attachment ?? null,
                                content_disclosure: tweet_info_reply?.content_disclosure ?? null,
                                user_data: {
                                    name: tweet_info_reply.user.name,
                                    description: tweet_info_reply.user.description,
                                    user_id: tweet_info_reply.user.id_str,
                                    scr_name: tweet_info_reply.user.screen_name,
                                    all_tweet_count: tweet_info_reply.user.statuses_count,
                                    is_blue: tweet_info_reply.user.is_blue_verified,
                                    location: tweet_info_reply.user.location,
                                    account_create_date: tweet_info_reply.user.created_at,
                                    blocked_by: reply_blocked_by_flag
                                },
                                in_reply_user_data: reply_user_data_status_obj,
                                tweet_video_info: video_info,
                                "quoted_obj": reply_quoted_obj,
                                "attached_urls": reply_out_urls,
                                "tw_card_unified_obj": reply_twitter_card_unified_obj,
                                "tw_card_obj": reply_twitter_card_obj
                            };
                            //console.log(tweetinfo_attr_reply)
                            //const target_root_elem_reply = tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]');
                            //target_root_elem_reply.setAttribute("opd_tweet_info", JSON.stringify(tweetinfo_attr_reply));
                            opd_tweet_info = tweetinfo_attr_reply;
                        }
                        break;
                    case 'followers':
                        //button __reactProps$3d2jw1jzxv2.children[0][1].props.children[1].props.children[1].props.userId
                        const view_user = window.location.pathname.split("/")[1];
                        const now_follow_mode = window.location.pathname.split("/")[2];
                        //console.log("follws_run")
                        if (login_userid() == view_user && now_follow_mode == "followers") {
                            const tweet_info_follow = get_tw_userdata(tweet_elem[tweet_index], "user_page");
                            //console.log(tweet_info_follow)
                            if (tweet_info_follow != undefined) {
                                //ツイート情報オブジェクト生成
                                const tweetinfo_attr_follow = {
                                    is_reply: false,
                                    is_user_data_only: true,
                                    user_data: {
                                        name: tweet_info_follow.name,
                                        user_id: tweet_info_follow.id_str,
                                        scr_name: tweet_info_follow.screen_name,
                                        all_tweet_count: tweet_info_follow.statuses_count,
                                        is_blue: tweet_info_follow.is_blue_verified
                                    },
                                };
                                //console.log(tweet_info_follow);
                                //console.log(tweetinfo_attr_follow)
                                //tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("opd_tweet_info", JSON.stringify(tweetinfo_attr_follow));
                                opd_user_info = tweetinfo_attr_follow;
                            }
                        } else {
                            const tweet_info_follow = get_tw_userdata(tweet_elem[tweet_index], "user_page_ids");
                            //console.log(tweet_info_follow)
                            const tweetinfo_attr_follow = {
                                user_data: {
                                    user_id: tweet_info_follow.userId,
                                    scr_name: tweet_info_follow.screen_name
                                },
                                is_user_data_only: true,
                                is_reply: false
                            };
                            //console.log(tweet_info_follow);
                            //console.log(tweetinfo_attr_follow)
                            //tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("opd_tweet_info", JSON.stringify(tweetinfo_attr_follow));
                            opd_user_info = tweetinfo_attr_follow;
                        }
                    case 'other':
                        //console.log(window.location.pathname.split("/")[2])
                        //console.log("other")
                        //通知ページの場合(仮実装)
                        if (tweet_elem[tweet_index].getAttribute("data-testid") == 'notification') {
                            const notification_user_info = get_tw_userdata(tweet_elem[tweet_index], "notification_like_rt");
                            const notification_user_data_array = [];
                            //console.log(notification_user_info)
                            if (notification_user_info != undefined) {
                                for (let notification_user_index = 0; notification_user_index < notification_user_info.length; notification_user_index++) {
                                    const notification_user_data = notification_user_info[notification_user_index];
                                    notification_user_data_array.push(
                                        {
                                            is_user_data_only: true,
                                            is_reply: false,
                                            user_data: { name: notification_user_data.name, description: notification_user_data.description, user_id: notification_user_data.id_str, scr_name: notification_user_data.screen_name, all_tweet_count: notification_user_data.statuses_count, is_blue: notification_user_data.is_blue_verified, location: notification_user_data.location, account_create_date: notification_user_data.created_at, blocked_by: null },
                                        }
                                    );
                                }
                                const notification_user_obj = {
                                    user_data_array: notification_user_data_array
                                }
                                //const target_root_elem_notification = tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]');
                                //target_root_elem_notification.setAttribute("opd_notifications_page_element", "");
                                //target_root_elem_notification.setAttribute("opd_tweet_info", JSON.stringify(notification_user_obj));//opd_notification_users_info
                                opd_user_info = notification_user_obj;
                            }
                        }
                        //ユーザーページの場合
                        const user_page_header_item = document.querySelector('div[data-testid="UserName"]:not([opd_user_page_info_element])');
                        if (user_page_header_item != null) {
                            const user_page_info = get_tw_userdata(user_page_header_item, "user_page_info");
                            //console.log(user_page_info)
                            const userinfo_attr = {
                                user_data_array: [
                                    {
                                        user_data: {
                                            name: user_page_info?.name,
                                            user_id: user_page_info?.id_str,
                                            scr_name: user_page_info?.screen_name,
                                            all_tweet_count: user_page_info?.statuses_count,
                                            is_blue: user_page_info?.is_blue_verified
                                        },
                                        is_user_data_only: true,
                                        is_reply: false
                                    }
                                ]
                            };
                            //console.log(userinfo_attr);
                            //user_page_header_item.setAttribute("opd_tweet_info", JSON.stringify(userinfo_attr));
                            user_page_header_item.setAttribute("opd_user_page_user_scr_name", user_page_info?.screen_name);
                            user_page_header_item.setAttribute("opd_user_page_info_element", "");
                            opd_user_info = userinfo_attr;
                        }
                        //
                        const tweet_info_other = get_tw_userdata(tweet_elem[tweet_index], "reply");

                        //console.dir(tweet_info_other)

                        if (tweet_info_other != undefined) {
                            //報告用JSON生成
                            let is_media_tweet = false;
                            let is_promo_tweet = false;
                            if (tweet_info_other.extended_entities?.media[0] != undefined) {
                                is_media_tweet = true;
                            }
                            if (tweet_info_other.promoted_content != undefined) {
                                is_promo_tweet = true;
                            }
                            //動画情報取り出し
                            if (is_media_tweet) {
                                const media_info_obj = tweet_info_other.entities?.media;
                                //console.log(media_info_obj)
                                for (let index = 0; index < media_info_obj.length; index++) {
                                    if (media_info_obj[index].type == "video") {
                                        //console.log(media_info_obj[index])
                                        let media_source_user_data = null;
                                        if (media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy != undefined) {
                                            media_source_user_data = {
                                                user_data: {
                                                    name: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.name,
                                                    description: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.description,
                                                    user_id: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.id_str,
                                                    scr_name: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.screen_name,
                                                    all_tweet_count: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.statuses_count,
                                                    is_blue: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.is_blue_verified,
                                                    location: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.location,
                                                    account_create_date: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.created_at
                                                }
                                            }
                                        }
                                        const media_info = {
                                            type: media_info_obj[index].type,
                                            duration_ms: media_info_obj[index].video_info.duration_millis,
                                            video_raw: media_info_obj[index].video_info.variants.at(-1),
                                            video_source_user_info: media_source_user_data
                                        }
                                        video_info.push(media_info);
                                    }
                                    if (media_info_obj[index].type == "animated_gif") {
                                        const media_info = {
                                            type: media_info_obj[index].type,
                                            duration_ms: null,
                                            video_raw: media_info_obj[index].video_info.variants.at(-1),
                                            video_source_user_info: null
                                        }
                                        video_info.push(media_info);
                                    }
                                }
                                if (video_info.length == 0) {
                                    video_info = null;
                                }
                            } else {
                                video_info = null;
                            }
                            //ツイート情報オブジェクト生成
                            let is_other_root_tweet = false;
                            let is_reply_other = false;
                            let reply_user_data_other_obj = null;
                            let other_twitter_card_obj = null;
                            let other_twitter_card_unified_obj = null;
                            let other_out_urls = null;
                            let other_blocked_by_flag = false;
                            let other_quoted_obj = null;
                            let other_quoted_urls = null;
                            let other_quoted_blocked_by_flag = false;
                            if (tweet_info_other?.permalink == location.pathname) {
                                is_other_root_tweet = true;
                            }
                            if (tweet_info_other?.in_reply_to_status_id_str != undefined) {
                                is_reply_other = true;
                                reply_user_data_other_obj = {
                                    user_id: tweet_info_other?.in_reply_to_user.id_str,
                                    scr_name: tweet_info_other?.in_reply_to_user.screen_name
                                }
                            }
                            if (tweet_info_other?.card?.binding_values?.domain?.string_value != undefined) {
                                other_twitter_card_obj = {
                                    domain: tweet_info_other?.card.binding_values.domain.string_value
                                }
                            }
                            //twittercard動画付オブジェクト
                            if (tweet_info_other?.card?.binding_values?.unified_card?.string_value) {
                                other_twitter_card_unified_obj = JSON.parse(tweet_info_other?.card?.binding_values?.unified_card?.string_value)
                            }
                            if (tweet_info_other?.entities?.urls?.length != 0) {
                                other_out_urls = tweet_info_other?.entities.urls;
                            }
                            if (tweet_info_other?.user.blocked_by) {
                                other_blocked_by_flag = true;
                            }
                            //引用オブジェクト
                            if (tweet_info_other?.quoted_status != undefined) {
                                if (tweet_info_other?.quoted_status.entities?.urls?.length != 0) {
                                    other_quoted_urls = tweet_info_other?.quoted_status.entities.urls;
                                }
                                if (tweet_info_other?.quoted_status.user.blocked_by) {
                                    other_quoted_blocked_by_flag = true;
                                }
                                other_quoted_obj = {
                                    text: tweet_info_other?.quoted_status.full_text,
                                    mentions: tweet_info_other?.quoted_status.entities?.user_mentions ?? null,
                                    possibly_sensitive: tweet_info_other?.quoted_status.possibly_sensitive,
                                    possibly_sensitive_editable: tweet_info_other?.quoted_status.possibly_sensitive_editable,
                                    "quoted_urls": other_quoted_urls,
                                    tweet_lang: tweet_info_other?.quoted_status.lang,
                                    content_disclosure: tweet_info_other?.quoted_status?.content_disclosure ?? null,
                                    user_data: {
                                        name: tweet_info_other?.quoted_status.user.name,
                                        description: tweet_info_other?.quoted_status.user.description,
                                        user_id: tweet_info_other?.quoted_status.user.id_str,
                                        scr_name: tweet_info_other?.quoted_status.user.screen_name,
                                        all_tweet_count: tweet_info_other?.quoted_status.user.statuses_count,
                                        is_blue: tweet_info_other?.quoted_status.user.is_blue_verified,
                                        location: tweet_info_other?.quoted_status.user.location,
                                        account_create_date: tweet_info_other?.quoted_status.user.created_at,
                                        blocked_by: other_quoted_blocked_by_flag
                                    }
                                }
                            }
                            const tweetinfo_attr_other = {
                                is_root_tweet: is_other_root_tweet,
                                mentions: tweet_info_other?.entities?.user_mentions ?? null,
                                text: tweet_info_other?.text,
                                tweet_id: tweet_info_other?.id_str,
                                tweet_client: tweet_info_other?.source_name,
                                is_reply: is_reply_other,
                                is_user_data_only: false,
                                tweet_lang: tweet_info_other?.lang,
                                is_promoted: is_promo_tweet,
                                grok_share_attachment: tweet_info_other?.grok_share_attachment ?? null,
                                content_disclosure: tweet_info_other?.content_disclosure ?? null,
                                user_data: {
                                    name: tweet_info_other?.user.name,
                                    description: tweet_info_other?.user.description,
                                    user_id: tweet_info_other?.user.id_str,
                                    scr_name: tweet_info_other?.user.screen_name,
                                    all_tweet_count: tweet_info_other?.user.statuses_count,
                                    is_blue: tweet_info_other?.user.is_blue_verified,
                                    location: tweet_info_other?.user.location,
                                    account_create_date: tweet_info_other?.user.created_at,
                                    blocked_by: other_blocked_by_flag
                                },
                                in_reply_user_data: reply_user_data_other_obj,
                                tweet_video_info: video_info,
                                "quoted_obj": other_quoted_obj,
                                "tw_card_obj": other_twitter_card_obj,
                                "tw_card_unified_obj": other_twitter_card_unified_obj,
                                "attached_urls": other_out_urls,
                            };
                            //const target_root_elem_other = tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]');
                            //target_root_elem_other.setAttribute("opd_tweet_info", JSON.stringify(tweetinfo_attr_other));
                            opd_tweet_info = tweetinfo_attr_other;
                        }
                        break;
                    case 'communities':
                        const tweet_info_communities = get_tw_userdata(tweet_elem[tweet_index], "reply");
                        if (tweet_info_communities != undefined) {
                            //報告用JSON生成
                            let is_media_tweet = false;
                            let is_promo_tweet = false;
                            if (tweet_info_communities.extended_entities?.media != undefined) {
                                is_media_tweet = true;
                            }
                            if (tweet_info_communities.promoted_content != undefined) {
                                is_promo_tweet = true;
                            }
                            //動画情報取り出し
                            if (is_media_tweet) {
                                const media_info_obj = tweet_info_communities.entities?.media;
                                //console.log(media_info_obj)
                                for (let index = 0; index < media_info_obj.length; index++) {
                                    if (media_info_obj[index].type == "video") {
                                        //console.log(media_info_obj[index])
                                        let media_source_user_data = null;
                                        if (media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy != undefined) {
                                            media_source_user_data = {
                                                user_data: {
                                                    name: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.name,
                                                    description: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.description,
                                                    user_id: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.id_str,
                                                    scr_name: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.screen_name,
                                                    all_tweet_count: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.statuses_count,
                                                    is_blue: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.is_blue_verified,
                                                    location: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.location,
                                                    account_create_date: media_info_obj[index].additional_media_info?.source_user?.user_results?.result?.legacy?.created_at
                                                }
                                            }
                                        }
                                        const media_info = {
                                            type: media_info_obj[index].type,
                                            duration_ms: media_info_obj[index].video_info.duration_millis,
                                            video_raw: media_info_obj[index].video_info.variants.at(-1),
                                            video_source_user_info: media_source_user_data
                                        }
                                        video_info.push(media_info);
                                    }
                                    if (media_info_obj[index].type == "animated_gif") {
                                        const media_info = {
                                            type: media_info_obj[index].type,
                                            duration_ms: null,
                                            video_raw: media_info_obj[index].video_info.variants.at(-1),
                                            video_source_user_info: null
                                        }
                                        video_info.push(media_info);
                                    }
                                }
                                if (video_info.length == 0) {
                                    video_info = null;
                                }
                            } else {
                                video_info = null;
                            }
                            //ツイート情報オブジェクト生成
                            let is_reply_communities = false;
                            let reply_user_data_communities_obj = null;
                            let communities_twitter_card_obj = null;
                            let communities_twitter_card_unified_obj = null;
                            let communities_out_urls = null;
                            if (tweet_info_communities?.in_reply_to_status_id_str != undefined) {
                                is_reply_communities = true;
                                reply_user_data_communities_obj = {
                                    name: tweet_info_communities?.in_reply_to_user.name,
                                    user_id: tweet_info_communities?.in_reply_to_user.id_str,
                                    scr_name: tweet_info_communities?.in_reply_to_user.screen_name,
                                    all_tweet_count: tweet_info_communities?.in_reply_to_user.statuses_count,
                                    is_blue: tweet_info_communities?.in_reply_to_user.is_blue_verified,
                                    location: tweet_info_communities?.in_reply_to_user.location,
                                    account_create_date: tweet_info_communities?.in_reply_to_user.created_at
                                }
                            }
                            if (tweet_info_communities?.card?.binding_values?.domain?.string_value != undefined) {
                                communities_twitter_card_obj = {
                                    domain: tweet_info_communities?.card.binding_values.domain.string_value
                                }
                            }
                            if (tweet_info_communities?.card?.binding_values?.unified_card?.string_value) {
                                communities_twitter_card_unified_obj = JSON.parse(tweet_info_communities?.card?.binding_values?.unified_card?.string_value)
                            }
                            if (tweet_info_communities?.entities?.urls?.length != 0) {
                                communities_out_urls = tweet_info_communities?.entities.urls;
                            }
                            const tweetinfo_attr_communities = {
                                is_root_tweet: false,
                                mentions: tweet_info_communities?.entities?.user_mentions ?? null,
                                text: tweet_info_communities?.text,
                                tweet_id: tweet_info_communities?.id_str,
                                tweet_client: tweet_info_communities?.source_name,
                                is_promoted: is_promo_tweet,
                                is_reply: is_reply_communities,
                                is_user_data_only: false,
                                grok_share_attachment: tweet_info_communities?.grok_share_attachment ?? null,
                                content_disclosure: tweet_info_communities?.content_disclosure ?? null,
                                user_data: {
                                    name: tweet_info_communities?.user.name,
                                    user_id: tweet_info_communities?.user.id_str,
                                    scr_name: tweet_info_communities?.user.screen_name,
                                    all_tweet_count: tweet_info_communities?.user.statuses_count,
                                    is_blue: tweet_info_communities?.user.is_blue_verified,
                                    location: tweet_info_communities?.user.location,
                                    account_create_date: tweet_info_communities?.user.created_at
                                },
                                in_reply_user_data: reply_user_data_communities_obj,
                                tweet_video_info: video_info,
                                "tw_card_obj": communities_twitter_card_obj,
                                "tw_card_unified_obj": communities_twitter_card_unified_obj,
                                "attached_urls": communities_out_urls,
                            };
                            //const target_root_elem_communities = tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]');
                            //target_root_elem_communities.setAttribute("opd_tweet_info", JSON.stringify(tweetinfo_attr_communities));
                            opd_tweet_info = tweetinfo_attr_communities;
                        }
                        break;
                    case 'settings_block_mute':
                        const block_mute_list_userid = get_tw_userdata(tweet_elem[tweet_index], "settings_block_mute_user_id");
                        tweet_elem[tweet_index].setAttribute("opd_block_mute_list_user_id", block_mute_list_userid);
                        //console.log(block_mute_list_userid)
                        break;
                    default:
                        //tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("opd_tweet_info", JSON.stringify({ status: null }));
                        break;
                }
                tweet_elem[tweet_index].setAttribute("opd_tweet_process", "ok");
            } else {
                tweet_elem[tweet_index].setAttribute("opd_tweet_process", "ok");
            }

            //表示処理
            if (opd_tweet_info) {
                if (OPD_SETTINGS.is_hide_promotion && opd_tweet_info.is_promoted) {
                    tweet_elem[tweet_index].closest('[data-testid="cellInnerDiv"]').setAttribute("opd_hide_tweet", "");
                }
            }
        }
    });
    tweet_obs.observe(root_elem, {
        childList: true,
        subtree: true
    });
})();