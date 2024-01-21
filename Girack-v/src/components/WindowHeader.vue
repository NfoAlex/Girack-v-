<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { getSocket, Serverinfo } from "../data/socket";
import { dataUser } from "../data/dataUserinfo";
import { dataChannel } from "../data/dataChannel";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    const { ChannelIndex } = dataChannel();
    return { Serverinfo, myUserinfo, ChannelIndex, };
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
          //表示モード切替
          this.viewMode = "CHANNEL";
          this.findChannel();
          break;

        default:
          this.viewMode = "OTHER";
          break;
      }
    },

    findChannel() {
      //チャンネルページ
      if (location.pathname.startsWith("/c/")) {
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
      <div class="instanceCardWidth d-flex flex-column">

        <!-- インスタンス名 -->
        <p style="font-size:24px;">
          {{ Serverinfo.servername }}
        </p>
        <!-- オンライン人口表示 -->
        <RouterLink to="/onlineuser">
          <div
            class="d-flex justify-center"
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

      </div>

      <!-- ヘッダ表示内容 -->
      <div style="width:calc(100vw - 300px)" class="d-flex flex-column">
        <span v-if="viewMode==='CHANNEL'" class="text-truncate">
          {{ channelInfo.channelname }}
        </span>
 
        <span v-if="viewMode==='BROWSER'" class="text-h4 pl-3">
          <p>ブラウザ</p>
        </span>

        <span v-if="viewMode==='OTHER'" class="text-h4 pl-3 d-flex align-center">
          {{ $route.name }}
        </span>
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