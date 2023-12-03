<script>

import { getSocket } from "../../../data/socket.js";
import { dataUser } from "../../../data/dataUserinfo";

const socket = getSocket();

export default {

  setup() {
    const { myUserinfo, UserIndex } = dataUser();

    return { myUserinfo, UserIndex };
  },

  props: ["messageid", "channelid"],

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

  <div style="border:2px solid black;">
    <i>ContentReplyRender
       :: 
      {{ UserIndex[msgReply.userid]!==undefined?UserIndex[msgReply.userid].username:"ロード中" }}
       : 
      {{ msgReply.content }}
    </i>
  </div>

</template>