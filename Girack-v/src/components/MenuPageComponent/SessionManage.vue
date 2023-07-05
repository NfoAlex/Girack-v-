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
      fullSessionidDisplayIndex: -1,
      editingSessionnameIndex: -1,
      editingSessionnameTxt: ""
    }
  },

  methods: {
    //セッションデータを取得しなおす
    refreshSessionData() {
      //セッションデータJSONを初期化
      this.sessionData = {};

      //セッションデータの取得
      socket.emit("getInfoSessions", {
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
    },

    //特定のセッション名を更新
    updateSessionName(sessionid) {
      //セッション名を更新
      socket.emit("updateUserSessionName", {
        targetSessionid: sessionid,
        sessionName: this.editingSessionnameTxt,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });

    },

    //特定のセッションをログアウトさせる
    logoutSession(sessionid) {
      socket.emit("logout", {
        targetSessionid: sessionid,
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
            :key="index"
            class="rounded-lg"
          >

            <v-expansion-panel-title>
              <span class="text-truncate flex-grow-1">
                {{ session[1].sessionName }} ( {{ session[0].slice(0,5) }}... )
              </span>
              <v-chip style="margin-right: 5%" size="small">
                最終ログイン : {{ session[1].loggedinTime.slice(0,4) }}/{{ session[1].loggedinTime.slice(4,6) }}/{{ session[1].loggedinTime.slice(6,8) }} {{ session[1].loggedinTime.slice(8,10) }}:{{ session[1].loggedinTime.slice(10,12) }}
              </v-chip>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- セッション名変更部分 -->
              <v-btn
                v-if="editingSessionnameIndex!==index"
                @click="editingSessionnameIndex=index"
                block
                class="rounded-lg ma-2 mx-auto"
                color="grey"
              >
                <v-icon class="ma-1">
                  mdi:mdi-pencil
                </v-icon>
                セッション名を変更
              </v-btn>
              <v-text-field
                v-else
                v-model="editingSessionnameTxt"
                density="compact"
                variant="outlined"
              >
                <template v-slot:append-inner>
                  <v-btn
                    @click="updateSessionName(session[0]);editingSessionnameIndex=-1"
                    class="rounded-lg ma-1"
                    size="x-small"
                    icon="mdi:mdi-check-bold"
                    color="secondary"
                  >
                  </v-btn>
                  <v-btn
                    @click="editingSessionnameIndex=-1"
                    class="rounded-lg ma-1"
                    size="x-small"
                    icon="mdi:mdi-window-close"
                    color="secondary"
                  >
                  </v-btn>
                </template>
              </v-text-field>

              <div style="margin:24px 0;">
                <div>
                  セッションID : 
                  <code
                    v-if="fullSessionidDisplayIndex===index"
                    @click="fullSessionidDisplayIndex=-1"
                    class="ma-1"
                    style="color:rgb(var(--v-theme-success))"
                  >
                    {{ session[0] }}
                  </code>
                  <v-btn
                    v-else
                    @click="fullSessionidDisplayIndex=index"
                    class="ma-1 rounded-lg"
                    size="small"
                    variant="outlined"
                  >
                    ここをクリックでID全文を表示
                  </v-btn>
                </div>
                <p>
                  初めてのログイン時間 : 
                  <v-chip size="small">
                    {{ session[1].loggedinTimeFirst.slice(0,4) }}/{{ session[1].loggedinTimeFirst.slice(4,6) }}/{{ session[1].loggedinTimeFirst.slice(6,8) }} {{ session[1].loggedinTimeFirst.slice(8,10) }}:{{ session[1].loggedinTimeFirst.slice(10,12) }}
                  </v-chip>
                </p>
              </div>

              <v-btn
                @click="logoutSession(session[0])"
                block
                class="ma-2 mx-auto rounded-lg"
                color="error"
              >
                <v-icon class="ma-1">
                  mdi:mdi-logout
                </v-icon>
                ログアウトさせる
              </v-btn>
            </v-expansion-panel-text>

          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </div>
  </div>
</template>