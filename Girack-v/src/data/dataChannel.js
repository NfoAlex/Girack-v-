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

//チャンネルの順番データ
const ChannelOrder = ref({
    /*
    [
        "0001",
        "3928",
        "9182"
    ]
    */
});

//チャンネル情報を返すだけ
export function dataChannel() {
    return { ChannelIndex, PreviewChannelData, ChannelOrder };

}
