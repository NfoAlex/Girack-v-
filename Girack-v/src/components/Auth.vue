<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { getSocket, getCookie, CLIENT_VERSION } from "../data/socket.js";
import { useDisplay } from "vuetify";
const socket = getSocket();

export default {
  emits: ["login"],

  setup() {
    const { mobile } = useDisplay();
    return { mobile };
  },

  data() {
    return {
      //使うサーバーデータ
      serverinfoLoaded: {
        servername: "", //サーバーの名前
        //サーバーのアカウント登録設定
        registration: {
          available: false, //登録できるかどうか
          invite: {
            inviteOnly: false, //招待オンリーかどうか
          },
        },
      },

      //背景用CSS
      backgroundSrc: "url(" + window.location.origin + "/pancake.jpg)",

      //セッション用クッキーが保存されているかどうか
      hasSessionCookie: false,

      //見た目
      tab: null, //ログインと登録のタブ用
      Connected: false, //接続状況の保存用
      clientVersion: CLIENT_VERSION, //クライアントのバージョン
      clientVersionDifference: false, //サーバーとバージョンが違っていた時に見せるダイアログ

      //入力用
      usernameForRegister: "", //登録したいユーザー名
      invcodeForRegister: "", //登録に使う招待コード
      unForAuth: "", //入力されたユーザー名
      pwForAuth: "", //入力されたパスワード

      //結果用
      pwFromRegister: null, //登録したときにもらえるパスワード用
      registerResult: 0, //登録結果用,
      success: false, //ログイン結果、成功用
      error: false, //ログイン結果、失敗用
    };
  },

  computed: {
    //スマホ版かどうか返すだけ
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //認証申請
    requestAuth() {
      socket.emit("auth", {username:this.unForAuth, password:this.pwForAuth}, CLIENT_VERSION);
      this.success = false;
      this.error = false;
    },

    //クッキーでの認証
    requestAuthByCookie() {
      //クッキーに認証情報があるか確認
      if (getCookie("session") !== "") {
        try {
          console.log("Auth :: mounted : クッキーで認証します");
          
          //クッキーからユーザー名とセッションIDを抽出
          let userid = JSON.parse(getCookie("session")).userid;
          let sessionid = JSON.parse(getCookie("session")).sessionid;

          //認証する
          socket.emit(
            "authBySession",
            {
              userid: userid,
              sessionid: sessionid
            },
            CLIENT_VERSION
          );
        } catch(e) {console.log("Auth :: mounted : クッキー認証エラー->", e);}
      }
    },

    //登録申請
    requestRegister() {
      socket.emit("register", {
        username: this.usernameForRegister,
        code: this.invcodeForRegister,
      });
      this.success = false;
      this.error = false;
      this.registerResult = 0;
    },

    //認証結果の受け取りと処理
    SOCKETauthResult(dat) {
      //ログインできたらページ移動
      if (dat.result) {
        this.success = true; //成功を表示
        setTimeout(() => this.$emit("login"), 10); //画面遷移
      } else {
        this.error = true; //エラーを表示
      }
    },

    SOCKETregisterEnd(resultPassword) {
      console.log(resultPassword);
      //結果がダメならそう表示
      if (resultPassword.result !== "SUCCESS") {
        this.registerResult = resultPassword.result;
        return;
      }

      this.pwFromRegister = resultPassword.pass; //パスワード更新
      this.registerResult = resultPassword.result; //結果成功ととして表示
    },

    SOCKETinfoServer(dat) {
      this.serverinfoLoaded = dat; //サーバーの情報
      document.title = dat.servername; //ウェブサイトタイトルをインスタンス名に

      //もしサーバーとクライアントがバージョンが違っていたらアラート
      if (this.serverinfoLoaded.serverVersion !== CLIENT_VERSION) {
        this.clientVersionDifference = true;
      } else if (this.hasSessionCookie) {//違っていてクッキーがあれば認証
        this.requestAuthByCookie();
      }
    },
  },

  mounted() {
    socket.emit("getInfoServer"); //サーバーの情報を取得

    if (getCookie("session") !== "") this.hasSessionCookie = true;

    //認証結果の受け取りと処理
    socket.on("authResult", this.SOCKETauthResult);

    //登録ができたと受信したときの処理
    socket.on("registerEnd", this.SOCKETregisterEnd);

    //サーバー名表示用
    socket.on("infoServer", this.SOCKETinfoServer);

    //接続確認できたら接続できた状態にする
    socket.on("connect", () => {
      this.Connected = true;
    });
  },

  unmounted() {
    //通信の重複防止
    socket.off("authResult", this.SOCKETauthResult);
    socket.off("registerEnd", this.SOCKETregisterEnd);
    socket.off("infoServer", this.SOCKETinfoServer);
  },
};
</script>

