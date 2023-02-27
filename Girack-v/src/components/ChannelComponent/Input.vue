<script setup>
import { userinfo, channelIndex, getSocket } from '../../socket.js';
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiAccount } from '@mdi/js';
</script>

<script>
const socket = getSocket();

export default {
    components: {
        SvgIcon,
    },

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
                channelid: this.getPath, //チャンネルID
                sessionid: userinfo.sessionid //セッションID);
            });
            this.txt = ""; //入力欄を空に

        },
        //Enterキー押されたときの処理
        funcEnter( event ) {
            if ( event.key === "Enter" && this.$refs.inp.focused === true ) {
                this.msgSend(); //送信処理

            }

        },
        getChannelname() {
            return channelIndex[this.getPath].channelname;

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
    <div class="d-flex flex-row bg-surface-variant">
        <v-text-field
            ref="inp"
            :label="getChannelname() + 'へ送信'"
            variant="solo"
            style="margin:0 2% 0 5%;"
            clearable
            v-model="txt"
        ></v-text-field>
        <v-btn class="mdi mdi-send-outline" style="margin-right:1vw;" icon="" @click="msgSend" color="primary">
        </v-btn>
    </div>

</template>