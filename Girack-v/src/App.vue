<script setup>
import { RouterView } from 'vue-router';
import { getSocket } from "./socket.js";

import Auth from "./components/Auth.vue";
import Sidebar from "./components/Sidebar.vue";

</script>

<script>

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

            sessionOnlineNum: 0, //オンラインユーザー数

            path: "",
            loggedin: false,
        }

    },

    watch: {
        //URLの変更を検知
        $route(r) {
            this.path = r.path; //変数へ取り込む

        },
    },

    mounted() {
        socket.emit("getInitInfo"); //サーバーの情報を取得

        //オンラインユーザーの更新
        socket.on("sessionOnlineUpdate", (num) => {
            this.sessionOnlineNum = num;

        });

    }

}

</script>

<template>
    <div>

        <!-- ログイン後(Main) -->
        <div v-if="loggedin">
            <!-- サイドバー(オンラインユーザーの数を渡している) -->
            <Sidebar :sessionOnlineNum="sessionOnlineNum" />
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