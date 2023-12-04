<script>

import { getSocket } from "../../../data/socket.js";
import { dataUser } from "../../../data/dataUserinfo";
import ContentMessageRender from "./ContentMessageRender.vue";

const socket = getSocket();

export default {

  setup() {
    const { myUserinfo, UserIndex } = dataUser();

    return { myUserinfo, UserIndex };
  },

  props: ["messageid", "channelid"],

  components: { ContentMessageRender },

  data() {
    return {
      msgReply: {} //受信したメッセージデータの格納用
    }
  },

  methods: {

    //メッセージデータ受け取り
    SOCKETmessageSingle(dat) {
      console.log("ContentReplyRender :: SOCKETmessageSingle : データ->", dat);
      this.msgReply = dat; //格納
    }

  },

  mounted() {
    //メッセージ取得
    socket.emit("getMessageSingle", {
      reqSender: {
        userid: this.myUserinfo.userid,
        sessionid: this.myUserinfo.sessionid
      },
      messageid: this.messageid,
      channelid: this.channelid
    });

    socket.on("messageSingle_" + this.messageid, this.SOCKETmessageSingle);
  },

  unmounted() {
    socket.off("messageSingle_" + this.messageid, this.SOCKETmessageSingle);
  }

}

</script>

<template>

  <div>
    <p
      class="text-truncate ma-0"
      style="margin-top: 8px !important"
    >
      <a :href="'#' + msgReply.messageid">
        <!-- 返信アイコン -->
        <v-icon>mdi:mdi-reply</v-icon>
        <!-- 返信する人の名前 -->
        <v-chip
          size="small"
          color="grey"
          variant="flat"
          style="cursor: pointer"
        >
          {{
            UserIndex[msgReply.userid] !== undefined
              ? UserIndex[msgReply.userid].username
              : msgReply.userid
          }}
        </v-chip>
      </a>
      <!-- 返信内容 -->
      :
      <ContentMessageRender
        class="text-medium-emphasis"
        :content="msgReply.content"
      />
    </p>
  </div>

</template>
