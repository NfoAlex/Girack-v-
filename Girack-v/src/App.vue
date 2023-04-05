<script>
import { RouterView } from 'vue-router';
import { getSocket, dataUser } from "./socket.js";

import Auth from "./components/Auth.vue";
import Sidebar from "./components/Sidebar.vue";
import { useTheme } from 'vuetify';
const socket = getSocket();

export default {
    setup() {
        const theme = useTheme();
        const { Userinfo } = dataUser();

        return { theme, Userinfo };
        
    },

    components: { Sidebar, Auth },
    
    data() {
        return {
            //css用クラス
            channelBar: "channelBar", //左のチャンネルバーとか
            main: "main", //右のチャンネル表示するところ

            sessionOnlineNum: 0, //オンラインユーザー数
            disconnectSnackbar: false, //切断された表示
            reconnectedSnackbar: false,
            disconnected: false,

            path: "", //現在のチャンネルID
            loggedin: false, //ログインしているかの状態
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

        //切断されたときにエラーを表示する
        socket.on("disconnect", () => {
            this.disconnectSnackbar = true;
            this.disconnected = true;

        });

        //再接続できたら接続できたと表示
        socket.on("connect", () => {
            if ( this.disconnected ) {
                this.disconnectSnackbar = false,
                this.reconnectedSnackbar = true;
                console.log("App :: connection : サーバーに接続されました!");

                //オンラインとして加算してもらう
                socket.emit("countmeAsOnline", {
                    reqSender: {
                        userid: this.Userinfo.userid,
                        sessionid: this.Userinfo.sessionid
                    }
                });

                //切断状態をオフ
                this.disconnected = false;

            }

        });

    }

}

</script>

<template>
    <div>
        <v-snackbar
            v-model="disconnectSnackbar"
            class="rounded-lg"
            color="error"
            location="top"
        >
            サーバーから切断されました...(再接続中)
            <template v-slot:actions>
                <v-btn
                    class="rounded-lg"
                    variant="text"
                    @click="disconnectSnackbar=false;"
                >
                    閉じる
                </v-btn>
            </template>
        </v-snackbar>

        <v-snackbar
            v-model="reconnectedSnackbar"
            class="rounded-lg"
            color="success"
            location="top"
        >
            接続されました!
            <template v-slot:actions>
                <v-btn
                    class="rounded-lg"
                    variant="text"
                    @click="reconnectedSnackbar=false;"
                >
                    閉じる
                </v-btn>
            </template>
        </v-snackbar>

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