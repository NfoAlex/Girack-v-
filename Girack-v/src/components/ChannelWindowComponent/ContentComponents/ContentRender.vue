<script>
import { useDisplay } from "vuetify";
import { getSocket } from "../../../data/socket.js";
import { dataUser } from "../../../data/dataUserinfo";
import { getCONFIG } from "../../../config.js";
import Userpage from "../../Userpage.vue";
import ContentHoverMenu from "./ContentHoverMenu.vue";
import ContentEditing from "./ContentEditing.vue";
import ContentURLpreview from "./ContentURLpreview.vue";
import ContentMessageRender from "./ContentMessageRender.vue";
import ContentReplyRender from "./ContentReplyRender.vue";
import ContentAttatchmentRender from "./ContentAttatchmentRender.vue";

const socket = getSocket();

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo, UserIndex } = dataUser(); //ユーザー情報
    const { CONFIG_DISPLAY } = getCONFIG();
    return { mobile, myUserinfo, UserIndex, CONFIG_DISPLAY };
  },

  data() {
    return {
      uri: window.location.origin, //バックエンドのURI
      //msgIdEditing: "xxxxxxx",

      //ホバー処理用
      msgHovered: false, //ホバーされたかどうか
      msgIdHovering: 0, //ホバーされたメッセージのID

      //ユーザーページ用
      userDialogShow: false,
      userDialogUserid: "00000001",

      //ユーザーロールの色を返す
      userRoleColor: {
        Admin: "purple",
        Moderator: "blue",
        Member: "white",
        Deleted: "black",
      },
    }
  },

  components: {
    Userpage,
    ContentHoverMenu,
    ContentEditing,
    ContentURLpreview,
    ContentMessageRender,
    ContentReplyRender,
    ContentAttatchmentRender
  },

  props: [
    "m",
    "MsgDBActive",
    "msgDisplayNum",
    "index",
    "msgEditing"
  ],

  computed: {
    //現在いるパス(チャンネルID)を返すだけ
    getPath() {
      return this.$route.params.id;
    },

    //スマホかどうかを返す
    isMobile() {
      return this.mobile;
    },

    //表示する履歴数を設定
    // eslint-disable-next-line vue/return-in-computed-property
    cropMessage() {
      try {
        //履歴を表示し始める位置数計算
        //let displayStartPosition = this.MsgDBActive.length - this.msgDisplayNum;
        //もし開始位置が0未満なら0にする
        //if (displayStartPosition < 0) displayStartPosition = 0;

        //履歴を削って返す
        return this.MsgDBActive.slice(0,this.msgDisplayNum);
      } catch (e) {
        console.log("ContentRender :: cropMessage : MsgDBが空...?");
      }
    },
  },

  methods: {
    //ユーザーの情報取得するだけ
    getUserStats(userid, category) {
      switch (category) {
        //ロールを返す
        case "role":
          try {
            return this.UserIndex[userid].role;
          } catch (e) {
            return "Member";
          }

        //BANされたかどうかを返す
        case "banned":
          try {
            return this.UserIndex[userid].banned;
          } catch (e) {
            return false;
          }

        //変なエラー避け
        default:
          console.log("ContentRender :: getUserStats : なにもないね");
          return null;
      }
    },

    //絵文字を取得するだけ(ToDo:別コンポーネントとして独立)
    getReaction(reaction) {
      switch (reaction) {
        case "smile":
          return "😀";

        case "thinking_face":
          return "🤔";

        case "smirk":
          return "😏";

        case "cold_sweat":
          return "😰";

        default:
          return reaction;
      }
    },

    //ホバー時アクション
    mouseOverMsg(msgId, bool) {
      if (bool === "on") {
        this.msgHovered = true;
        this.msgIdHovering = msgId;
      }

      if (bool === "off") {
        this.msgHovered = false;
        this.msgIdHovering = null;
      }
    },

    //削除したりリアクションしたり編集(ToDo)したり
    messageAction(msgId, act, reaction) {
      //リアクションする
      if (act === "reaction") {
        //リアクションしたことを送信
        socket.emit("actMessage", {
          action: "reaction",
          channelid: this.getPath,
          messageid: msgId,
          reaction: reaction, //送るリアクション
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });
      }
    },

    //一つ前の履歴から１日が空いてるなら日付の線みたいなのを出す
    checkDateDifference(index) {
      try {
        //もし一つ前のメッセージが存在しないなら処理を停止
        if (this.cropMessage[index + 1] === undefined) return 0;

        //日を取得
        let msgDateBefore = parseInt(
          this.cropMessage[index + 1].time.slice(6, 8)
        );
        let msgDateThis = parseInt(this.cropMessage[index].time.slice(6, 8));
        //日付の差を計算
        let dateDifference = msgDateThis - msgDateBefore;

        //条件で日付線出すか決める
        if (dateDifference !== 0) {
          return true; //表示する
        } else {
          return false; //表示しない
        }
      } catch (e) {
        console.error(e);
      }
    },

    //アバターを表示するかどうか
    checkShowAvatar(userid, index) {
      try {
        //分(min)差計算
        let msgTimeMinBefore = parseInt(
          this.cropMessage[index + 1].time.slice(10, 12)
        );
        let msgTimeMinThis = parseInt(
          this.cropMessage[index].time.slice(10, 12)
        );
        //分差計算
        let timeMinDifference = msgTimeMinThis - msgTimeMinBefore;

        //時(h)差計算
        let msgTimeHourBefore = parseInt(
          this.cropMessage[index + 1].time.slice(8, 10)
        );
        let msgTimeHourThis = parseInt(
          this.cropMessage[index].time.slice(8, 10)
        );
        //時差計算
        let timeHourDifference = msgTimeHourThis - msgTimeHourBefore;

        //日付がそもそも違うなら見せる
        if (this.checkDateDifference(index)) return true;

        //メッセージ履歴のインデックス番号より一つ前と同じユーザーIDなら表示しない(false)と返す
        if (this.cropMessage[index + 1].userid === userid) {
          //このメッセージの一つ前のメッセージのユーザーID
          //条件でアバターを見せるか見せないか決める
          if (
            timeMinDifference < -55 ||
            timeMinDifference > 4 ||
            timeHourDifference !== 0
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          return true; //違うから表示する
        }
      } catch (e) {
        return true; //最初だったりするときはとにかく表示する
      }
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
  }
}

</script>

<template>
  <!-- メッセージ本体 -->
  <!-- v-menuはホバーメニュー用 -->
  <!-- 
  <v-menu
    open-on-hover
    :open-on-click="false"
    open-delay="100"
    close-delay="0"
    transition="none"
    :close-on-content-click="false"
    location="end top"
    origin="overlap"
  >
  -->
  <!-- ユーザーページ用 -->
  <div>
    <Userpage
      v-if="userDialogShow"
      v-model="userDialogShow"
      :userid="userDialogUserid"
    />
  </div>

  <v-menu
    open-on-hover
    location="end top"
    origin="overlap"
  >
    <!-- ホバーで反応する範囲 -->
    <template v-slot:activator="{ props }">
      <div
        v-if="m.isSystemMessage === undefined || m.isSystemMessage === false"
        v-bind="props"
        :id="m.messageid"
        class="d-flex justify-end px-3"
        :class="[
          checkShowAvatar(m.userid, index)?'pa-2':null,
          msgHovered && msgIdHovering === m.messageid ? 'hovered' : null,
          m.pinned?'pinned':null
        ]"
        @mouseover="mouseOverMsg(m.messageid, 'on')"
        @mouseleave="mouseOverMsg(m.messageid, 'off')"
      >

        <!-- アバター -->
        <v-avatar
          v-if="checkShowAvatar(m.userid, index)"
          class="mx-auto flex-shrink-1"
          size="40"
          style="max-width: 20%"
        >
          <v-img
            v-if="getUserStats(m.userid, 'role') !== 'Deleted'"
            @click="
              () => {
                userDialogShow = true;
                userDialogUserid = m.userid;
              }
            "
            class="pointed"
            :alt="m.userid"
            :src="uri + '/img/' + m.userid"
          >
          </v-img>

          <!-- 消去されているユーザーなら -->
          <v-img v-else :alt="m.userid" :src="uri + '/img/' + m.userid">
          </v-img>
        </v-avatar>

        <!-- アバターを表示しないときの空欄ホルダー -->
        <v-avatar
          v-else
          class="mx-auto flex-shrink-0"
          size="40"
          style="max-width: 20%; height: 0 !important"
        >
          <v-img
            v-if="getUserStats(m.userid, 'role') !== 'Deleted'"
            :alt="m.userid"
          >
          </v-img>
        </v-avatar>

        <!-- メッセージ本体 -->
        <span
          class="flex-grow-1 px-3 mr-1"
          style="width: max-content;"
        >

          <!-- ユーザー名と時間表記 -->
          <div
            v-if="checkShowAvatar(m.userid, index)"
            class="text-h6 d-flex align-center"
          >
            <!-- ユーザー名 -->
            <p class="text-truncate font-weight-medium">
              {{
                UserIndex[m.userid] !== undefined
                  ? UserIndex[m.userid].username
                  : m.userid
              }}
            </p>

            <!-- ロールバッジ -->
            <v-chip
              v-if="
                getUserStats(m.userid, 'role') !== 'Member' &&
                CONFIG_DISPLAY.CONTENT_SHOW_ROLE
              "
              style="margin-left: 8px"
              :color="this.userRoleColor[getUserStats(m.userid, 'role')]"
              size="x-small"
              :elevation="6"
            >
              {{ getUserStats(m.userid, "role") }}
            </v-chip>

            <!-- BANされたバッジ -->
            <v-chip
              v-if="getUserStats(m.userid, 'banned')"
              color="red"
              style="margin-left: 8px"
              size="x-small"
              :elevation="6"
            >
              BANNED
            </v-chip>
            
          </div>

          <!-- タイムスタンプ -->
          <span
            v-if="checkShowAvatar(m.userid, index)"
            style="color:#999; font-size:12px;"
            >
              {{ printDate(m.time) }}
          </span>

          <!-- 返信データ -->
          <ContentReplyRender
            v-if="m.replyData.isReplying"
            :messageid="m.replyData.messageid"
            :channelid="m.channelid"
          />

          <!-- ピン留めされているかどうか -->
          <div class="my-1">
            <v-chip v-if="m.pinned" size="x-small">
              <v-icon  size="small">
                mdi:mdi-pin
              </v-icon>
              ピン留め済み
            </v-chip>
          </div>

          <!-- メッセージ本文と編集中表示 -->
          <ContentMessageRender v-if="!msgEditing" :content="m.content" />
          <ContentEditing
            v-else
            @close-editing="$emit('closeEditing'); msgEditing=false;"
            :channelid="m.channelid"
            :content="m.content"
            :messageid="m.messageid"
          />

          <!-- メッセージが編集されていたら -->
          <p v-if="m.isEdited" class="text-disabled text-caption">
            編集済み
          </p>

          <!-- ファイル添付表示 -->
          <ContentAttatchmentRender
            v-if="m.fileData"
            :fileData="m.fileData"
            :channelid="getPath"
          />

          <!-- URLプレビュー用 -->
          <ContentURLpreview v-if="m.hasUrl" :urlData="m.urlData" />

          <!-- リアクション -->
          <div class="d-flex">
            <v-card
              @click="messageAction(m.messageid, 'reaction', r[0])"
              style="
                width: fit-content;
                font-size: 14px;
                user-select: none;
                -webkit-user-select: none;
              "
              class="px-2 py-1 mr-1 mt-1 mb-2"
              variant="tonal"
              density="compact"
              :size="isMobile?'default':'small'"
              v-for="r in Object.entries(m.reaction)"
              :key="r"
            >
              {{ getReaction(r[0]) }} {{ r[1] }}
            </v-card>
          </div>

        </span>
      </div>

    </template>

    <!-- ここからホバーメニュー -->
    <ContentHoverMenu
        v-if="!msgEditing"
        @mouseover="mouseOverMsg(m.messageid, 'on')"
        @mouseleave="mouseOverMsg(m.messageid, 'off')"
        @update-editing-message="msgEditing=true"
        @cancelEditing="msgEditing=false"
        style="z-index: 30"
        :m="m"
        :userrole="getUserStats(m.userid, 'role')"
        :channelid="getPath"
      />
    
  </v-menu>
</template>

<style scoped>

/* ホバーされたメッセージ */
.hovered {
  background-color: #555 !important;
}

/* ピン留めされたメッセージ */
.pinned {
  background-color: #445 !important;
}

.pointed {
  cursor: pointer;
}


</style>