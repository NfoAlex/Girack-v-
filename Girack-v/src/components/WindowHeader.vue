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
      //チャンネルメニューダイアログ用
      channelDialogShow: false,
      channelDialogId: "0001",
      channelPinsShow: false,

      disconnected: false,

      channelInfo: {}
    };
  },

  computed: {
    //今いるパス(チャンネルID)を取得するだけ
    getPath() {
      return this.$route.params.id;
    },
  },

  mounted() {
    console.log("WindowHeader :: mounted : this.ChannelIndex[this.getPath]->", this.ChannelIndex[this.getPath]);
    
    if (this.ChannelIndex[this.getPath] !== undefined) {
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

      //チャンネル情報取得
      socket.emit("getInfoChannel", {
        targetid: this.getPath,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      })

      this.channelInfo = this.ChannelIndex[this.getPath];
    }
  }
};
</script>

<template>

  <div>
    <v-card style="height:100%;" class="elevation-6 pa-3">
      
      <div class="instanceCardWidth">
        {{ Serverinfo.servername }}
        <RouterLink to="/onlineuser">
          <v-card
            style="font-size:calc(6px + 0.65vb); width: 80%"
            class="mx-auto pa-2 mb-4 rounded-pill d-flex justify-center align-center"
            elevation="false"
            variant="tonal"
            v-ripple
          >
            <v-icon
              v-if="sessionOnlineNum >= 2"
              size="x-small"
              :color="disconnected ? 'red' : 'green'"
              >mdi:mdi-circle</v-icon
            >
            <span v-else>🥲</span>
            <span v-if="!disconnected">{{ sessionOnlineNum }}人がオンライン</span>
            <span v-else>サーバーオフライン</span>
          </v-card>
        </RouterLink>

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