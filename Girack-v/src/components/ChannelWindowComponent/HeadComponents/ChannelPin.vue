<script>

import { getSocket, Serverinfo } from "../../../data/socket";
import { dataUser } from "../../../data/dataUserinfo";

const socket = getSocket();

export default {

  setup() {
    const { myUserinfo, UserIndex } = dataUser();
    return { myUserinfo, UserIndex };
  },

  data() {
    return {
      msgPinDB: {}
    }
  },

  props: ["pins", "channelid", "channelname"],

  methods: {

    //メッセージ受け取り
    SOCKETmessageSingle(dat) {
      //メッセ用の変数へデータ追加
      this.msgPinDB[dat.messageid] = dat;
    }

  },

  mounted() {
    //ピン留めのメッセージ受け取り用
    for (let index in this.pins) {
      socket.on("messageSingle_" + this.pins[index], this.SOCKETmessageSingle);
      socket.emit("getMessageSingle", {
        channelid: this.channelid,
        messageid: this.pins[index],
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
    }
  },

  unmounted() {
    //ピン留めのメッセージ受け取り用
    for (let index in this.pins) {
      socket.off("messageSingle_" + this.pins[index], this.SOCKETmessageSingle);
    }
  }

}

</script>

<template>

  <v-dialog width="65vw" height="75vh">
    <v-card class="rounded-lg mx-0 pa-4" width="100%" height="100%">

      <v-card-title class="d-flex align-center">
        <v-icon>mdi:mdi-pound</v-icon>
        <div class="me-auto text-truncate">{{ channelname }}</div>
        <v-btn @click="$emit('closePin')" class="rounded-lg" variant="tonal" icon="mdi:mdi-close"></v-btn>
      </v-card-title>

      <v-card-subtitle>
        <div class="ml-3 me-auto">ピン留め一覧</div>
      </v-card-subtitle>

      <v-card-text>

        <v-card
          v-for="message in msgPinDB"
          class="my-2 pa-2 rounded-lg"
          variant="tonal"
        >
          {{ message.content }}
        </v-card>

        {{ pins }}
      </v-card-text>
    </v-card>
  </v-dialog>

</template>