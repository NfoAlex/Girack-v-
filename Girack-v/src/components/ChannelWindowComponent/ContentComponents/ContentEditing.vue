<script>
import { getSocket, Serverinfo } from '../../../data/socket.js';
import { dataUser } from '../../../data/dataUserinfo.js';
import { getInputState } from "../ChannelInput.vue";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    const { InputState } = getInputState();

    return { myUserinfo, Serverinfo, InputState };
  },

  props: ["content", "messageid", "channelid"],

  data() {
    return {
      editTxt: "",
      dialogCheckToDelete: false,
    }
  },

  methods: {
    //Enterキーのトリガー処理(keyDownから来てるのでどのキーでも反応はする)
    enterTrigger(event) {
      //変換中のEnterなら処理させない
      if (event.keyCode !== 13) return;
      //削除確認中だったらメッセージの消去を行う
      if (this.dialogCheckToDelete) this.deleteMessage();

      //もしShiftキーも押されていたらここで停止
      if (event.shiftKey) return;

      //もし空なら消去するかどうか確認
      if (this.editTxt === "") {
        this.dialogCheckToDelete = true;
        return;
      }

      //編集開始
      this.updateMessage();
    },

    //escキーのトリガー処理(keyDownから来てるのでどのキーでも反応はする)
    escTrigger(event) {
      //そもそも押されたのがescキーじゃないなら停止
      if (event.key !== "Escape") return;

      //削除確認中かどうかで処理を変える
      if (this.dialogCheckToDelete) { //確認中なら
        //ダイアログを非表示に
        this.dialogCheckToDelete = false;
      } else { //確認中じゃないなら
        //メッセージ編集を止める
        this.$emit('closeEditing');
      }
    },

    //メッセージの編集を適用する関数
    updateMessage() {
      //メッセージが同じでないならメッセージの編集をする
      if (this.editTxt !== this.content) {
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
      }
      //編集モードから抜ける
      setTimeout(() => {this.$emit('closeEditing');}, 5);
    },

    //メッセージの削除
    deleteMessage() {
      //削除要請を送信
      socket.emit("actMessage", {
        action: "delete",
        channelid: this.channelid,
        messageid: this.messageid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
      //編集モードから抜ける
      this.$emit('updateEditingMessage','xxxxxx');
    }
  },

  mounted() {
    //propsからメッセージ分を取得、格納
    this.editTxt = this.content;
    //入力中と設定
    this.InputState.isTyping = true;

    //キーの監視開始
    document.addEventListener("keydown", this.enterTrigger);
    document.addEventListener("keydown", this.escTrigger);

    //カーソルを最後に持ってくる
    this.$nextTick(() => {
      let DOMeditingTextArea = document.getElementById("editingTextArea");
      //console.log("ContentMessageEditing :: mounted : 先頭へ移動したい->", this.editTxt.length, DOMeditingTextArea);
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
  },

  unmounted() {
    //入力中という設定を無効化
    this.InputState.isTyping = false;
    //キーの監視停止
    document.removeEventListener("keydown", this.enterTrigger);
    document.removeEventListener("keydown", this.escTrigger);
    //メッセージの入力欄にフォーカスするように
    document.getElementById("inp").focus();
  }
}

</script>

<template>
  <div>
    <!-- 編集部分 -->
    <v-textarea
      id="editingTextArea"
      auto-grow
      max-rows="5"
      rows="1"
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
          @click="$emit('closeEditing')"
          class="rounded-lg ma-1"
          size="x-small"
          icon="mdi:mdi-window-close"
          color="secondary"
        >
        </v-btn>
      </template>
    </v-textarea>

    <!-- 削除の確認 -->
    <v-dialog
      v-model="dialogCheckToDelete"
      class="ma-3 mx-auto"
      width=""
      contained
    >
      <v-card class="rounded-lg pa-5">
        <v-card-title>
          消去の確認
        </v-card-title>
        <v-card-item>
          消していいの
        </v-card-item>
        <span class="d-flex justify-end align-center pa-1">
          <span class="text-disabled me-auto text-body-2">
            Enterキーでも選択できます
          </span>
          <v-btn @click="dialogCheckToDelete=false" class="ma-1 rounded-lg" color="cardInner">
            だめ
          </v-btn>
          <v-btn @click="deleteMessage" class="ma-1 rounded-lg" color="success">
            いいよ
          </v-btn>
        </span>
      </v-card>
    </v-dialog>
  </div>
</template>