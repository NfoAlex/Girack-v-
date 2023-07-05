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
      sessionData: {},
    }
  },

  methods: {
    //セッションデータを取得しなおす
    refreshSessionData() {
      //セッションデータの取得
      socket.emit("getInfoSessions", {
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
    },

    //セッションデータの受け取り
    SOCKETInfoSessions(dat) {
      console.log("SessionManage :: SOCKETInfoSessions : 受け取ったセッションデータ->", dat);
      this.sessionData = dat;
    }
  },

  mounted() {
    //セッションデータの受け取りハンドラ
    socket.on("infoSessions", this.SOCKETInfoSessions);

    //セッションデータの取得
    socket.emit("getInfoSessions", {
      reqSender: {
        userid: this.myUserinfo.userid,
        sessionid: this.myUserinfo.sessionid
      }
    });
  },

  unmounted() {
    //socketの多重防止
    socket.off("InfoSessions", this.SOCKETInfoSessions);
  }
}

</script>

<template>
  <div>
    <div class="mx-auto" style="width: 90%;">
      <div class="d-flex align-center" style="padding-top: 3%; margin-bottom: 16px">
        <p class="text-truncate me-auto" style="font-size: min(4vh, 36px)">
        セッション管理
        </p>
        <!-- 再取得ボタン -->
        <v-btn
          @click="refreshSessionData"
          icon="mdi:mdi-refresh"
          size="large"
          class="rounded-lg"
          color="primary"
        >
        </v-btn>
      </div>
      <div class="mx-auto">
        <v-expansion-panels v-if="sessionData!=={}" style="width: 100%">
          <v-expansion-panel
          v-for="(session,index) in Object.entries(sessionData)"
            class="rounded-lg"
          >
            <v-expansion-panel-title>
              とある日のログイン
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p>{{ session[0] }}</p>
              <p>
                最後のログイン : 
                <v-chip>
                  {{ session[1].loggedinTime.slice(0,4) }} /{{ session[1].loggedinTime.slice(4,6) }} / {{ session[1].loggedinTime.slice(6,8) }} {{ session[1].loggedinTime.slice(8,10) }}:{{ session[1].loggedinTime.slice(10,12) }}
                </v-chip>
              </p>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </div>
</template>