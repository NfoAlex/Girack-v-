//config.js
//設定保存用

import { ref } from "vue";

//設定情報をサーバーと同期するかどうか
const CONFIG_SYNC = ref(true);

//通知設定
const CONFIG_NOTIFICATION = ref({
    ENABLE: true, //ブラウザ通知
    NOTIFY_ALL: false, //すべてを通知する
    NOTIFY_MENTION: true, //メンションを通知する
    
    DISPLAY_TAB_NEW: true, //タブに新着数を出す
    DISPLAY_TAB_MENTION: true, //タブにメンション数を出す
});

//通知をミュートするチャンネルとユーザーリスト
const LIST_NOTIFICATION_MUTE_CHANNEL = ref([]);
const LIST_NOTIFICATION_MUTE_USER = ref([]);

//UIに関する設定
const CONFIG_DISPLAY = ref({
    CONTENT_SHOW_ROLE: true,
    CONTENT_DATELINE_SHOWONLEFT: false,
    CONTENT_GOBOTTOMFAB_SHOW: false,
    CONTENT_SCROLL_AUTOFETCHHISTORY: true,
    CONTENT_SCROLL_ONNEWMESSAGE: true,
    CONTENT_DISPLAYIMAGESIZE: "5e6",
    SIDEBAR_SHOWREADALL_ENABLED: true,
    SIDEBAR_SHOWREADALL_BYHOLDSHIFTKEY: true,
});

//設定とデータを返す
export function getCONFIG() {
    return {
        CONFIG_SYNC,
        CONFIG_NOTIFICATION,
        LIST_NOTIFICATION_MUTE_CHANNEL,
        LIST_NOTIFICATION_MUTE_USER,
        CONFIG_DISPLAY
    };

}