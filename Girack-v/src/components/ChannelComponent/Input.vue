<script setup>
import { dataUser, dataChannel, getSocket } from '../../socket.js';
</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser();
const { ChannelIndex } = dataChannel();

export default {
    
    data() {
        return {
            txt: "",
            channelid: "",
        }
    },

    methods: {
        //メッセージを送信する
        msgSend( event ) {
            //変換中のEnter検知を外す
            if ( event.keyCode !== 13 ) return;

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
        
        //チャンネル名を取得するだけ
        getChannelname() {
            try {
                return ChannelIndex.value[this.$route.params.id].channelname; //チャンネル名取得、返す
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

}
</script>

<template>
    <div style="width:90%;" class="mx-auto d-flex justify-center ">
        <div class="" style="width:90%">
            <v-text-field
                ref="inp"
                :placeholder="getChannelname() + 'へ送信'"
                @keydown.enter="msgSend"
                variant="solo"
                density="compact"
                clearable
                v-model="txt"
            >
                
            </v-text-field>

        </div>


        <v-btn icon="" size="small" class="rounded-lg" style="margin:0 1vw;" elevation="0" @click="msgSend" color="primary">
            <v-icon icon="mdi:mdi-send-outline"></v-icon>
            <v-tooltip
                activator="parent"
                location="top"
            >
                送信!
            </v-tooltip>
        </v-btn>
        
        
        

    </div>

</template>