<template>
  <!-- バックエンドとバージョンに差があったときの表示 -->
  <v-dialog
    v-model="clientVersionDifference"
    style="width: 50vw; min-width: 400px"
    persistent
  >
    <v-card class="pa-4">
      <v-card-title> 注意 </v-card-title>
      <v-card-text>
        <div class="py-2">
          <p>
            どうやらサーバーとクライアントでバージョンが違うようです
          </p>
          <p>
            一部機能を使用できない可能性があります。
          </p>
        </div>
        <v-card
          color="grey"
          class="pa-3 my-2 flex-column d-flex justify-center align-center"
        >
          <p>
            サーバーのバージョン :
            <code>{{ serverinfoLoaded.serverVersion }}</code>
          </p>
          <p>
            クライアントのバージョン : <code>{{ clientVersion }}</code>
          </p>
        </v-card>
        <v-divider class="my-2"></v-divider>
        <v-card-action>
          <v-btn @click="$router.go(0)" color="secondary">リロードしてみる</v-btn>
          <v-btn
            v-if="hasSessionCookie"
            @click="requestAuthByCookie"
            variant="text"
            class="ml-2"
          >
            このまま認証する
          </v-btn>
          <v-btn
            v-if="!hasSessionCookie"
            @click="()=>{clientVersionDifference=false}"
            variant="text"
            class="ml-2"
          >
            閉じる
          </v-btn>
        </v-card-action>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 壁紙用 -->
  <div class="authWindowBackground"></div>

  <!-- メイン -->
  <div style="height:100vh" class="authWindow d-flex align-center">

    <v-card class="mx-auto elevation-12" width="45%" style="max-width:600px">

      <!-- 登録/ログイン部分 -->
      <div class="py-10 mx-auto" style="width:80%;">
        <!-- タブ -->
        <v-tabs
          v-model="tab"
          class="mx-auto rounded-lg"
          bg-color="primary"
          align-tabs="center"
          style="width:fit-content"
        >
          <v-tab :disabled="!Connected" value="login">ログイン</v-tab>
          <v-tab
            v-if="serverinfoLoaded.registration.available"
            value="register"
          >登録</v-tab>
        </v-tabs>

        <!-- ログイン/登録ウィンドウ -->
        <v-window v-model="tab" class="">
          <!-- ログイン画面 -->
          <v-window-item value="login">
            <p class="text-h5 text-center my-3">
              おかえりなさい！
            </p>
            <div class="d-flex justify-center flex-column">
              <!-- 接続無い用アラート -->
              <v-alert
                v-if="!Connected"
                style="margin: 3% auto"
                icon="mdi:mdi-alert-circle"
                type="error"
                text="🤔サーバーつながってなくない?"
              ></v-alert>

              <!-- 入力欄 -->
              <p>ユーザー名</p>
              <v-text-field
                v-model="unForAuth"
                style="width: 100%"
                variant="solo-filled"
                type="text"
                @keydown.enter="requestAuth"
                prepend-inner-icon="mdi:mdi-account"
                clearable
                :disabled="!Connected"
              >
              </v-text-field>

              <p>パスワード</p>
              <v-text-field
                v-model="pwForAuth"
                style="width: 100%"
                variant="solo-filled"
                type="password"
                @keydown.enter="requestAuth"
                prepend-inner-icon="mdi:mdi-lock"
                clearable
                :disabled="!Connected"
                hint="乱数のやつ"
              >
              </v-text-field>

              <!-- ログインボタン -->
              <v-btn
                :disabled="!Connected"
                @click="requestAuth"
                color="primary"
                class="my-3"
              >認証
              </v-btn>

              <v-alert
                v-if="success"
                style="width: 100%; margin: 3% auto"
                type="success"
                title="ログイン成功"
                text=""
              ></v-alert>

              <v-alert
                v-if="error"
                style="width: 100%; margin: 3% auto"
                icon="mdi:mdi-alert-circle"
                type="error"
                title="エラー"
                text="ログイン失敗、パスワードを確認してね（またはBANされてそう）"
              ></v-alert>
            </div>
          </v-window-item>

          <!-- 登録画面 -->
          <v-window-item value="register">
            <p class="text-h5 text-center my-3">
              ようこそ!
            </p>
            <div class="d-flex justify-center flex-column">
              <!-- 接続無い用アラート -->
              <v-alert
                v-if="!Connected"
                style="margin: 3% auto"
                icon="mdi:mdi-alert-circle"
                type="error"
                title="🤔"
                text="サーバーつながってなくない?"
              ></v-alert>

              <!-- 登録結果によって変わる部分 -->
              <div v-if="registerResult !== 'SUCCESS'">
                <!--登録前用-->

                <p>ユーザー名</p>

                <v-text-field
                  v-model="usernameForRegister"
                  variant="solo-filled"
                  style="width: 100%"
                  hint="3文字以上"
                  prepend-inner-icon="mdi:mdi-account"
                  clearable
                >
                </v-text-field>

                <div v-if="serverinfoLoaded.registration.invite.inviteOnly">
                  <p>招待コード</p>
                  <v-text-field
                    v-model="invcodeForRegister"
                    variant="solo-filled"
                    style="width: 100%"
                    prepend-inner-icon="mdi:mdi-human-edit"
                  >
                  </v-text-field>
                </div>

                <v-btn
                  :disabled="(!Connected && serverinfo.registration.available) || (usernameForRegister.length <= 3)"
                  @click="requestRegister"
                  class="my-3"
                  color="primary"
                  block
                >
                  登録
                </v-btn>

                <v-alert
                  v-if="registerResult === 'FAILED'"
                  style="width: 100%; margin: 3% auto"
                  icon="mdi:mdi-alert-circle"
                  type="error"
                  title="エラー"
                  text="登録失敗、招待コード合ってる?"
                ></v-alert>
              </div>
              <div v-if="registerResult === 'SUCCESS'">
                <!--登録後-->
                <p class="text-h4 ma-2 text-center">🥰</p>
                <p class="text-h5 ma-1 text-center">登録完了</p>
                <p class="text-h5 ma-3 text-center">
                  👉<span class="text-truncate">{{ usernameForRegister }}</span>👈
                </p>
                <br />
                <v-text-field v-model="pwFromRegister" readonly>
                  <span class="mdi mdi-lock"></span>
                </v-text-field>
              </div>
            </div>
          </v-window-item>
        </v-window>
        
      </div>

    </v-card>
  </div>
</template>

<style scoped>

.welcomeImage {
  background-size: cover;
  background-image: linear-gradient(to bottom, rgba(189, 189, 189, 0.02), rgba(0, 0, 0, 0.83)), v-bind(backgroundSrc);
}

.authWindowBackground {
  position: absolute;
  filter: blur(11px) brightness(30%);
  background-image: v-bind(backgroundSrc);
  z-index: 0;
  height:100%;
  width:100%;
}

</style>
