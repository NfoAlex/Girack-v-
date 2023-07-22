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
      sessionDataCurrent: {
        sessionName: "",
        loggedinTime: "",
        loggedinTimeFirst: ""
      },
      sessionDataCurrentAvailable: false,

      fullSessionidDisplayingMine: false,
      fullSessionidDisplayIndex: -1,

      editingSessionNameMine: false,
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

      //変数のセッション名を初期化
      this.editingSessionnameTxt = "";
    },

    //特定のセッションをログアウトさせる
    logoutSession(sessionid) {
      //ログアウトさせる
      socket.emit("logout", {
        targetSessionid: sessionid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
      //セッションデータの再取得
      this.refreshSessionData();
    },

    //セッションデータの受け取り
    SOCKETInfoSessions(dat) {
      //セッションデータをJSON用変数へ保存
      this.sessionData = dat;
      //自分のデータを取り出して表示用JSON用変数から削除
      try {
        this.sessionDataCurrent = structuredClone(dat[this.myUserinfo.sessionid]);
        delete this.sessionData[this.myUserinfo.sessionid];
        this.sessionDataCurrentAvailable = true; //自分のデータあると設定
      } catch(e) {
        console.log("Sessionmanage :: SOCKETInfoSessions : 無理だわ", e);
      }
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
    socket.off("infoSessions", this.SOCKETInfoSessions);
    this.sessionDataCurrentAvailable = false;
  }
}

</script>

<template>
  <div>
    <div class="mx-auto d-flex flex-column" style="width: 90%; height:100vh;">
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
      
      <!--今アクティブなセッション -->
      <h3 class="ma-1">現在のセッション</h3>
      <v-expansion-panels v-if="sessionDataCurrentAvailable" style="width: 100%">
        <v-expansion-panel
          class="rounded-lg"
        >
          <v-expansion-panel-title color="grey">
            <span class="text-truncate flex-grow-1">
              <b>{{ sessionDataCurrent.sessionName }}</b> ( {{ myUserinfo.sessionid.slice(0,5) }}... )
            </span>
            <v-chip style="margin-right: 5%" size="small">
              最終ログイン : {{ sessionDataCurrent.loggedinTime.slice(0,4) }}/{{ sessionDataCurrent.loggedinTime.slice(4,6) }}/{{ sessionDataCurrent.loggedinTime.slice(6,8) }} {{ sessionDataCurrent.loggedinTime.slice(8,10) }}:{{ sessionDataCurrent.loggedinTime.slice(10,12) }}
            </v-chip>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <!-- セッション名変更部分 -->
            <v-btn
              v-if="!editingSessionNameMine"
              @click="editingSessionNameMine=true"
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
                  @click="updateSessionName(myUserinfo.sessionid);editingSessionNameMine=false"
                  class="rounded-lg ma-1"
                  size="x-small"
                  icon="mdi:mdi-check-bold"
                  color="secondary"
                >
                </v-btn>
                <v-btn
                  @click="editingSessionNameMine=false"
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
                  v-if="fullSessionidDisplayingMine"
                  @click="fullSessionidDisplayingMine=false"
                  class="ma-1"
                  style="color:rgb(var(--v-theme-success))"
                >
                  {{ myUserinfo.sessionid }}
                </code>
                <v-btn
                  v-else
                  @click="fullSessionidDisplayingMine=true"
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
                  {{ sessionDataCurrent.loggedinTimeFirst.slice(0,4) }}/{{ sessionDataCurrent.loggedinTimeFirst.slice(4,6) }}/{{ sessionDataCurrent.loggedinTimeFirst.slice(6,8) }} {{ sessionDataCurrent.loggedinTimeFirst.slice(8,10) }}:{{ sessionDataCurrent.loggedinTimeFirst.slice(10,12) }}
                </v-chip>
              </p>
            </div>
          </v-expansion-panel-text>

        </v-expansion-panel>
      </v-expansion-panels>

      <v-divider class="ma-3"></v-divider>

      <!-- 他のセッション -->
      <v-expansion-panels v-if="sessionData!=={}" style="overflow-y:auto; padding-bottom:5%">
        <v-expansion-panel
          v-for="(session,index) in Object.entries(sessionData)"
          :key="index"
          class="rounded-lg"
        >

          <v-expansion-panel-title>
            <span class="text-truncate flex-grow-1">
              <b>{{ session[1].sessionName }}</b> ( {{ session[0].slice(0,5) }}... )
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
              @dblclick="logoutSession(session[0])"
              block
              class="ma-2 mx-auto rounded-lg"
              color="error"
            >
              <v-icon class="ma-1">
                mdi:mdi-logout
              </v-icon>
              ダブルクリックでログアウトさせる
            </v-btn>
          </v-expansion-panel-text>

        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>