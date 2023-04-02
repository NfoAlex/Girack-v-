//config.js
//設定保存用

import { ref } from "vue";

//通知設定
const CONFIG_NOTIFICATION = ref({
    ENABLE: true, //ブラウザ通知
    NOTIFY_ALL: false, //すべてを通知する
    NOTIFY_MENTION: true, //メンションを通知する
    
    DISPLAY_TAB_NEW: false, //タブに新着数を出す
    DISPLAY_TAB_MENTION: true, //タブにメンション数を出す
});

//通知をミュートするチャンネルとユーザーリスト
const LIST_NOTIFICATION_MUTE_CHANNEL = ref([]);
const LIST_NOTIFICATION_MUTE_USER = ref([]);

//UIに関する設定
const CONFIG_DISPLAY = ref({

});

//設定とデータを返す
export function getCONFIG() {
    return {
        CONFIG_NOTIFICATION,
        LIST_NOTIFICATION_MUTE_CHANNEL,
        LIST_NOTIFICATION_MUTE_USER
    };

}