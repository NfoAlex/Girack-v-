<script>
import { getSocket } from "../../../data/socket";
import { dataUser } from "../../../data/dataUserinfo";
import { getReplyState } from "../ChannelInput.vue";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    const { ReplyState } = getReplyState();

    return { myUserinfo, ReplyState };
  },

  props: ["m", "userrole", "channelid"],

  methods: {
    //メッセージの時間を出力する関数
    printDate() {
      let time = this.m.time;

      let t = new Date(); //時間取得用
      let y = t.getFullYear().toString(); //今年 (４桁)
      let m = (t.getMonth() + 1).toString().padStart(2, 0); //月 (0も含めて２桁に)
      let d = t.getDate().toString().padStart(2, 0); //日 (0も含めて２桁に)

      let timestamp = ""; //出力予定の文字列

      //もし去年以上からのメッセージだったら
      if (time.slice(0, 4) !== y) {
        //今年とデータのタイムスタンプが違っていたら
        timestamp += time.slice(0, 4) + "/";
        timestamp += time.slice(4, 6) + "/";
        timestamp += time.slice(6, 8);

        //表記を返す(時間を足して)
        return (
          timestamp +
          " " +
          time.slice(8, 10) +
          ":" +
          time.slice(10, 12) +
          ":" +
          time.slice(12, 14)
        );
      }

      //↓これいる？
      //もし先月以上前のメッセージだったら
      if (time.slice(4, 6) !== m) {
        //今月とデータのタイムスタンプが違っていたら
        timestamp += time.slice(4, 6) + "/";
        timestamp += time.slice(6, 8);

        //表記を返す(時間を足して)
        return (
          timestamp +
          " " +
          time.slice(8, 10) +
          ":" +
          time.slice(10, 12) +
          ":" +
          time.slice(12, 14)
        );
      }

      //もし昨日以上前のメッセージだったら
      if (time.slice(6, 8) !== d) {
        //今日とデータのタイムスタンプが違っていたら
        timestamp += time.slice(4, 6) + "/";
        timestamp += time.slice(6, 8);

        //表記を返す(時間を足して)
        return (
          timestamp +
          " " +
          time.slice(8, 10) +
          ":" +
          time.slice(10, 12) +
          ":" +
          time.slice(12, 14)
        );
      }

      //普通に今日だったら
      return (
        " 今日 " +
        time.slice(8, 10) +
        ":" +
        time.slice(10, 12) +
        ":" +
        time.slice(12, 14)
      );
    },

    //削除したりリアクションしたり編集(ToDo)したり
    messageAction(msgId, act, reaction) {
      //削除する
      if (act === "delete") {
        console.log("messageAction :: 削除します");
        //削除要請を送信
        socket.emit("actMessage", {
          action: "delete",
          channelid: this.channelid,
          messageid: msgId,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });
      }

      //リアクションする
      if (act === "reaction") {
        //リアクションしたことを送信
        socket.emit("actMessage", {
          action: "reaction",
          channelid: this.channelid,
          messageid: msgId,
          reaction: reaction, //送るリアクション
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });
      }
    },

    //メッセージの編集を適用
    messageEdit() {
      socket.emit("editMessage", {
        textEditing: "asdf",
        channelid: this.channelid,
        messageid: this.m.messageid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
    },

    //返信する関数
    reply() {
      this.ReplyState.isReplying = true; //返信状態をつける
      this.ReplyState.messageid = this.m.messageid; //返信するメッセージのID
    },
  },
};
</script>

<template>
  <v-card
    class="pa-2 rounded-lg"
    color="#222"
    style="width: fit-content; margin-top: -16px; max-width: 500px"
  >
    <!-- ここからホバーメニュー -->
    <span style="position: relative; float: right">
      <!-- 時間表示 -->
      <span style="margin-right: 12px" class="text-body-2 font-italic">
        {{ printDate() }}
      </span>
      <v-btn
        @click="messageAction(m.messageid, 'reaction', 'smile')"
        style="margin-right: 3px"
        variant="tonal"
        rounded="pill"
        size="x-small"
      >
        😀
      </v-btn>
      <v-btn
        @click="messageAction(m.messageid, 'reaction', 'thinking_face')"
        style="margin-right: 3px"
        variant="tonal"
        rounded="pill"
        size="x-small"
      >
        🤔
      </v-btn>
      <v-btn
        @click="messageAction(m.messageid, 'reaction', 'cold_sweat')"
        style="margin-right: 3px"
        variant="tonal"
        rounded="pill"
        size="x-small"
      >
        😰
      </v-btn>

      <!-- 返信 -->
      <v-btn
        @click="reply"
        style="margin-right: 3px"
        variant="tonal"
        rounded="pill"
        size="x-small"
      >
        <v-icon> mdi:mdi-reply </v-icon>
      </v-btn>

      <!-- 編集 -->
      <v-btn
        v-if="m.userid===myUserinfo.userid"
        @click="$emit('updateEditingMessage',m.messageid)"
        style="margin-right: 3px"
        variant="tonal"
        rounded="pill"
        size="x-small"
      >
        <v-icon> mdi:mdi-pencil </v-icon>
      </v-btn>

      <v-divider vertical></v-divider>

      <!-- 削除ボタン -->
      <v-btn
        prepend-icon="mdi:mdi-delete-forever"
        v-if="
          myUserinfo.role === 'Admin' ||
          (userrole !== 'Admin' && myUserinfo.role === 'Moderator') ||
          m.userid === myUserinfo.userid
        "
        @dblclick="messageAction(m.messageid, 'delete')"
        style="margin-right: 3px"
        variant="tonal"
        rounded="pill"
        size="x-small"
      >
        削除
        <v-tooltip
          activator="parent"
          location="top center"
        >
          ダブルクリックで削除
        </v-tooltip>
      </v-btn>
    </span>
  </v-card>
</template>

<style scoped></style>
