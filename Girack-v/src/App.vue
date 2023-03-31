<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, dataChannel, dataUser, dataMsg, backendURI, Serverinfo } from "./socket.js";
import Auth from "./components/Auth.vue";
import Sidebar from "./components/Sidebar.vue";

</script>

<script>

const { Userinfo } = dataUser();
const { MsgReadTime } = dataMsg();
const { ChannelIndex } = dataChannel();
import { useTheme } from 'vuetify';
const socket = getSocket();

export default {
    setup() {
        const theme = useTheme();
        return { theme };
        
    },

    components: { Sidebar, Auth },
    
    data() {
        return {
            //css用クラス
            channelBar: "channelBar", //左のチャンネルバーとか
            main: "main", //右のチャンネル表示するところ

            servername: "",
            displayusername: "Null",
            sessionOnlineNum: 0,

            path: "",
            loggedin: false,
            channelJoined: [],
            uri: backendURI,
        }

    },

    watch: {
        //URLの変更を検知
        $route(r) {
            this.path = r.path; //変数へ取り込む

        },
    },

    methods: {
        //新着メッセージ数を返す
        checkReadTime(channelid, term) { //term => ほしい値
            try {
                //termの値で返すものを選ぶ
                switch(term) {
                    case "new":
                    return MsgReadTime.value[channelid].new; //新着数を返す

                    case "mention":
                        return MsgReadTime.value[channelid].mention; //メンション数を返す

                }
            }
            catch(e) {
                return null;
            }
        }
    },

    mounted() {
        //console.log("vuetify :: global theme theme -> " + theme.global.name.value);
        socket.emit("getInitInfo"); //サーバーの情報を取得

    }

}

</script>

<template>
    <div>

        <!-- ログイン後(Main) -->
        <div v-if="loggedin">
            <Sidebar />
            <div :class="main">
                <RouterView />
            </div>
        </div>

        <!-- ログイン前 -->
        <div v-else>
            <Auth @login="() => loggedin = true" />
        </div>

    </div>

</template>

<style scoped>

.main
{
    position: absolute;
    right: 0;
    top: 0;

    width: 80vw;
    height: 100vh;
}

</style>

<style>

html
{
    background: #1C1B1F;
    overflow-y: hidden !important;
    font-family: "Noto Sans CJK JP", "BIZ UDPGothic" !important;
}

a
{
  text-decoration: none;
  transition: 0.4s;
  color: #ede7f6;
}

a:visited
{
  text-decoration: none;
  color: #ede7f6;
}

</style>