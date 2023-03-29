//config.js
//設定保存用

import { ref } from "vue";

//通知設定
const CONFIG_NOTIFICATION = ref({
    ENABLE: true, //ブラウザ通知
    NOTIFY_ALL: false,
    NOTIFY_MENTION: false,

    DISPLAY_TAB_NEW: false,
    DISPLAY_TAB_MENTION: false,
});

//通知をミュートするチャンネルリスト
const LIST_NOTIFICATION_MUTE_CHANNEL = ref([]);
const LIST_NOTIFICATION_MUTE_USER = ref([]);

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