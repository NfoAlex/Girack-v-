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
      editTxt: "",
      dialogCheckToDelete: false,
    }
  },

  methods: {
    //Enterキーのトリガー処理
    enterTrigger(event) {
      //変換中のEnterなら処理させない
      if (event.keyCode !== 13) return;
      
      //もしShiftキーも押されていたら
      if (event.shiftKey) {
        //現在の入力欄上のカーソル位置
        let currentTxtCursor = this.$el.querySelector("#editingTextArea").selectionStart;

        //テキストを現在のカーソル位置をもとに分裂させる
        let txtBefore = this.editTxt.slice(0, currentTxtCursor);
        let txtAfter = this.editTxt.slice(currentTxtCursor);

        //改行を挿入
        this.editTxt = txtBefore + "\n" + txtAfter;

        //カーソル位置を改行のすぐ次へ移動
        this.$nextTick(() => {
          currentTxtCursor.setSelectionRange(currentTxtCursor + 1, currentTxtCursor + 1);
        });

        //ここでトリガー処理を停止
        return;
      }

      //もし空なら消去するかどうか確認
      if (this.editTxt === "") {
        this.dialogCheckToDelete = true;
        return;
      }
    },

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

    //カーソルを最後に持ってくる
    this.$nextTick(() => {
      let DOMeditingTextArea = document.getElementById("editingTextArea");
      console.log("ContentMessageEditing :: mounted : 先頭へ移動したい->", this.editTxt.length, DOMeditingTextArea);
      //テキスト入力欄の取得
      DOMeditingTextArea.focus();
      //きしょすぎやろ
      setTimeout(() => {
        //編集部分へスクロールさせる
        DOMeditingTextArea.scrollIntoView({behavior : 'smooth'});
        //カーソル移動
        DOMeditingTextArea.setSelectionRange(this.editTxt.length, this.editTxt.length);
      }, 10);
    });
  }
}

</script>

<template>
  <!-- メッセージの削除確認 -->
  <v-dialog
    v-model="dialogCheckToDelete"
  >
    <v-card>
      <v-card-title>
        消去の確認
      </v-card-title>
      消していいの
    </v-card>
  </v-dialog>

  <v-textarea
    id="editingTextArea"
    @keydown.enter.prevent="enterTrigger"
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