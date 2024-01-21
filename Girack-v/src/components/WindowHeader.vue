<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { getSocket } from "../data/socket";
import { dataUser } from "../data/dataUserinfo";
import { dataChannel } from "../data/dataChannel";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    const { ChannelIndex } = dataChannel();
    return { myUserinfo, ChannelIndex, };
  },

  data() {
    return {
      //チャンネルメニューダイアログ用
      channelDialogShow: false,
      channelDialogId: "0001",
      channelPinsShow: false,

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

    <v-card class="ma-2">
      <p>asdf</p>
    </v-card>
  </div>

</template>
