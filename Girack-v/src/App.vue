<script>
import { getSocket } from './data/socket';
import { dataUser } from './data/dataUserinfo';
import { RouterView } from 'vue-router';
import Auth from "./components/Auth.vue";
import Sidebar from "./components/Sidebar.vue";
import { useTheme } from 'vuetify';
const socket = getSocket();

export default {
    setup() {
        const theme = useTheme();
        const { myUserinfo } = dataUser();

        return { theme, myUserinfo };
        
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
            socket.emit("getInfoServer"); //サーバーの情報を再取得
            
            //もし切断されているときにきたら
            if ( this.disconnected ) {
                this.disconnectSnackbar = false, //切断されたアラート非表示
                this.reconnectedSnackbar = true; //接続できたアラート表示

                //オンラインとして加算してもらう
                socket.emit("countmeAsOnline", {
                    reqSender: {
                        userid: this.myUserinfo.userid,
                        sessionid: this.myUserinfo.sessionid
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
            timeout="-1"
        >
            サーバーから切断されました...(再接続中)
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
                    <v-icon>
                        mdi:mdi-close
                    </v-icon>
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
    background: --v-theme-background;
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