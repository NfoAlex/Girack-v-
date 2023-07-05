<script>
import { getSocket } from '../../data/socket.js';
import { dataUser } from '../../data/dataUserinfo.js';

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();

    return { myUserinfo };
  },

  data() {
    return {
      currentSessionid: "", //今ログインしているセッションID
    }
  },

  methods: {
    //セッションデータの受け取り
    SOCKETInfoSessions(dat) {
      console.log("SessionManage :: SOCKETInfoSessions : 受け取ったセッションデータ->", dat);
    }
  },

  mounted() {
    //セッションデータの取得
    socket.emit("getInfoSessions", {
      reqSender: {
        userid: this.myUserinfo.userid,
        sessionid: this.myUserinfo.sessionid
      }
    })
  }
}

</script>

<template>
  <div style="width: 90%;">
    <div style="padding-top: 3%; margin-bottom: 16px">
      <p class="text-truncate" style="font-size: min(4vh, 36px)">
      セッション管理
      </p>
    </div>
    <div>
      <v-expansion-panels style="width: 90%">
        <v-expansion-panel
          class="rounded-lg"
        >
          <v-expansion-panel-title>
            この日のログイン
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            データ
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>