//config.js
//設定保存用

import { ref } from "vue";

const CONFIG_NOTIFICATION = ref({
    ENABLE: true,
    NOTIFY_ALL: false,
    NOTIFY_MENTION: false
});

const CONFIG_DISPLAY = ref({
    
});

export function getCONFIG() {
    return { CONFIG_NOTIFICATION };

}