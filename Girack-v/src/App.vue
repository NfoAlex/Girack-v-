<script>
import { getSocket, CLIENT_FULL_LOADED, CLIENT_LOAD_FLAG } from "./data/socket.js";
import { dataUser } from "./data/dataUserinfo.js";
import Auth from "./components/Auth.vue";
import Sidebar from "./components/Sidebar.vue";
import WindowHeader from "./components/WindowHeader.vue";
import { useTheme, useDisplay } from "vuetify";
const socket = getSocket();

export default {
  setup() {
    const { mobile } = useDisplay();
    const theme = useTheme();
    const { myUserinfo } = dataUser();

    return {
      mobile,
      theme,
      myUserinfo,
      CLIENT_FULL_LOADED,
      CLIENT_LOAD_FLAG
    };
  },

  components: { Sidebar, Auth, WindowHeader },

  data() {
    return {
      sideBarMobileDisplay: false, //スマホ用のサイドバー表示をしているかどうか

      sessionOnlineNum: 0, //オンラインユーザー数
      disconnectSnackbar: false, //切断された表示
      reconnectedSnackbar: false, //再接続できたと表示
      askResyncSnackbar: false, //MsgDBを取り直すかどうかを聞くやつ
      disconnected: false, //切断されたかどうかの状態
      disconnectedForEnoughTime: false, //切断されて時間が経ったかどうか

      loggedin: false, //ログインしているかの状態
    };
  },

  computed: {
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //すべてのメッセージ履歴を初期化した取得しなおす
    syncAllMsgDB() {
      this.CLIENT_FULL_LOADED = false;
      //初期ロード用フラグ全部初期化
      this.CLIENT_LOAD_FLAG.T1_CHANNELINFO_LOADED = false;
      this.CLIENT_LOAD_FLAG.T2_HISTORY_LOADED = false;
      this.CLIENT_LOAD_FLAG.T3_READSTATE_LOADED = false;

      //チャンネル情報を取得しなおす
      for (let c in this.myUserinfo.channelJoined) {
        socket.emit("getInfoChannel", {
          //リクエスト送信
          targetid: this.myUserinfo.channelJoined[c],
          reqSender: {
            userid: this.myUserinfo.userid, //ユーザーID
            sessionid: this.myUserinfo.sessionid, //セッションID
          },
        });
      }
      
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

        //履歴を再同期
        this.syncAllMsgDB();

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
    <div v-if="loggedin" class="pa-0 ma-0" style="width:100vw; height:100vh !important; ">
      <WindowHeader
        :sessionOnlineNum="sessionOnlineNum"
        style="width:100%; height:75px;"
      />

      <div style="height:calc(100vh - 75px);" class="d-flex">
        <!-- サイドバー(左側) -->
          <!-- デスクトップ用 -->
        <Sidebar v-if="!isMobile" :sessionOnlineNum="sessionOnlineNum" />
          <!-- モバイルレイアウト用 -->
        <v-dialog
          v-else
          v-model="sideBarMobileDisplay"
          fullscreen
          transition="slide-x-transition"
        >
          <Sidebar
            :sessionOnlineNum="sessionOnlineNum"
            @closeSidebar="sideBarMobileDisplay = false"
          />
        </v-dialog>

        <!-- メイン画面（右側） -->
        <div style="min-width:0;" class="flex-grow-1">
          <RouterView @toggleSidebar="sideBarMobileDisplay = !sideBarMobileDisplay" />
        </div>
      </div>

    </div>

    <!-- ログイン前 -->
    <div v-else>
      <Auth @login="() => (loggedin = true)" />
    </div>
  </div>
</template>

<style>
html {
  background: rgb(var(--v-theme-background));
  overflow-y: hidden !important;
  font-family: "Noto Sans CJK JP", "Roboto", "BIZ UDPGothic", "sans-serif" !important;
  width:100vw;
  height:100vh;
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
