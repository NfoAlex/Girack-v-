
import { getSocket, CLIENT_FULL_LOADED } from "./data/socket.js";
import { dataUser } from "./data/dataUserinfo.js";
import Auth from "./components/Auth.vue";
import Sidebar from "./components/Sidebar.vue";
import { useTheme } from "vuetify";
const socket = getSocket();

export default {
  setup() {
    const theme = useTheme();
    const { myUserinfo } = dataUser();

    return { theme, myUserinfo };
  },

  components: { Sidebar, Auth, CLIENT_FULL_LOADED },

  data() {
    return {
      //css用クラス
      channelBar: "channelBar", //左のチャンネルバーとか
      main: "main", //右のチャンネル表示するところ

      sessionOnlineNum: 0, //オンラインユーザー数
      disconnectSnackbar: false, //切断された表示
      reconnectedSnackbar: false, //再接続できたと表示
      askResyncSnackbar: false, //MsgDBを取り直すかどうかを聞くやつ
      disconnected: false,

      loggedin: false, //ログインしているかの状態
    };
  },

  methods: {
    //すべてのメッセージ履歴を初期化した取得しなおす
    syncAllMsgDB() {
      //既読状態の取得(受け取る時にMsgDBを初期化している)
      socket.emit("getUserSaveMsgReadState", {
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
      //スナックバーを非表示
      this.askResyncSnackbar = false;
    }
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
      //もしロードが完了していないなら処理を停止
      if (!CLIENT_FULL_LOADED) return -1;

      socket.emit("getInfoServer"); //サーバーの情報を再取得

      //もし切断されているときにきたら
      if (this.disconnected) {
        (this.disconnectSnackbar = false), //切断されたアラート非表示
          (this.reconnectedSnackbar = true); //接続できたアラート表示

        //オンラインとして加算してもらう
        socket.emit("countmeAsOnline", {
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });

        //履歴を同期するか確認するスナックバーを表示
        this.askResyncSnackbar = true;

        //切断状態をオフ
        this.disconnected = false;
      }
    });

    //通知の許可を予め取得
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  },
};
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
          @click="reconnectedSnackbar = false"
        >
          <v-icon> mdi:mdi-close </v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="askResyncSnackbar"
      class="rounded-lg"
      color="grey"
      location="bottom"
      timeout="-1"
      vertical
    >
      再接続されたようです。
      履歴をすべて再取得しますか？
      <template v-slot:actions>
        <v-btn
          class="rounded-lg"
          variant="text"
          @click="askResyncSnackbar = false"
        >
          <v-icon> mdi:mdi-close </v-icon>
        </v-btn>
        <v-btn
          class="rounded-lg"
          variant="text"
          @click="syncAllMsgDB"
        >
          <v-icon> mdi:mdi-check-bold</v-icon>
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
      <Auth @login="() => (loggedin = true)" />
    </div>
  </div>
</template>

<style scoped>
.main {
  position: absolute;
  right: 0;
  top: 0;

  width: 80vw;
  height: 100vh;
}
</style>

<style>
html {
  background: rgb(var(--v-theme-background));
  overflow-y: hidden !important;
  font-family: "Noto Sans CJK JP", "BIZ UDPGothic" !important;
}

a {
  text-decoration: none;
  transition: 0.4s;
  color: #ede7f6;
}

a:visited {
  text-decoration: none;
  color: #ede7f6;
}
</style>
