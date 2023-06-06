import { ref } from "vue";

//チャンネル情報
const ChannelIndex = ref({
    /*
    "0001": {
        channelname: "random",
        description: "Hello, Girack",
        scope: "public",
    }
    */
});

//チャンネルプレビュー用
const PreviewChannelData = ref({
    /*
    channelid: "0001",
    channelname: "random",
    description: "Hello Girack",
    scope: "public",
    previewmode: true
    */
});

//チャンネル情報を返すだけ
export function dataChannel() {
    return { ChannelIndex, PreviewChannelData };

}
