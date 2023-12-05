<script>
import { getSocket } from "../../../data/socket.js";
import { dataUser } from "../../../data/dataUserinfo";

const socket = getSocket();

export default {
  props: ["content"],

  setup() {
    const { myUserinfo, UserIndex } = dataUser();

    return { UserIndex, myUserinfo };
  },

  data() {
    return {
      MessageTemplate: {
        WELCOME: ["がGirackへ参加しました!  ようこそ!"],
        JOINED: ["がチャンネルへ参加しました"],
        LEFT: ["がチャンネルを退出しました"],
        INVITED: ["が", "をこのチャンネルに招待しました"],
        KICKED: ["が", "をこのチャンネルからキックしました"],
        DESCRIPTION_UPDATED: ["がチャンネル概要を更新しました"],
        CHANNELNAME_UPDATED: ["がチャンネル名を変更しました"],
        SCOPE_UPDATED: ["がチャンネルの公開範囲を更新しました"],
        MESSAGE_PINNED: ["がメッセージを新しくピン留めしました"]
      },
    };
  },

  methods: {
    //もし人のやつほしくなったら
    needUserIndex(userid) {
      socket.emit("getInfoUser", {
        targetid: userid,
        reqSender: {
          userid: this.myUserinfo.userid, //ユーザーID
          sessionid: this.myUserinfo.sessionid, //セッションID
        },
      });

      return userid;
    },

    //システムメッセージを返す
    renderMessageTemplate(term, i) {
      try {
        //テンプレから取得、なければそれはそれでテンプレを返す
        if (this.MessageTemplate[term][i] !== undefined) {
          return this.MessageTemplate[term][i];
        } else {
          return "によって設定が更新されました"
        }
      } catch(e) {return " : 設定更新"}
    }
  },
};
</script>

<template>
  <span>
    <span
      style="width: 95%; word-wrap: break-word"
      class="mx-auto d-flex justify-center text-medium-emphasis"
    >

    <!-- アイコン群 -->
      <span>

        <v-icon
          v-if="content.term==='MESSAGE_PINNED'"
          size="small"
        >
          mdi:mdi-pin
        </v-icon>

        <span
          v-if="content.term==='WELCOME'"
          size="small"
        >
          🎉
        </span>

        <v-icon
          v-if="content.term==='KICKED'"
          size="small"
        >
          mdi:mdi-karate
        </v-icon>

      </span>

      <span class="text-truncate flex-shrink-1">
        {{
          UserIndex[content.triggeredUser] !== undefined
            ? UserIndex[content.triggeredUser].username
            : needUserIndex(content.triggeredUser)
        }}
      </span>

      <span class="flex-shrink-0">
        {{ renderMessageTemplate(content.term, 0) }}
      </span>

      <!-- もし別のユーザーが招待あるいはキックされたのなら表示 -->
      <span v-if="content.targetUser !== ''" class="flex-shrink-1 text-truncate">
        {{
          UserIndex[content.targetUser] !== undefined
            ? UserIndex[content.targetUser].username
            : needUserIndex(content.targetUser)
        }}
      </span>

      <span v-if="content.targetUser !== ''" class="flex-shrink-0">
        {{ renderMessageTemplate(content.term, 1) }}
      </span>

    </span>
  </span>
</template>
