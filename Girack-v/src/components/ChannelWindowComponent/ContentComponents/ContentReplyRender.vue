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
      uri: window.location.origin, //バックエンドのURI
      msgReply: {}, //受信したメッセージデータの格納用
      contentDisplay: "" //最終的に表示する本文
    }
  },

  methods: {

    //メッセージデータ受け取り
    SOCKETmessageSingle(dat) {
      //console.log("ContentReplyRender :: SOCKETmessageSingle : データ->", dat);
      this.msgReply = dat; //格納

      //表示したい本文
      let content = this.msgReply.content;
      //もし本文に改行が二つ以上あれば削る
      if (content.split("\n").length >= 2) {
        this.contentDisplay = content.split('\n')[0] + "\n" + content.split('\n')[1] + " ...";
      } else {
        this.contentDisplay = content;
      }
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

  <div class="d-flex">

    <v-divider
      vertical
      class="mr-2"
      thickness="5"
    >
    </v-divider>

    <p class="text-truncate">
      <a :href="'#' + msgReply.messageid">

        <!-- アバター -->
        <v-avatar
          size="24"
        >
          <v-img
            class="pointed"
            :alt="msgReply.userid"
            :src="uri + '/img/' + msgReply.userid"
          >
          </v-img>
        </v-avatar>

        <!-- ユーザー名表示 -->
        <span class="ml-2">
          {{
            UserIndex[msgReply.userid] !== undefined
              ? UserIndex[msgReply.userid].username
              : msgReply.userid
          }}
        </span>

      </a>
      :
      <!-- 返信内容 -->
      <ContentMessageRender
        class="text-medium-emphasis"
        :content="contentDisplay"
      />
    </p>

  </div>

</template>
