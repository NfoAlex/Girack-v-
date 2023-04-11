<script>

import { dataUser, dataMsg, dataChannel, getSocket, getMessage } from '../../socket.js';
import { ref } from "vue";

const socket = getSocket();


//返信モード
const ReplyState = ref({
    isReplying: false,
    messageid: "0"
});

export function getReplyState() {
    return { ReplyState };

}

export default {

    setup() {
        const { ReplyState } = getReplyState();
        const { Userinfo } = dataUser();
        const { ChannelIndex } = dataChannel();
        const { MsgDB, UserIndex } = dataMsg();

        return { ReplyState, Userinfo, ChannelIndex, MsgDB, UserIndex };

    },
    
    data() {
        return {
            txt: "",
            channelid: "",

            contentDisplay: {
                username: "",
                content: ""
            }
        }
    },

    watch: {
        ReplyState: {
            handler() {
                console.log("Input :: watch(ReplyState) : うおお", ReplyState.value);
                this.getMessage();

            },
            deep: true
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
                userid: this.Userinfo.userid, //名前
                channelid: this.getPath, //チャンネルID
                sessionid: this.Userinfo.sessionid, //セッションID);
                replyData: { //返信データ
                    isReplying: ReplyState.value.isReplying, //これは返信かどうか
                    messageid: (ReplyState.value.isReplying)?ReplyState.value.messageid:null, //返信先のメッセージID
                },
                content: this.txt //メッセージの本文
            });
            
            this.txt = ""; //入力欄を空に
            console.log("--- msg sent ---");

            this.resetReply(); //返信状態を初期化

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

        //返信状態を初期化して閉じる
        resetReply() {
            ReplyState.value.isReplying = false;
            ReplyState.value.messageid = "0";

        },
        
        //履歴からメッセージを取得
        getMessage() {
            //今いるチャンネルの履歴を取得
            let MsgDBHere = this.MsgDB[this.getPath];

            console.log("Input getMessage : using ", MsgDBHere);

            //履歴から一致するメッセージIDのものを探す
            for ( let index in MsgDBHere ) {
                //一致していたら表示用変数へ取り込む
                if ( MsgDBHere[index].messageid === ReplyState.value.messageid ) {
                    this.contentDisplay = {
                        username: this.UserIndex[MsgDBHere[index].userid].username, //名前
                        content: MsgDBHere[index].content //メッセージ本文
                    };
                    break;

                }

            }

        }
    },

}
</script>

<template>
    <div>

        <!-- 返信部分 -->
        <div class="d-flex align-center" style="margin:0 10%; margin-top:1%; width:90%;" v-if="ReplyState.isReplying">
            <v-icon class="ma-2">
                mdi:mdi-reply
            </v-icon>
            <p class="text-truncate">
                {{ contentDisplay.username }} :: {{ contentDisplay.content }}
            </p>
            <v-btn style="margin-left:8px;" class="rounded-lg" icon="" color="orange" size="x-small" @click="resetReply">
                <v-icon>
                    mdi:mdi-close
                </v-icon>
            </v-btn>
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