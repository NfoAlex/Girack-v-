<script setup>
import { dataUser, channelIndex, getSocket } from '../../socket.js';
</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser();

export default {
    
    data() {
        return {
            txt: "",
            channelid: ""
        }
    },

    methods: {
        //メッセージを送信する
        msgSend() {
            //送信ｨﾝ!
            socket.emit("msgSend", {
                userid: Userinfo.value.userid, //名前
                channelid: this.getPath, //チャンネルID
                sessionid: Userinfo.value.sessionid, //セッションID);
                content: this.txt //メッセージの本文
            });
            
            this.txt = ""; //入力欄を空に
            console.log("--- msg sent ---");

        },

        //Enterキー押されたときの処理
        funcEnter( event ) {
            let ref = this; //refsのエラー対策

            //入力欄にフォーカスされている中でEnterキーが押された時に送信する
            if ( event.key === "Enter" && ref.$refs.inp.focused === true ) {
                this.msgSend(); //送信処理

            }

        },
        
        //チャンネル名を取得するだけ
        getChannelname() {
            try {
                return channelIndex[this.getPath].channelname; //チャンネル名取得、返す
            }
            catch (e) { //読み込めなかったらとりあえず返す
                return "テキストチャンネル";
            }

        }
    },

    computed: {
        //現在のパスからチャンネルのID返すだけ
        getPath() {
            return this.$route.params.id; //パス
        }
    },

    mounted() {
        //送信(Enter)のためのキーボード入力の監視
        document.addEventListener("keydown", this.funcEnter, false);

    },

    unmounted() {
        //送信(Enter)のためのキーボードの入力監視をオフ
        document.removeEventListener("keydown", this.funcEnter);

    }
}
</script>

<template>
    <div class="d-flex flex-row bg-surface-variant">

        <v-text-field
            ref="inp"
            :placeholder="getChannelname() + 'へ送信'"
            variant="solo"
            style="margin:0 2% 0 5%;"
            clearable
            v-model="txt"
        ></v-text-field>

        <v-btn class="rounded-lg mdi mdi-send-outline" style="margin-right:1vw;" elevation="0" icon="" @click="msgSend" color="primary">
            <v-tooltip
                activator="parent"
                location="top"
            >
                送信!
            </v-tooltip>
        </v-btn>

    </div>

</template>