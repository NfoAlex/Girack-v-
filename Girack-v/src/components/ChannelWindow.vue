<script>
import { getSocket, CLIENT_FULL_LOADED } from "../data/socket.js";
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

    //チャンネル情報を返す
    getChannelInfo() {
      //もしチャンネルリストにあるなら
      if (this.ChannelIndex[this.$route.params.id] !== undefined) {
        //チャンネルデータを返す
        return {
          ...this.ChannelIndex[this.$route.params.id],
          previewmode: false,
        };

        //あるいはプレビュー用としてチャンネルを登録しているなら
      } else if (this.PreviewChannelData.channelid === this.$route.params.id) {
        //履歴取得状態を強制的に初期化
        this.PreviewChannelData.fetchingHistory = false;

        return {
          ...this.PreviewChannelData,
          previewmode: true,
        };

        //プレビューでもないならブラウザで飛ばす
      } else {
        //プレビュー用チャンネルデータにチャンネルIDを設定
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.PreviewChannelData.channelid = this.$route.params.id;

        //チャンネル情報の取得
        socket.emit("getInfoChannel", {
          targetid: this.PreviewChannelData.channelid,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });

        return this.PreviewChannelData;
      }
    }

  },
};
</script>

<template>
  <div
    v-if="CLIENT_FULL_LOADED"
    style="height:100%; width:100%;"
    class="d-flex flex-column justify-start"
  >
    <div style="height:75px;" class="head flex-grow-0 flex-shrink-0">
      <ChannelHead :channelInfo="getChannelInfo()" @toggleSidebar="$emit('toggleSidebar')" />
    </div>
    <div
      style="width:100%; overflow-y: auto;"
      class="me-auto flex-grow-1 flex-shrink-1"
    >
      <KeepAlive :max="10" :exclude="'Userpage'">
        <component
          is="ChannelContent"
          :MsgDBActive="getMsgDB()"
          :channelInfo="getChannelInfo()"
          :key="$route.params.id"
        />
      </KeepAlive>
    </div>
    <div class="input flex-grow-0 flex-shrink-1">
      <ChannelInput :channelInfo="getChannelInfo()" />
    </div>
  </div>
  <div v-else>
      <v-card width="40vw" class="pa-4 mx-auto d-flex flex-column" style="margin-top:10vh;">
        <v-img src="/loading.svg"></v-img>
        <h3 class="text-center">Loading...</h3>
      </v-card>
  </div>
</template>

<style scoped>
</style>
