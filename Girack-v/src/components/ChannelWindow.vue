<script>
import { getSocket, getMessage, CLIENT_FULL_LOADED } from "../data/socket.js";
import { dataMsg } from "../data/dataMsg";
import { dataChannel } from "../data/dataChannel";
import { dataUser } from "../data/dataUserinfo";
import ChannelHead from "./ChannelWindowComponent/ChannelHead.vue";
import ChannelContent from "./ChannelWindowComponent/ChannelContent.vue";
import ChannelInput from "./ChannelWindowComponent/ChannelInput.vue";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    const { MsgDB } = dataMsg();
    const { ChannelIndex, PreviewChannelData } = dataChannel();
    return { myUserinfo, MsgDB, ChannelIndex, PreviewChannelData, CLIENT_FULL_LOADED };
  },

  components: {
    ChannelHead,
    ChannelContent,
    ChannelInput
  },

  computed: {
    //チャンネル情報を返す
    getChannelInfo() {
      //もしチャンネルリストにあるなら
      if (this.ChannelIndex[this.$route.params.id] !== undefined) {
        console.log(
          "ChannelWindow :: getChannelInfo : infos ->",
          this.ChannelIndex[this.$route.params.id]
        );

        //チャンネルデータを返す
        return {
          ...this.ChannelIndex[this.$route.params.id],
          previewmode: false,
        };

        //あるいはプレビュー用としてチャンネルを登録しているなら
      } else if (this.PreviewChannelData.channelid === this.$route.params.id) {
        console.log(
          "ChannelWindow :: getChannelInfo : 元からプレビューする予定のものだな"
        );

        //履歴を取得
        getMessage(this.$route.params.id, 25, 0);

        return {
          channelname: this.PreviewChannelData.channelname,
          description: this.PreviewChannelData.description,
          scope: this.PreviewChannelData.scope,
          canTalk: this.PreviewChannelData.canTalk,
          previewmode: true,
        };

        //プレビューでもないならブラウザで飛ばす
      } else {
        //プレビュー用チャンネルデータにチャンネルIDを設定
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.PreviewChannelData.channelid = this.$route.params.id;
        console.log(
          "ChannelWindow :: getChannelInfo : channelid->",
          this.PreviewChannelData.channelid
        );

        //チャンネル情報の取得
        socket.emit("getInfoChannel", {
          targetid: this.PreviewChannelData.channelid,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });

        getMessage(this.$route.params.id, 25, 0); //履歴を取得

        return this.PreviewChannelData;
      }
    },
  },

  methods: {
    //メッセージ履歴を返す
    getMsgDB() {
      //チャンネルインデックスにあるか、またはプレビューにあるかでデータを返し、無ければブラウザに戻す
      if (
        this.ChannelIndex[this.$route.params.id] !== undefined ||
        this.PreviewChannelData.channelid === this.$route.params.id
      ) {
        return this.MsgDB[this.$route.params.id];
      } else {
        this.$router.push({ path: "/browser" });
      }
    },
  },
};
</script>

<template>
  <div v-if="CLIENT_FULL_LOADED" style="height: 100vh" class="d-flex mb-2 flex-column">
    <div class="w head flex-grow-0 flex-shrink-0">
      <ChannelHead :channelInfo="getChannelInfo" @callSidebar="$emit('callSidebar')" />
    </div>
    <div
      style="overflow-y: auto"
      class="w me-auto flex-grow-1 flex-shrink-1"
    >
      <KeepAlive :max="10" :exclude="'Userpage'">
        <component
          is="ChannelContent"
          :MsgDBActive="getMsgDB()"
          :channelInfo="getChannelInfo"
          :key="$route.params.id"
        />
      </KeepAlive>
    </div>
    <div class="w input flex-grow-0 flex-shrink-1">
      <ChannelInput :channelInfo="getChannelInfo" />
    </div>
  </div>
  <div v-else>
      <v-card width="40vw" class="pa-4 mx-auto d-flex flex-column rounded-lg" style="margin-top:10vh;">
        <v-img src="/loading.svg"></v-img>
        <h3 class="text-center">Loading...</h3>
      </v-card>
  </div>
</template>

<style scoped>
.w {
  width: 100%;
  margin: 0 0;
  box-sizing: border-box;
}

.head {
  max-height: 10vh;
  border-bottom: solid 0.1px #424242;
}

.input {
  border-top: solid 0.1px #424242;
}
</style>
