<script>
import { getSocket, Serverinfo } from '../../data/socket.js';
import { dataUser } from '../../data/dataUserinfo.js';

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();

    return { myUserinfo, Serverinfo };
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
    let DOMeditingTextArea = document.getElementById("editingTextArea");
    console.log("ContentMessageEditing :: mounted : 先頭へ移動したい->", this.editTxt.length, DOMeditingTextArea);
    //テキスト入力欄の取得
    DOMeditingTextArea.focus();

    //カーソルを最後に持ってくる
    this.$nextTick(() => {
      //きしょすぎやろ
      setTimeout(() => {
        DOMeditingTextArea.setSelectionRange(this.editTxt.length, this.editTxt.length);
      }, 10);
    });
  }
}

</script>

<template>
  <v-textarea
    id="editingTextArea"
    @keydown.enter="updateMessage"
    @keydown.esc="$emit('updateEditingMessage','waaaa')"
    v-model="editTxt"
    variant="outlined"
  >
    <template v-slot:append-inner>
      <v-btn
        @click="updateMessage"
        :disabled="Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH<editTxt.length"
        class="rounded-lg ma-1"
        size="x-small"
        icon=""
        color="secondary"
      >
        <v-icon
          v-if="Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH>=editTxt.length"
        >
          mdi:mdi-check-bold
        </v-icon>
        <span v-else>
          -
          {{ 
            editTxt.length
            -
            Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH
          }}
        </span>
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