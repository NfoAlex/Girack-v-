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
            searchMode: {
                enabled: false, //検索モードに入っているかどうか
                searchingTerm: "", //検索するもの("user" | "channel")
                indexStarting: 0 //検索を始めた文字数
            }
        }
    },

    watch: {
        //入力したテキストを監視して
        txt() {
            //@が入力されたら検索モードに入る
            if ( this.txt[this.txt.length-1] === "@" ) {
                this.searchMode.enabled = true;
                this.searchMode.indexStarting = this.txt.length-1;

            }

            //スペースが入力されたら検索モードを終了
            if ( this.txt[this.txt.length-1] === " " || this.txt[this.txt.length-1] === "　" ) {
                this.searchMode.enabled = false;

            }

            //検索モードに入っているなら検索する
            if ( this.searchMode.enabled ) {
                //検索文字列を取得
                let searchQuery = this.txt.substring(this.searchMode.indexStarting+1);

                console.log("Input :: watch(txt) : 検索する文字列 -> ", searchQuery);

            }

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
    <div>
        <div style="width:90%; height:fit-content;" class="mx-auto d-flex align-center">
            <v-container fill-height fluid class="d-flex">

                <v-menu
                    label="list"
                    location="top"
                >
                    <template v-slot:activator="{ props }">
                        <v-text-field
                            style="height:fit-content"
                            ref="inp"
                            :placeholder="getChannelname() + 'へ送信'"
                            @keydown.enter="msgSend"
                            variant="solo"
                            density="compact"
                            clearable
                            v-model="txt"
                            v-bind="props"
                            :single-line="true"
                        >
                        </v-text-field>
                    </template>

                    <v-list v-if="searchMode.enabled">
                        <v-list-item
                            v-for="i in ['alex', 'guest', 'guy']"
                        >
                            {{ i }}
                        </v-list-item>
                    </v-list>
                </v-menu>
            


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