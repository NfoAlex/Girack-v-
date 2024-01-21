<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { getSocket, Serverinfo } from "../data/socket";
import { getCONFIG } from "../config.js";
import { dataUser } from "../data/dataUserinfo";
import { dataChannel } from "../data/dataChannel";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    const { ChannelIndex } = dataChannel();
    const { LIST_NOTIFICATION_MUTE_CHANNEL } = getCONFIG();
    return { Serverinfo, myUserinfo, ChannelIndex, LIST_NOTIFICATION_MUTE_CHANNEL };
  },

  props: ["sessionOnlineNum"], //オンライン人数用

  data() {
    return {
      viewMode: "",

      //チャンネルメニューダイアログ用
      channelDialogShow: false,
      channelDialogId: "0001",
      channelPinsShow: false,

      disconnected: false,

      channelInfo: {} //チャンネル情報格納用
    };
  },

  watch: {
    $route: {
      handler() {
        console.log("WindowHeader :: watch($route) : $route->", this.$route);
        this.handlePageInfo();
      }
    }
  },

  computed: {
    //今いるパス(チャンネルID)を取得するだけ
    getPath() {
      return this.$route.params.id;
    },
  },

  methods: {
    //表示するヘッダ内容の選択
    handlePageInfo() {
      switch (this.$route.name) {
        case "Browser":
          this.viewMode = "BROWSER";
          break;

        case "Channel":
          this.viewMode = "CHANNEL";
          this.findChannel(); //チャンネル情報取得して表示
          break;

        default:
          this.viewMode = "OTHER";
          break;
      }
    },

    //チャンネルページヘッダ用の情報設定
    findChannel() {
      //チャンネル情報がないなら取得、設定
      if (this.ChannelIndex[this.getPath] !== undefined) {
        //チャンネル情報設定
        this.channelInfo = this.ChannelIndex[this.getPath];
      } else {
        this.ChannelIndex[this.getPath] = {
          channelid: this.getPath,
          channelname: "...",
          description: "...",
          scope: "public",
          pins: [],
          canTalk: "Member",
          haveAllHistory: false,
        };
        //チャンネル情報を取得
        socket.emit("getInfoChannel", {
          targetid: this.getPath,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid
          }
        });
        //チャンネル情報設定
        this.channelInfo = this.ChannelIndex[this.getPath];
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.handlePageInfo();
    });
  }

};
</script>

<template>

  <div>
    <v-card style="height:100%;" class="elevation-6 pa-3 d-flex">

      <!-- サーバー情報表示 -->
      <div class="instanceCardWidth d-flex flex-column justify-start">

        <!-- オンライン人口表示 -->
        <RouterLink to="/onlineuser">
          <div
            style="width:fit-content;"
            class="rounded-pill"
            v-ripple
          >
            <v-icon
              v-if="sessionOnlineNum >= 2"
              size="x-small"
              :color="disconnected ? 'red' : 'green'"
              >mdi:mdi-circle</v-icon
            >
            <span v-else>🥲</span>
            <span v-if="!disconnected">{{ sessionOnlineNum }}</span>
            <span v-if="disconnected">サーバーオフライン</span>
          </div>
        </RouterLink>

        <!-- インスタンス名 -->
        <p style="font-size:20px;">
          {{ Serverinfo.servername }}
        </p>

      </div>

      <!-- ヘッダ表示内容 -->
      <div style="width:calc(100vw - 400px); height:100%;" class="d-flex flex-column justify-center">
        <!-- チャンネルヘッダ -->
        <span v-if="viewMode==='CHANNEL'">
          <p class="text-truncate" style="font-size:22px;">{{ channelInfo.channelname }}</p>
          <p class="text-truncate" style="font-size:16px;">{{ channelInfo.description }}</p>
        </span>
 
        <!-- チャンネルブラウザ -->
        <span v-if="viewMode==='BROWSER'" class="text-h4 pl-3">
          <p>チャンネルブラウザ</p>
        </span>

        <!-- それ以外 -->
        <span v-if="viewMode==='OTHER'" class="text-h4 pl-3 d-flex">
          {{ $route.name }}
        </span>
      </div>

      <!-- チャンネルページ用ボタン群 -->
      <div v-if="viewMode==='CHANNEL'" style="width:100px; height:100%;" class="d-flex align-center">
        <!-- チャンネルの通知オン/オフボタン -->
        <v-btn
          icon=""
          class="ma-0 rounded"
          variant="text"
          size="small"
        >
          <v-icon
            v-if="!LIST_NOTIFICATION_MUTE_CHANNEL.includes($route.params.id)"
            >mdi:mdi-bell</v-icon
          >
          <v-icon v-else>mdi:mdi-bell-off</v-icon>
        </v-btn>

        <!-- ピン留め表示ボタン -->
        <v-btn
          icon=""
          class="rounded ma-0"
          variant="text"
          size="small"
        >
          <v-icon>mdi:mdi-pin</v-icon>
        </v-btn>
      </div>

    </v-card>
  </div>

</template>

<style scoped>

.instanceCardWidth {
  max-width: 300px;
  width: 25vw;
}

</style>