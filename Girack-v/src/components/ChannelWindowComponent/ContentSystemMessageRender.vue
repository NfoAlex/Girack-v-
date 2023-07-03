<script>
import { getSocket } from "../../data/socket.js";
import { dataUser } from "../../data/dataUserinfo";

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
        JOINED: ["がチャンネルへ参加しました"],
        LEFT: ["がチャンネルを退出しました"],
        INVITED: ["が", "をこのチャンネルに招待しました"],
        KICKED: ["が", "をこのチャンネルからキックしました"],
        DESCRIPTION_UPDATED: ["がチャンネル概要を更新しました"],
        CHANNELNAME_UPDATED: ["がチャンネル名を変更しました"],
        SCOPE_UPDATED: ["がチャンネルの公開範囲を更新しました"]
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
  },
};
</script>

<template>
  <span>
    <span
      style="width: 100%; word-wrap: break-word"
      class="d-flex justify-center text-medium-emphasis"
    >
      <span>
        {{
          UserIndex[content.triggeredUser] !== undefined
            ? UserIndex[content.triggeredUser].username
            : needUserIndex(content.triggeredUser)
        }}
      </span>
      <span>
        {{ MessageTemplate[content.term][0] }}
      </span>
      <!-- もし別のユーザーが招待あるいはキックされたのなら表示 -->
      <span v-if="content.targetUser !== ''">
        {{
          UserIndex[content.targetUser] !== undefined
            ? UserIndex[content.targetUser].username
            : needUserIndex(content.targetUser)
        }}
        {{ MessageTemplate[content.term][1] }}
      </span>
    </span>
  </span>
</template>
