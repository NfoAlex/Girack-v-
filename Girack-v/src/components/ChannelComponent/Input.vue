<script setup>
import { getUserinfo, channelIndex, getSocket } from '../../socket.js';
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
                userid: getUserinfo().userid, //名前
                channelid: this.getPath, //チャンネルID
                sessionid: getUserinfo().sessionid, //セッションID);
                content: this.txt
            });
            this.txt = ""; //入力欄を空に
            console.log("sended ↓");
            //console.log(userinfo);
            // console.log({
            //     userid: userinfo.userid, //名前
            //     content: this.txt, //内容
            //     channelid: this.getPath, //チャンネルID
            //     sessionid: userinfo.sessionid
            // });

        },

        //Enterキー押されたときの処理
        funcEnter( event ) {
            let ref = this; //refsのエラー処理
            //入力欄にフォーカスされていてEnterキーが押された時
            if ( event.key === "Enter" && ref.$refs.inp.focused === true ) {
                this.msgSend(); //送信処理

            }

        },
        
        //チャンネル名を取得するだけ
        getChannelname() {
            try {
                return channelIndex[this.getPath].channelname;
            }
            catch (e) {
                setTimeout(this.$forceUpdate(), 1000);
                return "";
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

    },

    unmounted() {
        document.removeEventListener("keydown", this.funcEnter); //送信キーをブロック

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