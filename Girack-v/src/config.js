//config.js
//設定保存用

import { ref } from "vue";

const CONFIG_CHANNEL = ref({
    NOTIFICATION_ENABLE: true,
    NOTIFICATION_NOTIFY_ALL: false,
    NOTIFICATION_NOTIFY_MENTION: false
});

export function getCONFIG() {
    return { CONFIG_CHANNEL };

}