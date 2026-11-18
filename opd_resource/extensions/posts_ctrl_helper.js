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
    //新クライアントなどで使えない場合はreturnする
    if (!root_elem) return;

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
                                if (tweet_info_reply?.in_reply_to_user) {
                                    reply_user_data_status_obj = {
                                        name: tweet_info_reply?.in_reply_to_user.name,
                                        user_id: tweet_info_reply?.in_reply_to_user.id_str,
                                        scr_name: tweet_info_reply?.in_reply_to_user.screen_name,
                                        all_tweet_count: tweet_info_reply?.in_reply_to_user.statuses_count,
                                        is_blue: tweet_info_reply?.in_reply_to_user.is_blue_verified,
                                        location: tweet_info_reply?.in_reply_to_user.location,
                                        account_create_date: tweet_info_reply?.in_reply_to_user.created_at
                                    }
                                } else {
                                    reply_user_data_status_obj = {
                                        name: null,
                                        user_id: tweet_info_reply?.in_reply_to_status_id_str,
                                        scr_name: tweet_info_reply?.in_reply_to_screen_name,
                                        all_tweet_count: null,
                                        is_blue: null,
                                        location: null,
                                        account_create_date: null
                                    }
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
                                if (tweet_info_other?.in_reply_to_user) {
                                    reply_user_data_other_obj = {
                                        user_id: tweet_info_other?.in_reply_to_user.id_str,
                                        scr_name: tweet_info_other?.in_reply_to_user.screen_name,
                                    }
                                } else {
                                    reply_user_data_other_obj = {
                                        user_id: tweet_info_other?.in_reply_to_user_id_str,
                                        scr_name: tweet_info_other?.in_reply_to_screen_name,
                                    }
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

//新クライアント用
//CSLT: cslt_tweet_ctrl_relay.js
(async () => {
    const OPD_SETTINGS = await opd_system.get_column_posts_settings("twitter");

    //新しいクライアント上で動作させているかを検出する
    const isNewClient = ['appEnv', 'appVersion'].some(key => key in document.documentElement.dataset);
    if (!isNewClient) {
        console.log("Use old client");
        return;
    }

    /* React Relay Environment 取得 */

    //Relay Environmentキャッシュ
    let _env = null;

    //各種ツイートキープレフィックス
    const TWEET_KEY_PREFIXES = [
        "tweet-",
        "promoted-tweet-",
        "profile-conversation-",
        "conversationthread-",
        "tweetdetailrelatedtweets-",
    ];

    //ReactFiber取得
    function getFiber(element) {
        const key = Object.keys(element).find((k) => k.startsWith("__reactFiber$"));
        return key ? element[key] : null;
    }

    //Fiberの中からRelay Environmentを取得する
    function findRelayEnv(obj, depth = 0, visited = new WeakSet()) {
        // 捜索の深さ6超えか、循環参照なら取得を打ち切る
        if (!obj || typeof obj !== "object" || depth > 6 || visited.has(obj))
            return null;

        visited.add(obj);

        if (typeof obj.getStore === "function" && typeof obj.lookup === "function")
            return obj;

        for (const key of Object.keys(obj)) {
            try {
                //子プロパティを再帰で探索する
                const found = findRelayEnv(obj[key], depth + 1, visited);
                if (found) return found;
            } catch { }
        }
        return null;
    }

    //Relay Environmentを取得する
    function getRelayEnv() {
        //キャッシュ済みならそのまま返す
        if (_env) return _env;

        //Fiberを探る対象を指定
        const rootTargets = [
            document.querySelector("main"),
            document.getElementById("react-root"),
            document.body,
        ];

        for (const target of rootTargets) {
            if (!target) continue;

            // DOM要素からFiberを取得
            let fiberNode = getFiber(target);

            while (fiberNode) {
                //Fiberの props/state/インスタンスの中を探す
                for (const propsSource of [
                    fiberNode.memoizedProps,
                    fiberNode.memoizedState,
                    fiberNode.stateNode,
                ]) {
                    const found = findRelayEnv(propsSource);

                    //見つかったらキャッシュ上で返す
                    if (found) {
                        _env = found;
                        return found;
                    }
                }

                //親Fiberへ遡る
                fiberNode = fiberNode.return;
            }
        }
        //見つからなかった場合
        return null;
    }

    /* React Relay クエリ参照 */

    //refのIDを使って、Relayストアからレコードを取得する
    function get(src, ref) {
        //refが存在しない場合はそのまま返す
        if (!ref) return ref;

        //__refが存在している場合はストアからレコードを取得する
        if (ref.__ref) {
            const resolved = src.get(ref.__ref);

            if (resolved) return resolved;

            return null;
        }

        //クエリ参照でなければそのまま返す
        return ref;
    }

    //複数のrefのIDを使って、ストアからレコードを取得する
    function getRefs(src, field) {
        //fieldが無い、または__refs配列を持っていなければ空配列
        if (!field || !Array.isArray(field.__refs)) return [];

        //各IDの参照先をストアから引いて、存在するものだけ返す
        const results = [];
        for (const id of field.__refs) {
            const record = src.get(id);

            if (record) results.push(record);
        }

        return results;
    }

    //Relay EnvironmentのStoreからRecordSourceを取得する
    function getSource() {
        const store = _env.getStore();
        return store.getSource();
    }

    /* 便利関数 */

    //Unix時間からUTC文字列に変換に変換する
    function msToUTC(ms) {
        if (!ms) return null;

        return new Date(ms).toUTCString();
    }

    //画像情報が含まれたオブジェクトからURLを取得
    function getImgUrl(image) {
        if (!image) {
            return null;
        }
        if (image.image_url) {
            return image.image_url;
        }
        if (image.url) {
            return image.url;
        }
        if (image.image_url_https) {
            return image.image_url_https;
        }
        return null;
    }

    /* センシティブ情報レコード取得 */

    // 添付メディアの閲覧注意警告の有無からセンシティブ判定する
    function isSensitive(src, rec) {
        const medias = getRefs(src, rec.media_entities2);
        for (let i = 0; i < medias.length; i++) {
            const media = medias[i];
            //警告レコードを取得
            let warning = get(src, media.sensitive_media_warning);

            //参照でない場合はそのまま
            if (!warning) {
                warning = media.sensitive_media_warning;
            }
            if (!warning) continue;

            // いずれかの警告フラグが立っていればセンシティブ
            if (warning.adult_content) return true;
            if (warning.graphic_violence) return true;
            if (warning.other) return true;
        }
        return false;
    }

    /* Card周りのオブジェクト取得 */

    function buildCardInfo(src, cardRef) {
        //カード情報レコードを取得
        const card = get(src, cardRef);
        if (!card) return { tw_card_obj: null, tw_card_unified_obj: null };

        //legacyフィールド内を探す
        const legacy = get(src, card.legacy);
        if (!legacy) return { tw_card_obj: null, tw_card_unified_obj: null };

        //binding_valuesの配列をオブジェクトに変換
        const bindings = {};
        const bindingList = getRefs(src, legacy.binding_values);
        for (let i = 0; i < bindingList.length; i++) {
            const binding = bindingList[i];

            // valueレコード取得
            let value = get(src, binding.value);
            if (!value) {
                value = binding.value;
            }

            //キーまたは値が無ければスキップ
            if (!value) continue;
            if (!binding.key) continue;

            if (value.type === "IMAGE") {
                //画像はさらにvalueレコードを取得する
                let imageValue = get(src, value.image_value);
                if (!imageValue) {
                    imageValue = value.image_value;
                }
                bindings[binding.key] = imageValue;
            } else {
                //画像以外でさらにvalue周りを取得
                if (value.string_value !== undefined && value.string_value !== null) {
                    bindings[binding.key] = value.string_value;
                } else if (
                    value.boolean_value !== undefined &&
                    value.boolean_value !== null
                ) {
                    bindings[binding.key] = value.boolean_value;
                } else {
                    bindings[binding.key] = value;
                }
            }
        }

        // TwitterCrad周りの情報を取得
        let tw_card_obj = null;
        if (bindings) {
            tw_card_obj = {
                domain: bindings.domain ?? null,
                card_url: bindings.card_url ?? null,
                description: bindings.description ?? null,
            };
        }

        // unified_card周りの情報を取得
        let tw_card_unified_obj = null;
        if (bindings.unified_card) {
            const unifiedCardValue = bindings.unified_card;
            //文字列ならJSONパースする。オブジェクトならそのまま
            if (typeof unifiedCardValue === "string") {
                try {
                    tw_card_unified_obj = JSON.parse(unifiedCardValue);
                } catch (e) {
                    //壊れたJSONが来ている場合は握りつぶす
                }
            } else {
                tw_card_unified_obj = unifiedCardValue;
            }
        }

        return {
            tw_card_obj: tw_card_obj,
            tw_card_unified_obj: tw_card_unified_obj,
        };
    }

    /* 動画情報を抽出 */

    function buildVideoInfo(src, mediaEntities) {
        const mediaList = getRefs(src, mediaEntities);
        if (mediaList.length === 0) return null;

        const result = [];
        for (let i = 0; i < mediaList.length; i++) {
            const media = mediaList[i];
            //動画メタ情報レコードを取得
            let videoInfo = get(src, media.video_info);
            if (!videoInfo) {
                videoInfo = media.video_info;
            }
            let type = media.type;

            if (type === "video" && videoInfo) {
                //動画の投稿元ユーザー情報レコードを取得
                let sourceUser = null;
                const additionalMediaInfo = get(src, media.additional_media_info);
                if (additionalMediaInfo) {
                    //動画の作成元情報レコードを取得
                    const sourceUserRef = get(src, additionalMediaInfo.source_user);
                    let sourceUserResults = null;
                    if (sourceUserRef) {
                        sourceUserResults = get(src, sourceUserRef.user_results);
                    }

                    //作成元ユーザー情報レコードを取得
                    let sourceUserRecord = null;
                    if (sourceUserResults) {
                        sourceUserRecord = get(src, sourceUserResults.result);
                    }

                    //ユーザー情報もレコードを取得してまとめる
                    if (sourceUserRecord) {
                        const sourceUserCore = get(src, sourceUserRecord.core);
                        const sourceUserBio = get(src, sourceUserRecord.profile_bio);
                        const sourceUserVerification = get(
                            src,
                            sourceUserRecord.verification,
                        );
                        const sourceUserLocation = get(src, sourceUserRecord.location);
                        sourceUser = {
                            user_data: {
                                name: sourceUserCore ? sourceUserCore.name : null,
                                description: sourceUserBio ? sourceUserBio.description : null,
                                user_id: sourceUserRecord.rest_id,
                                scr_name: sourceUserCore ? sourceUserCore.screen_name : null,
                                all_tweet_count: null,
                                is_blue:
                                    sourceUserVerification &&
                                        sourceUserVerification.is_blue_verified
                                        ? true
                                        : false,
                                location: sourceUserLocation
                                    ? sourceUserLocation.location
                                    : null,
                                account_create_date: null,
                            },
                        };
                    }
                }

                //解像度情報などを取得
                const variants = getRefs(src, videoInfo.variants);

                // 最高画質を採用
                const bestVariant =
                    variants.length > 0 ? variants[variants.length - 1] : null;

                result.push({
                    type: "video",
                    duration_ms: videoInfo.duration_millis,
                    video_raw: bestVariant,
                    video_source_user_info: sourceUser,
                });
            } else if (type === "animated_gif") {
                //GIFの情報を取得
                let gifVariants = [];
                if (videoInfo) {
                    gifVariants = getRefs(src, videoInfo.variants);
                }
                const bestGifVariant =
                    gifVariants.length > 0 ? gifVariants[gifVariants.length - 1] : null;

                result.push({
                    type: "animated_gif",
                    duration_ms: null,
                    video_raw: bestGifVariant,
                    video_source_user_info: null,
                });
            }
        }

        if (result.length === 0) {
            return null;
        }
        return result;
    }

    /* ユーザー情報周りのオブジェクト取得 */

    function extractUser(src, rec, userRef) {
        //ユーザー情報全体のレコードを取得
        const resolvedUserRef = get(src, userRef);
        let userResults = null;
        if (resolvedUserRef && resolvedUserRef.user_results) {
            userResults = get(src, resolvedUserRef.user_results);
        }

        //Userレコード本体を取得
        let userRecord = null;
        if (userResults && userResults.result) {
            userRecord = get(src, userResults.result);
        }

        //ユーザーが見つからない場合
        if (!userRecord) return { user: null, userData: null };

        /* 各サブフィールドのレコードを取得 */

        //名前/screen_name/作成日時
        const core = get(src, userRecord.core);

        //認証バッジ情報
        const verification = get(src, userRecord.verification);

        //ユーザー設定ロケーション
        const location = get(src, userRecord.location);

        //自己紹介文
        const bio = get(src, userRecord.profile_bio);

        //ツイート数
        const tweetCounts = get(src, userRecord.tweet_counts);

        //フォロー/フォロワー数
        const relationshipCounts = get(src, userRecord.relationship_counts);

        //鍵アカウント情報
        const privacy = get(src, userRecord.privacy);

        //アイコン画像URLを取得
        const avatarRef = get(src, userRecord.avatar);
        const profileImageUrl = getImgUrl(avatarRef);

        //ヘッダー画像URLを取得
        const bannerRef = get(src, userRecord.banner);
        const profileBannerUrl = getImgUrl(bannerRef);

        //取得した情報をCSLTで扱えるユーザーオブジェクトにまとめる
        const userData = {
            name: core ? core.name : null,
            description: bio ? bio.description : null,
            user_id: userRecord.rest_id,
            scr_name: core ? core.screen_name : null,
            all_tweet_count:
                tweetCounts && tweetCounts.tweets !== undefined
                    ? tweetCounts.tweets
                    : null,
            is_blue: verification && verification.is_blue_verified ? true : false,
            location: location ? location.location : null,
            account_create_date: core ? msToUTC(core.created_at_ms) : null,
            possibly_sensitive:
                userRecord.possibly_sensitive !== undefined
                    ? userRecord.possibly_sensitive
                    : null,
            protected: privacy && privacy.protected ? true : false,
            followers_count:
                relationshipCounts && relationshipCounts.followers !== undefined
                    ? relationshipCounts.followers
                    : null,
            friends_count:
                relationshipCounts && relationshipCounts.following !== undefined
                    ? relationshipCounts.following
                    : null,
            profile_image_url_https: profileImageUrl,
            profile_banner_url: profileBannerUrl,
            // 現時点で取得不能(将来ストアから取れるようになったら実装する)
            blocked_by: null,
            // ログイン時のみ値が入るはず...
            following:
                userRecord.is_following !== undefined ? userRecord.is_following : null,
        };

        return {
            user: userRecord,
            userData: userData,
        };
    }

    /* 投稿情報取得 */

    function toLegacyFormat(src, rec) {
        if (!rec) return null;

        //ツイート詳細レコードを取得
        let details = get(src, rec.details);
        if (!details) {
            details = {};
        }

        //ユーザー情報を取り出す
        const extracted = extractUser(src, rec, rec.core);
        const user = extracted.user;
        const userData = extracted.userData;

        //本文テキスト取得
        //長文ツイート(note_tweet)があればそちらを優先
        let text = details.full_text; //デフォルトは通常のfull_text
        const note = get(src, rec.note_tweet);
        if (note) {
            const noteResults = get(src, note.note_tweet_results);
            if (noteResults && noteResults.result) {
                const noteData = get(src, noteResults.result);
                if (noteData && noteData.text) {
                    // 長文があればそちらを使う
                    text = noteData.text;
                }
            }
        }

        //TwitterCardなどの情報を取得
        const cardInfo = buildCardInfo(src, rec.card);

        //本文中のURL一覧を取得
        const urls = getRefs(src, rec.url_entities);

        //引用の情報を取得
        let quoted_obj = null;
        if (rec.quoted_tweet_results) {
            // 引用の情報を取得する
            const quotedTweetResults = get(src, rec.quoted_tweet_results);
            let quotedResult = null;
            if (quotedTweetResults) {
                quotedResult = get(src, quotedTweetResults.result);
            }

            //引用の可視情報を取得
            let quotedTweet = quotedResult;
            if (
                quotedResult &&
                quotedResult.__typename === "TweetWithVisibilityResults"
            ) {
                quotedTweet = get(src, quotedResult.tweet);
            }

            //引用情報を従来の形式に変換
            if (quotedTweet && quotedTweet.__typename === "Tweet") {
                const quotedInfo = toLegacyFormat(src, quotedTweet);
                if (quotedInfo) {
                    quoted_obj = {
                        text: quotedInfo.text,
                        mentions: quotedInfo.mentions,
                        possibly_sensitive: quotedInfo.possibly_sensitive,
                        possibly_sensitive_editable: false,
                        quoted_urls: quotedInfo.attached_urls,
                        tweet_lang: quotedInfo.tweet_lang,
                        content_disclosure: quotedInfo.content_disclosure,
                        user_data: quotedInfo.user_data,
                    };
                }
            }
        }

        //メディア添付があるか
        const isMedia = getRefs(src, rec.media_entities2).length > 0;

        //広告の投稿を検出する
        const isPromoted = promotedSet.has(rec.rest_id);

        // ツイートへのパーマリンクパス
        let permalink = null;
        if (userData) {
            permalink = `/${userData.scr_name}/status/${rec.rest_id}`;
        }

        //コミュニティノート等の情報
        let contentDisclosure = get(src, rec.content_disclosure);
        if (!contentDisclosure) {
            contentDisclosure = null;
        }

        return {
            is_root_tweet: permalink === location.pathname,
            mentions: getRefs(src, rec.mention_entities),
            text: text,
            tweet_id: rec.rest_id,
            //現時点で取得不能(将来ストアから取れるようになったら取得できるようにする)
            tweet_client: null,
            is_reply: rec.reply_to_results ? true : false,
            is_user_data_only: false,
            //現時点で取得不能(同上)
            tweet_lang: null,
            is_promoted: isPromoted,
            grok_share_attachment: rec.grok_share_attachment
                ? rec.grok_share_attachment
                : null,
            content_disclosure: contentDisclosure,
            //メディアの警告フラグから判定する
            possibly_sensitive: isSensitive(src, rec),
            user_data: userData,
            tweet_video_info: buildVideoInfo(src, rec.media_entities2),
            quoted_obj: quoted_obj,
            tw_card_obj: cardInfo.tw_card_obj,
            tw_card_unified_obj: cardInfo.tw_card_unified_obj,
            attached_urls: urls.length > 0 ? urls : null,
        };
    }

    /* ユーザー情報単体を取得(フォロー・フォロワー欄等で使用) */
    function toUserOnlyFormat(src, userRec) {
        if (!userRec) return null;

        //ユーザー情報と認証済情報を取得
        const core = get(src, userRec.core);
        const verification = get(src, userRec.verification);

        //ユーザーID
        let userId = userRec.rest_id;
        if (!userId) {
            userId = "";
        }

        //スクリーンネーム
        let screenName = "";
        if (core && core.screen_name) {
            screenName = core.screen_name;
        }

        //認証付き情報
        let isBlue = false;
        if (verification && verification.is_blue_verified) {
            isBlue = true;
        }

        return {
            is_reply: false,
            is_user_data_only: true,
            user_data: {
                name: core ? core.name : null,
                user_id: userId,
                scr_name: screenName,
                all_tweet_count: null,
                is_blue: isBlue,
            },
            report_json: null,
        };
    }

    /* プロモーションの投稿のIDを収集する */
    const promotedSet = new Set();

    //ツイート再捜索時の負荷軽減のためにキャッシュする
    const _scopedTweetResults = new Map();

    //promoted_metadataを持つレコードからプロモツイートのIDを収集する
    function collectPromotedIds() {
        if (!_env) return;
        const src = getSource();

        //ストア内の全レコードIDを列挙
        let ids;
        if (src.getRecordIDs) {
            ids = src.getRecordIDs();
        } else {
            ids = Object.keys(src.toJSON());
        }

        for (let i = 0; i < ids.length; i++) {
            const rec = src.get(ids[i]);
            if (!rec) continue;
            if (!rec.promoted_metadata) continue;

            //promoted_metadataを持つレコードからツイートIDを辿って収集する
            const tweetResults = get(src, rec.tweet_results);
            if (!tweetResults) continue;

            const tweetRecord = get(src, tweetResults.result);
            const restId = tweetResults.rest_id ?? tweetRecord?.rest_id;
            if (restId) {
                promotedSet.add(restId);
            }
        }
    }

    //ツイートIDからストアのレコードを直接引いて従来形式の情報オブジェクトを返す
    function lookupTweet(tweetId) {
        if (!_env) return null;

        try {
            const src = getSource();

            //TweetResultsからツイートレコードを引く
            //正規化されていないポストはクエリごとの記録(…:TweetResults:ID)に入っているので、それも探す
            let tweetResults = src.get("TweetResults:" + tweetId);
            if (!tweetResults) {
                let scopedId = _scopedTweetResults.get(tweetId);
                if (!scopedId) {
                    scopedId = src.getRecordIDs().find((recordId) => recordId.endsWith(":TweetResults:" + tweetId));
                    if (scopedId) _scopedTweetResults.set(tweetId, scopedId);
                }
                tweetResults = scopedId ? src.get(scopedId) : null;
            }
            if (!tweetResults) return null;

            let rec = get(src, tweetResults.result);

            //可視性の制限がかかったポストは、tweet フィールドの中に本体がある
            if (rec && rec.__typename === "TweetWithVisibilityResults") {
                rec = get(src, rec.tweet);
            }
            if (!rec) return null;
            if (rec.__typename !== "Tweet") return null;

            return toLegacyFormat(src, rec);
        } catch (e) {
            //取得失敗時は無視
        }
        return null;
    }

    /* DOMからでしか取れない情報を取得 */
    //ツイートのDOMにあるFiberからツイートIDを探す
    function getTweetId(element) {
        const fiber = getFiber(element);
        if (!fiber) return null;

        const key = fiber.memoizedProps?.children?.key;
        if (typeof key !== "string") return null;

        const prefix = TWEET_KEY_PREFIXES.find((p) => key.startsWith(p));
        if (!prefix) return null;

        return key.slice(prefix.length).match(/^\d+/)?.[0] ?? null;
    }

    /* ログインユーザー情報を取得 */
    // undefined=未解決, null=解決したが取得できず
    let _myScreenName;
    let _myUserId;

    function resolveLoginIdentity() {
        //解決済みなら何もしない
        if (_myScreenName !== undefined) return;

        _myScreenName = null;
        _myUserId = null;

        /* 
        予備実装。
        非ログイン状態でしか調査できていないため、ここの辺りは動かないと思われる...
        TODO:本格的に展開された後に調査して実装する
        */
        //初期化スクリプトからscreen_nameを取得
        try {
            //このセレクタは従来のもののため、新しいものでは確実に動かないと思われる
            const script = document.querySelector(
                'script[type="text/javascript"][charset="utf-8"][nonce]',
            );
            if (script) {
                const match = script.textContent.match(/"screen_name":"(.*?)"/);
                if (match) {
                    _myScreenName = match[1];
                }
            }
        } catch (e) {
            //取得失敗は無視
        }

        //cookieからユーザーIDを取得（screen_nameが取れなかった場合の代替手段）
        try {
            const cookieMatch = document.cookie.match(/twid=u%3D(\d+)/);
            if (cookieMatch) {
                _myUserId = cookieMatch[1];
            }
        } catch (e) {
            // 取得失敗は無視
        }
    }

    //自分のツイートか判定する
    function isOwnTweet(userData) {
        resolveLoginIdentity();
        // screen_name で一致判定
        if (_myScreenName && userData && userData.scr_name === _myScreenName) {
            return true;
        }
        // user_id で一致判定（screen_nameが取れなかった場合用）
        if (_myUserId && userData && userData.user_id === _myUserId) {
            return true;
        }
        return false;
    }

    // 投稿などのデータをJSON文字列で属性に埋め込む
    function attachTweetInfo(element, info) {
        element.setAttribute("opd_tweet_info", JSON.stringify(info));

        // フォロー中フラグ
        if (info.user_data && info.user_data.following) {
            element.setAttribute("opd_tweet_info_following_flag", "true");
        }
        // 自分のツイートフラグ
        if (isOwnTweet(info.user_data)) {
            element.setAttribute("opd_tweet_info_mytweet_flag", "true");
        }
        // Blueバッジフラグ
        if (info.user_data && info.user_data.is_blue) {
            element.setAttribute("opd_tweet_info_isblue_flag", "true");
        }
    }

    //表示されているツイートから各種情報を取得して各DOM属性に情報を埋め込む
    function processArticles() {
        if (!_env) return;

        //プロモツイートIDを収集
        collectPromotedIds();

        //レンダリングされた未処理の投稿をまとめて取得する
        const tweets = document.querySelectorAll("main div ul li:not([opd_tweet_info])");

        for (let i = 0; i < tweets.length; i++) {
            const tweet = tweets[i];

            const tweetId = getTweetId(tweet);
            if (!tweetId) continue;

            //同じポストで判定済みなら再処理しない
            if (tweet.getAttribute("opd_checked_id") === tweetId) continue;

            //広告のキー(promoted-tweet-)はストアに頼らずそのまま広告として扱う
            const tweetKey = getFiber(tweet)?.memoizedProps?.children?.key;
            if (OPD_SETTINGS.is_hide_promotion && tweetKey?.startsWith("promoted-tweet-")) {
                tweet.setAttribute("opd_hide_tweet", "");
                tweet.setAttribute("opd_checked_id", tweetId);
                continue;
            }

            const info = lookupTweet(tweetId);
            if (!info) continue;
            tweet.setAttribute("opd_checked_id", tweetId);

            //広告除去に回す
            if (OPD_SETTINGS.is_hide_promotion && info.is_promoted) {
                tweet.setAttribute("opd_hide_tweet", "");
            }
        }
    }

    /* 情報抽出機能を起動する */
    let _processScheduled = false;
    let _ready = false;
    let _retries = 0;

    //起動
    function boot() {
        // Relay Environmentを探す
        const env = getRelayEnv();
        if (!env) {
            return false;
        }

        _ready = true;

        //起動時点で既にストアにあるプロモツイートIDを収集
        collectPromotedIds();

        processArticles();

        console.log("CSLT Relay Adapter: Ready");
        return true;
    }

    //Relay Environmentが見つかるまで起動をリトライ
    function tryBoot() {
        _retries++;
        //見つかったら終了
        if (boot()) return;
        //40回リトライしても見つからなければ諦める
        if (_retries > 40) {
            console.warn("CSLT Relay Adapter: Relay Environment not found");
            return;
        }

        //まだ見つからなければ次のリトライを予約
        setTimeout(tryBoot, 500);
    }
    setTimeout(tryBoot, 500);

    const mutationObserver = new MutationObserver(function () {
        // Relay Environmentがまだ見つかっていなければ何もしない
        if (!_ready) return;

        // 既に次フレームでの実行が予約済みならスキップ
        if (_processScheduled) return;
        _processScheduled = true;

        //1フレームにつき最大1回だけ抽出を行う
        requestAnimationFrame(function () {
            _processScheduled = false;
            processArticles();
        });
    });
    // ターゲットのDOM変更を監視
    mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
})();