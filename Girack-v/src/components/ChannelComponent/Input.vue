<script setup>
import { userinfo, getSocket } from '../../socket.js';
</script>

<script>
const socket = getSocket();

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
            socket.emit("msgSend", {
                userid: userinfo.userid, //名前
                content: this.txt, //内容
                //content: Txt, //内容
                channelid: this.channelid, //チャンネルID
                sessionid: userinfo.sessionid //セッションID);
            });
            this.txt = ""; //入力欄を空に

        },
        //Enterキー押されたときの処理
        funcEnter( event ) {
            if ( event.key === "Enter" && this.$refs.inp.focused === true ) {
                this.msgSend(); //送信処理

            }

        }
    },

    computed: {
        getPath() {
            return this.$route.params.id;
        }
    },

    mounted() {
        document.addEventListener("keydown", this.funcEnter, false); //キー入力の検知
        this.channelid = this.getPath;

    }
}
</script>

<template>
    <!-- <v-text-field 
        label="テキスト"
        clearable
        style="margin:0 3%; width:80%"
    ></v-text-field> -->
    <v-text-field
        ref="inp"
        :label="$route.params.id + 'へ送信'"
        append-inner-icon="mdi-map-marker"
        variant="solo"
        style="margin:0 3%; width:80%;"
        v-model="txt"
    ></v-text-field>
    <v-btn icon="float-right mdi-send-outline" color="primary" />

</template>