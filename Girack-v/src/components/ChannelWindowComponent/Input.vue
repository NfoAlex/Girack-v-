<script setup>
import { dataUser, dataChannel, getSocket } from '../../socket.js';
import { ref } from "vue";
</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser();
const { ChannelIndex } = dataChannel();

//返信モード
const ReplyState = ref({
    isReplying: false,
    messageid: "0"
});

export function getReplyState() {
    return { ReplyState };

}

export default {
    
    data() {
        return {
            txt: "",
            channelid: "",
        }
    },

    computed: {
        //現在のパスからチャンネルのID返すだけ
        getPath() {
            return this.$route.params.id; //パス
        }
    },

    methods: {
        //メッセージを送信する
        msgSend( event, btn ) {
            //送信の初期判定
            if ( btn !== "byBtn" ) { //ボタンからの送信？
                //変換中のEnter検知を外す
                if ( event.keyCode !== 13 ) return; //変換中のEnterなら処理させない

            }

            //送信ｨﾝ!
            socket.emit("msgSend", {
                userid: Userinfo.value.userid, //名前
                channelid: this.getPath, //チャンネルID
                sessionid: Userinfo.value.sessionid, //セッションID);
                isReply: false,
                content: this.txt //メッセージの本文
            });
            
            this.txt = ""; //入力欄を空に
            console.log("--- msg sent ---");

        },
        
        //チャンネル名を取得するだけ
        getChannelname() {
            try {
                return ChannelIndex.value[this.$route.params.id].channelname; //チャンネル名取得、返す
            }
            catch (e) { //読み込めなかったらとりあえず返す
                return "テキストチャンネル";
            }

        },

        resetReply() {
            ReplyState.value.isReplying = false;
            ReplyState.value.messageid = "0";

        }
    },

}
</script>

<template>
    <div>
        <div v-if="ReplyState.isReplying">
                返信する先 : {{ ReplyState.messageid }}
                <v-btn @click="resetReply">X</v-btn>
            </div>
        <div style="width:90%; height:fit-content;" class="mx-auto d-flex align-center">

            <v-container fill-height fluid class="d-flex">
                <v-text-field
                    style="height:fit-content"
                    ref="inp"
                    :placeholder="getChannelname() + 'へ送信'"
                    @keydown.enter="msgSend"
                    variant="solo"
                    density="compact"
                    clearable
                    v-model="txt"
                    :single-line="true"
                >
                </v-text-field>
            
                <v-btn @click="msgSend(null,'byBtn')" icon="" size="small" class="rounded-lg" style="margin:0 1vw;" elevation="0" color="primary">
                    <v-icon icon="mdi:mdi-send-outline"></v-icon>
                    <v-tooltip
                        activator="parent"
                        location="top"
                    >
                        送信!
                    </v-tooltip>
                </v-btn>
        
            </v-container>
            
        </div>
    </div>

</template>