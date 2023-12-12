<script>

import { getSocket, Serverinfo } from "../../../data/socket";
import { dataUser } from "../../../data/dataUserinfo";
import ContentMessageRender from "../ContentComponents/ContentMessageRender.vue";
import ContentAttatchmentRender from "../ContentComponents/ContentAttatchmentRender.vue";
import ContentURLpreview from "../ContentComponents/ContentURLpreview.vue";
import ContentReplyRender from "../ContentComponents/ContentReplyRender.vue";

const socket = getSocket();

export default {

  setup() {
    const { myUserinfo, UserIndex } = dataUser();
    return { myUserinfo, UserIndex, Serverinfo };
  },

  data() {
    return {
      uri: window.location.origin, //バックエンドのURI
      loaded: false, //ロードできたかどうか

      //ピンの表示順
      pinDisplayOptions: ["date", "timePinned"], //ピンの表示順選択肢
      pinDisplayRule: "timePinned", //ピンの表示規則
      pinDisplayArray: [], //表示するピン

      //ピン用JSON
      msgPinDB: []
    }
  },

  props: ["pins", "channelid", "channelname"],
  components: {
    ContentMessageRender,
    ContentAttatchmentRender,
    ContentURLpreview,
    ContentReplyRender
  },

  methods: {

    //ピン留めを外す
    unpin(msgid) {
      //ピンを外す
      socket.emit("actMessage", {
        action: "pin",
        channelid: this.channelid,
        messageid: msgid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
      //JSON変数から削除
      delete this.msgPinDB[msgid];
      //ハンドラを外す
      socket.off("messageSingle_" + msgid, this.SOCKETmessageSingle);
    },

    //ピンの表示、ソート
    pinDisplayFormat(rule="timePinned") {
      //表示規則を格納
      this.pinDisplayRule = rule;
      
      //ピン留めされた順番基準
      if (rule === "timePinned") {
        console.log("ChannelPin :: pinDisplayFormat : 返すもの(timePinned)->", this.msgPinDB);
        //完全にコピーするため空スライス
        this.pinDisplayArray = this.msgPinDB.slice();
        return;
      }

      //時間基準
      if (rule === "date") {
        //完全にコピーするため空スライス
        let arr = this.msgPinDB.slice();
        //時間軸で比較する
        arr.sort((a,b) => {
          return a.time < b.time;
        });

        console.log("ChannelPin :: pinDisplayFormat : 返すもの(date)->", arr);

        this.pinDisplayArray = arr;
        return;
      }
    },

    //ピンできるロールかどうかを確認
    pinRoleCheck() {
      if (
        this.Serverinfo.config.MESSAGE.MESSAGE_PIN_ROLE === "Admin"
          &&
        this.myUserinfo.role !== "Admin"
      ) {
        return false;
      } else if (
        this.Serverinfo.config.MESSAGE.MESSAGE_PIN_ROLE === "Moderator"
          &&
        this.myUserinfo.role === "Member"
      ) {
        return false;
      }

      return true;
    },

    //メッセージの時間を出力する関数
    printDate(time) {
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

    //メッセージ受け取り
    SOCKETmessageSingle(dat) {
      //メッセ用の変数へデータ追加
      this.msgPinDB.unshift(dat);

      //ピンの数が揃っているなら完了のマークする
      if (this.msgPinDB.length === this.pins.length) {
        this.loaded = true; //ロード完了
        this.pinDisplayFormat(); //ソート開始
      }
    }

  },

  mounted() {
    //ピンがなければ最初からロード完了とマーク
    if (this.pins.length === 0) this.loaded = true;

    //ピン留めのメッセージ受け取り用
    for (let index in this.pins) {
      //受け取りハンドラ
      socket.on("messageSingle_" + this.pins[index], this.SOCKETmessageSingle);
      //リクエスト送信
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

  <v-dialog width="65vw" height="85vh">
    <v-card class="rounded-lg mx-0 pa-4" width="100%" height="100%">

      <v-card-title class="d-flex align-center">
        <v-icon>mdi:mdi-pound</v-icon>
        <div class="me-auto text-truncate">{{ channelname }}</div>
        <v-btn
          @click="$emit('closePin')"
          class="rounded-lg"
          color="secondary"
          icon="mdi:mdi-close"
        ></v-btn>
      </v-card-title>

      <v-card-subtitle>
        <div class=" me-auto">ピン留め一覧</div>
        <div class="d-flex align-center my-2">
          <p class="text-subtitle">表示順 : </p>
          <v-btn
            @click="pinDisplayFormat('date')"
            class="mx-1"
            rounded
            :variant="pinDisplayRule==='date'?'tonal':null"
          >
            時間
          </v-btn>
          <v-btn
            @click="pinDisplayFormat('timePinned')"
            class="mx-1"
            rounded
            :variant="pinDisplayRule==='timePinned'?'tonal':null"
          >
            ピン留めされた順
          </v-btn>
        </div>
      </v-card-subtitle>

      

      <v-card-text style="overflow-y:auto; padding-bottom:5%">

        <!-- ロード中処理 -->
        <v-card v-if="!loaded" loading variant="text" class="pa-3 text-center">
          ロード中...
        </v-card>

        <!-- ピン留め内容表示 -->
        <v-card
          v-if="msgPinDB.length!==0 && loaded"
          v-for="message in pinDisplayArray"
          class="my-3 pa-3 rounded-lg"
          variant="tonal"
        >
          <!-- アバターと名前とボタン表示 -->
          <span class="d-flex align-center">
            <v-avatar class="mr-3" size="small">
              <v-img
                :alt="message.userid"
                :src="uri + '/img/' + message.userid"
              >
              </v-img>
            </v-avatar>
            <p>
              {{ UserIndex[message.userid]!==undefined?UserIndex[message.userid].username:message.userid }}
            </p>
            <!-- タイムスタンプ -->
            <span
              class="text-caption me-auto"
              style="margin-left: 8px; color: #999"
            >
              {{ printDate(message.time) }}
            </span>
            <!-- 外しボタン -->
            <v-btn
              v-if="pinRoleCheck()"
              @click="unpin(message.messageid)"
              class="rounded-lg"
              icon
              variant="text"
              size="small"
            >
              <v-icon>
                mdi:mdi-minus-circle-outline
              </v-icon>
              <v-tooltip
                activator="parent"
                location="left"
              >
                ピンを外す
              </v-tooltip>
            </v-btn>

          </span>

          <!-- メッセージ内容 -->
          <div class="my-2 py-1 px-2">
            <ContentReplyRender
              v-if="message.replyData.isReplying"
              :messageid="message.replyData.messageid"
              :channelid="channelid"
            />
            <ContentMessageRender
              :content="message.content"
            />
            <ContentAttatchmentRender
              :fileData="message.fileData"
              :channelid="channelid"
            />
            <ContentURLpreview v-if="message.hasUrl" :urlData="message.urlData" />
          </div>
        </v-card>

        <div v-else class="mx-auto my-5 text-center">ピン留めがありません</div>

      </v-card-text>
    </v-card>
  </v-dialog>

</template>