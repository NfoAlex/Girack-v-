<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { getCONFIG } from "../../config.js";
import { getSocket, setCookie } from "../../data/socket.js";
import { dataUser } from "../../data/dataUserinfo";

const socket = getSocket();

export default {
  setup() {
    //設定をインポート
    const { CONFIG_NOTIFICATION, CONFIG_DISPLAY, CONFIG_SYNC } = getCONFIG();
    const { myUserinfo } = dataUser();
    return { CONFIG_NOTIFICATION, CONFIG_DISPLAY, CONFIG_SYNC, myUserinfo };
  },

  data() {
    return {
      txt: "---",
      gameStarted: false,
      gameEnd: false,
      targetNum: 0,
      guessNum: 0,
      input: "",
      record: 0,

      //表示するページ
      configPage: "sync",

      //同期をオンにするとき用のダイアログ
      configSyncTogglingDialog: false,

      //復元用
      CurrentConfig: {},

      //joke
      dataConsent: true,
    };
  },

  watch: {
    //設定の変更を検知してCookieへ書き込み
    CONFIG_SYNC: {
      handler() {
        if (this.CONFIG_SYNC) this.configSyncTogglingDialog = true;
        setCookie("configSync", this.CONFIG_SYNC);
      },
    },
    CONFIG_NOTIFICATION: {
      handler() {
        setCookie("configNotify", JSON.stringify(this.CONFIG_NOTIFICATION), 7);
        if (this.CONFIG_SYNC) this.updateConfigWithServer();
      },
      deep: true,
    },
    CONFIG_DISPLAY: {
      handler() {
        setCookie("configDisplay", JSON.stringify(this.CONFIG_DISPLAY), 7);
        if (this.CONFIG_SYNC) this.updateConfigWithServer();
      },
      deep: true,
    },
  },

  methods: {
    start() {
      this.gameEnd = false;
      this.targetNum = parseInt(Math.random() * 100);
      this.gameStarted = true;
      this.input = "";
      this.guessNum = 0;
      this.txt = "";
      this.record = 0;
    },

    guess() {
      this.record++;
      this.guessNum = parseInt(this.input);

      if (this.guessNum === this.targetNum) {
        this.txt = "正解!";
        this.gameStarted = false;
        this.gameEnd = true;
        return;
      }

      if (this.guessNum > this.targetNum) {
        this.txt = "Lower...";
      }

      if (this.guessNum < this.targetNum) {
        this.txt = "Higher!";
      }
    },

    //サーバー上の設定情報を更新
    updateConfigWithServer() {
      //データ送信
      socket.emit("updateUserSaveConfig", {
        config: {
          CONFIG_DISPLAY: this.CONFIG_DISPLAY,
          CONFIG_NOTIFICATION: this.CONFIG_NOTIFICATION,
          LIST_NOTIFICATION_MUTE_CHANNEL: this.LIST_NOTIFICATION_MUTE_CHANNEL,
        },
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //ダイアログを非表示
      this.configSyncTogglingDialog = false;
    },

    //サーバー上の自分の設定情報を取得して適用
    bringConfigFromServer() {
      //サーバー上の自分の設定を取得
      socket.emit("getUserSaveConfig", {
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //ダイアログを非表示
      this.configSyncTogglingDialog = false;
    },

    //ブラウザの通知設定を確認
    checkNotificationPermission() {
      //もし通知が許可されていたらtrueを返す
      if (Notification.permission === "granted") {
        return true;
      } else {
        return false;
      }
    },

    //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
    humanFileSize(bytes, si=false, dp=1) {
      const thresh = si ? 1000 : 1024;

      console.log("Settings :: humanFileSize : bytes->", bytes);

      //略式サイズなら数字に変換
      if ( bytes.includes("e") ) {
        let NumOfZeros = bytes.slice(bytes.length-1); //使う0の数
        let ZerosInString = ""; //0を入れる変数
        for ( let i=0; i<NumOfZeros; i++ ) { ZerosInString+="0"; } //追加

        //文字列を統合して数字にする
        bytes = parseInt(bytes.split("e")[0] + ZerosInString);
      }

      if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
      }

      const units = si 
          ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
          : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
      let u = -1;
      const r = 10**dp;

      do {
        bytes /= thresh;
        ++u;
      } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

      return bytes.toFixed(dp) + ' ' + units[u];
    },

    //通知テスト
    doNotificationDemo() {
      new Notification("通知だな", {
        body: "これは通知テストです。",
        icon: "http://" + location.host + "/icon_crop.png",
      });
    },
  },
};
</script>

<template>
  <div>
    <!-- 同期設定をオンにするときの確認ダイアログ -->
    <v-dialog
      v-model="configSyncTogglingDialog"
      style="min-width: 650px; width: 50vh"
    >
      <v-card class="pa-6">
        <v-card-title> 同期の確認 </v-card-title>

        <v-card-text>
          <p class="">
            設定を同期するようにします。
            現在の設定をサーバー上の設定へ上書きしますか？
          </p>
        </v-card-text>

        <v-divider class=""></v-divider>

        <div class="ma-3">
          <v-btn
            @click="updateConfigWithServer"
            block
            color="error"
            class="my-2 rounded-lg"
          >
            はい。上書きしてください。
          </v-btn>
          <v-btn
            @click="bringConfigFromServer"
            block
            color="grey"
            class="my-2 rounded-lg"
          >
            いいえ。サーバー上の設定を取得して適用してください。
          </v-btn>
          <v-btn
            @click="
              CONFIG_SYNC = false;
              configSyncTogglingDialog = false;
            "
            block
            class="my-2 rounded-lg"
          >
            やっぱキャンセル
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <div
      style="width: 100%"
      class="d-flex align-center flex-column pa-6"
    >
      <div style="width: 90%;" class="text-left">
        <p class="text-left" style="font-size: min(4vh, 36px)">設定</p>
      </div>

      <!-- 設定ページボタン(サイドバー) -->
      <div style="width: 100%;">
        <div class="d-flex align-center">
          <div
            class="ma-1 align-center mx-auto rounded-lg d-flex align-center scroll"
            style="
              width: 95%;
              height: 7.5vh;
              overflow-x: auto;
              overflow-y: hidden;
            "
          >
            <v-btn
              @click="configPage = 'sync'"
              size="large"
              :color="configPage === 'sync' ? 'secondary' : 'grey'"
              class="ma-1 rounded-pill"
            >
              同期
            </v-btn>

            <v-btn
              @click="configPage = 'notification'"
              size="large"
              :color="configPage === 'notification' ? 'secondary' : 'grey'"
              class="ma-1 rounded-pill"
            >
              通知
            </v-btn>

            <v-btn
              @click="configPage = 'interface'"
              size="large"
              :color="configPage === 'interface' ? 'secondary' : 'grey'"
              class="ma-1 rounded-pill"
            >
              表示
            </v-btn>

            <v-btn
              @click="configPage = 'privacy'"
              size="large"
              :color="configPage === 'privacy' ? 'secondary' : 'grey'"
              class="ma-1 rounded-pill"
            >
              プライバシー
            </v-btn>

            <v-btn
              @click="configPage = 'game'"
              size="large"
              :color="configPage === 'game' ? 'secondary' : 'grey'"
              class="ma-1 rounded-pill"
            >
              ?
            </v-btn>
          </div>
        </div>
      </div>

      <!-- 設定ページメイン -->
      <div class="scroll" style="width: 100%; overflow-y: auto">
        <div class="mx-auto">
          <!-- 設定の同期 -->
          <v-card
            v-if="configPage === ('sync' || '')"
            class="mx-auto rounded-lg card"
          >
            <p class="text-h6 ma-2">同期</p>
            <p><v-icon>mdi:mdi-sync</v-icon>設定データの同期状態</p>
            <v-card color="cardInner" class="cardInner pa-3 rounded-lg">
              <v-switch v-model="CONFIG_SYNC" label="設定を同期する"></v-switch>
              <p class="text-subtitle-2">
                同期をオンにする際にサーバー上の設定データと同期するか確認されます。
              </p>
            </v-card>
          </v-card>

          <!-- 通知 -->
          <v-card
            v-if="configPage === 'notification'"
            class="mx-auto rounded-lg card"
          >
            <p class="text-h6 ma-2">通知</p>

            <p><v-icon>mdi:mdi-bell-cog</v-icon>許可状況</p>
            <v-card color="cardInner" class="cardInner pa-3 rounded-lg">
              <p v-if="checkNotificationPermission()">
                <v-icon color="success">mdi:mdi-check-bold</v-icon>
                通知いけるな
              </p>
              <p v-else>
                <v-icon color="yellow">mdi:mdi-help</v-icon>
                現在の設定だと通知が利用できません。
                ブラウザ設定からこのインスタンスURLによる通知を許可してください。
              </p>
              <v-btn
                class="ma-2"
                size="small"
                color="grey"
                @click="doNotificationDemo"
              >
                通知テスト
              </v-btn>
            </v-card>

            <br />

            <p><v-icon>mdi:mdi-bell</v-icon>通知する内容</p>
            <v-card color="cardInner" class="cardInner pa-3 rounded-lg">
              <v-checkbox
                v-model="CONFIG_NOTIFICATION.ENABLE"
                label="通知を有効化"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                :disabled="!CONFIG_NOTIFICATION.ENABLE"
                v-model="CONFIG_NOTIFICATION.NOTIFY_ALL"
                class="ml-3"
                label="すべてのメッセージを通知する"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                :disabled="!CONFIG_NOTIFICATION.ENABLE"
                v-model="CONFIG_NOTIFICATION.NOTIFY_MENTION"
                class="ml-3"
                label="メンションで通知する"
                density="compact"
                messages="'@<あなたの名前>'が含まれると通知"
              >
              </v-checkbox>
            </v-card>

            <br />

            <!-- 
                        <p><v-icon>mdi:mdi-tab</v-icon>タブ名に表示する通知</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            <v-checkbox
                                v-model="CONFIG_NOTIFICATION.DISPLAY_TAB_NEW"
                                label="新着数を表示"
                                density="compact"
                            >
                            </v-checkbox>
                            <v-checkbox
                                v-model="CONFIG_NOTIFICATION.DISPLAY_TAB_MENTION"
                                label="メンション数を表示"
                                density="compact"
                            >
                            </v-checkbox>
                            <p style="padding:0 5%;">
                                例:<br>
                                メンションが2件来てて、新着数が合計で6件なら<br>
                                <span v-if="CONFIG_NOTIFICATION.DISPLAY_TAB_MENTION">[!2]</span>
                                <span v-if="CONFIG_NOTIFICATION.DISPLAY_TAB_NEW">[6]</span>
                                #random
                            </p>
                        </v-card>
                        -->
          </v-card>

          <!-- UI表示 -->
          <v-card
            v-if="configPage === 'interface'"
            class="mx-auto rounded-lg card"
          >
            <p class="text-h6 ma-2">表示</p>

            <p><v-icon>mdi:mdi-chat</v-icon>チャット画面</p>
            <v-card color="cardInner" class="cardInner pa-3 rounded-lg">
              <v-checkbox
                v-model="CONFIG_DISPLAY.CONTENT_SHOW_ROLE"
                label="ユーザー名の横にロールを表示"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                v-model="CONFIG_DISPLAY.CONTENT_DATELINE_SHOWONLEFT"
                label="日付線の時間を左に表示"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                v-model="CONFIG_DISPLAY.CONTENT_GOBOTTOMFAB_SHOW"
                label="「下に行くボタン」を表示"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                v-model="CONFIG_DISPLAY.CONTENT_SCROLL_AUTOFETCHHISTORY"
                label="一番上へのスクロールで自動的に履歴を取得する"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                v-model="CONFIG_DISPLAY.CONTENT_SCROLL_ONNEWMESSAGE"
                label="新着メッセージが来た時にフォーカスしていなくてもスクロールする"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                v-model="CONFIG_DISPLAY.CONTENT_USE_EMOJI_PICKER"
                label="絵文字タブを使用する"
                density="compact"
              >
              </v-checkbox>
              <p class="ma-2">添付ファイルの最高サイズ (1e3=1kB)</p>
                <v-text-field
                  variant="outlined"
                  class="mx-auto"
                  style="width:90%"
                  :hint="humanFileSize(CONFIG_DISPLAY.CONTENT_DISPLAYIMAGESIZE,true)"
                  :persistent-hint="true"
                  v-model="CONFIG_DISPLAY.CONTENT_DISPLAYIMAGESIZE"
                >
                </v-text-field>
            </v-card>

            <br />

            <p><v-icon>mdi:mdi-format-list-group</v-icon>サイドバー</p>
            <v-card color="cardInner" class="cardInner pa-3 rounded-lg">
              <v-checkbox
                v-model="CONFIG_DISPLAY.SIDEBAR_SHOWREADALL_ENABLED"
                label="全チャンネル既読ボタンを有効化"
                density="compact"
              >
              </v-checkbox>
              <v-checkbox
                v-model="CONFIG_DISPLAY.SIDEBAR_SHOWREADALL_BYHOLDSHIFTKEY"
                :disabled="!CONFIG_DISPLAY.SIDEBAR_SHOWREADALL_ENABLED"
                class="ml-3"
                label="Shiftキーが押された間だけ全チャンネル既読ボタンを表示する"
                density="compact"
              >
              </v-checkbox>
            </v-card>
          </v-card>

          <!-- プライバシー(ネタ) -->
          <v-card
            v-if="configPage === 'privacy'"
            class="mx-auto rounded-lg card"
          >
            <p class="text-h6 ma-2">プライバシー</p>

            <p><v-icon>mdi:mdi-radar</v-icon>データ</p>
            <v-card color="cardInner" class="cardInner pa-3 rounded-lg">
              <v-checkbox
                v-model="dataConsent"
                readonly
                label="ブラウザ上のすべての動きのトラッキングを許可する"
                density="compact"
              >
              </v-checkbox>
            </v-card>
          </v-card>

          <v-card
            v-if="configPage === 'game'"
            class="mx-auto text-center pa-5 rounded-lg"
            style="width: 50%"
          >
            <p class="text-h5">{{ txt }}</p>
            <p v-if="gameStarted" class="text-h3">{{ guessNum }}</p>
            <v-btn @click="start" v-if="!gameStarted" color="primary">
              ゲーム開始
            </v-btn>
            <br />
            <v-text-field
              v-if="gameStarted"
              v-model="input"
              class="mx-auto"
              label="予想!"
              style="width: 50%"
              variant="solo"
            ></v-text-field>
            <v-btn @click="guess" class="ma-2" color="green" v-if="gameStarted">
              GUESS...
            </v-btn>
            <v-btn @click="start" class="ma-2" color="blue" v-if="gameEnd">
              もう１回やる
            </v-btn>

            <p>{{ record }}回目のトライ</p>
          </v-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cardInner {
  margin: 8px 0;
}

.card {
  width: 95%;
  margin-top: 16px;

  padding: 16px;
}

.scroll::-webkit-scrollbar {
  width: 5px;
}

.scroll::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

.scroll::-webkit-scrollbar-thumb {
  background-color: #666;
}
</style>
