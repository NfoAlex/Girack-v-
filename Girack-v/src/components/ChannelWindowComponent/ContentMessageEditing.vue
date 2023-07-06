<script>
import { getSocket } from '../../data/socket.js';
import { dataUser } from '../../data/dataUserinfo.js';

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();

    return { myUserinfo };
  },

  props: ["content", "messageid", "channelid"],

  data() {
    return {
      editTxt: ""
    }
  },

  methods: {
    //メッセージの編集を適用する関数
    updateMessage() {
      //更新するように送信
      socket.emit("editMessage", {
        textEditing: this.editTxt,
        channelid: this.channelid,
        messageid: this.messageid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
      //編集モードから抜ける
      this.$emit('updateEditingMessage','xxxxxx');
    }
  },

  mounted() {
    //propsからメッセージ分を取得、格納
    this.editTxt = this.content;
  }
}

</script>

<template>
  <v-textarea
    v-model="editTxt"
    variant="outlined"
  >
    <template v-slot:append-inner>
      <v-btn
        @click="updateMessage"
        class="rounded-lg ma-1"
        size="x-small"
        icon="mdi:mdi-check-bold"
        color="secondary"
      >
      </v-btn>
      <v-btn
        @click="$emit('updateEditingMessage','waaaa')"
        class="rounded-lg ma-1"
        size="x-small"
        icon="mdi:mdi-window-close"
        color="secondary"
      >
      </v-btn>
    </template>
  </v-textarea>
</template>