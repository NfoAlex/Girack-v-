<!-- eslint-disable vue/multi-word-component-names -->
<script>
import {
  setCookie,
  getSocket,
  Serverinfo,
} from "../../data/socket.js";
import { dataUser } from "../../data/dataUserinfo";

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    return { myUserinfo, Serverinfo };
  },

  data() {
    return {
      snackbar: false, //ログアウトアラート出力用
      okayIcon: "",
      imgsrc: window.location.origin + "/img/",

      //ユーザー名
      nameChangeDialog: false, //ユーザー名変更用のダイアログ
      nameChangingValue: "...", //変更するためのユーザー名変数
      canUseThisName: false, //変更にこの名前を使えるかどうか
      resultNameNotAvailable: false,
      resultNameTooShort: true,

      //パスワード変更用
      changePasswordDialog: false,
      changePasswordResult: 0, //パスワードの変更結果=> 1=成功, -1=失敗
      currentPassword: "",
      newPassword: "",
      newPasswordCheck: "",

      iconUploadDialog: false, //アイコンアップロード用ダイアログの表示
      iconUploadRule: [
        //アイコンをアップロードするためのルール
        (value) => {
          return (
            !value ||
            !value.length ||
            value[0].size <
              Serverinfo.value.config.PROFILE.PROFILE_ICON_MAXSIZE ||
            "画像サイズが大きいです!"
          );
        },
      ],
      iconUploadFile: null, //アイコン用画像のデータ
      iconUploadable: false, //アイコンをアップロードできる状態かどうか
      iconUploadDone: false, //アイコンがアップロードされた状態
    };
  },

  watch: {
    //変更するユーザー名変数
    nameChangingValue: {
      handler() {
        //名前の長さが２文字以上なら検索開始
        if (this.nameChangingValue.length >= 2) {
          //名前検索
          socket.emit("searchUserDynamic", {
            query: this.nameChangingValue,
            reqSender: {
              userid: this.myUserinfo.userid,
              sessionid: this.myUserinfo.sessionid
            }
          });
          this.resultNameTooShort = false;
        } else {
          this.canUseThisName = false;
          this.resultNameNotAvailable = false;
          this.resultNameTooShort = true;
        }
      }
    },

    //ファイルのアップロード状態を監視してアップロードできるかどうかを設定
    iconUploadFile: {
      handler() {
        try {
          //ファイルサイズが3MB以上なら無効化
          if (this.iconUploadFile[0].size > 3072000) {
            this.iconUploadable = false;
          } else {
            this.iconUploadable = true;
          }
        } catch (e) {
          this.iconUploadable = false;
        }
      },
    },
  },

  methods: {
    //ログアウト処理
    logout() {
      setCookie("session", "", 0); //クッキー削除
      //ログアウトするとサーバーへ通達
      socket.emit("logout", {
        targetSessionid: this.myUserinfo.sessionid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
      location.reload(); //ページリロード
    },

    //パスワードを変更
    changePassword() {
      //パスワードを変更申請
      socket.emit("changePassword", {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //名前更新
    updateName() {
      let nameUpdating = this.nameChangingValue; //更新する名前
      //名前更新
      socket.emit("changeProfile", {
        name: nameUpdating, //更新する名前
        targetid: this.myUserinfo.userid, //対象ユーザーID(自分)
        reqSender: {
          //セッション認証に必要な情報送信
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
    humanFileSize(bytes, si = false, dp = 1) {
      const thresh = si ? 1000 : 1024;

      //略式サイズなら数字に変換
      if (bytes.includes("e")) {
        let NumOfZeros = bytes.slice(bytes.length - 1); //使う0の数
        let ZerosInString = ""; //0を入れる変数
        for (let i = 0; i < NumOfZeros; i++) {
          ZerosInString += "0";
        } //追加

        //文字列を統合して数字にする
        bytes = parseInt(bytes.split("e")[0] + ZerosInString);
      }

      if (Math.abs(bytes) < thresh) {
        return bytes + " B";
      }

      const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
      );

      return bytes.toFixed(dp) + " " + units[u];
    },

    //アイコンの画像アップロード
    uploadIcon() {
      console.log("Profile :: uploadIcon : iconData ->", this.iconUploadFile);
      //return;

      //アイコンデータを送信
      socket.emit(
        "changeProfileIcon",
        {
          fileData: {
            name: this.iconUploadFile[0].name,
            size: this.iconUploadFile[0].size,
            type: this.iconUploadFile[0].type,
            buffer: this.iconUploadFile[0],
          },
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        },
        (status) => {
          console.log("Profile :: uploadIcon : 結果->", status);
          console.log(this.iconUploadFile[0]);
        }
      );

      //アイコンをアップロードできた状態にする
      this.iconUploadDone = true;
    },

    //ページをリロードするだけ
    reloadPage() {
      window.location.reload();
    },

    //ユーザー名変更用の名前検索ハンドラ
    SOCKETinfoSearchUser(result) {
      //結果を一つずつ調べる
      for (let index in result) {
        //名前が検索結果にあったら
        if (result[index].username === this.nameChangingValue) {
          //この名前を使えないと設定
          this.canUseThisName = false;
          this.resultNameNotAvailable = true;

          return;
        }
      }

      //この名前を使えると設定
      this.resultNameNotAvailable = false;
      this.canUseThisName = true;
    }
  },

  mounted() {
    this.nameChangingValue = this.myUserinfo.username;

    //結果の受け取り
    socket.on("changePasswordResult", (result) => {
      this.changePasswordResult = result;
    });
    socket.on("infoSearchUser", this.SOCKETinfoSearchUser);

  },

  unmounted() {
    //通信重複防止
    socket.off("changePasswordResult");
    socket.off("infoSearchUser", this.SOCKETinfoSearchUser);
  },
};
</script>

<template>
  <div>
    <!-- 画像アップロード用ダイアログ -->
    <v-dialog v-model="iconUploadDialog" style="min-width: 650px; width: 50vh">
      <v-card v-if="!iconUploadDone" class="pa-4">
        <v-card-title> アイコンアップロード </v-card-title>

        <v-card-text>
          <v-alert title="注意" type="info" color="grey">
            <p class="text-subtitle-2">
              現在アイコンのクロップ機能が実装できていないため縦横比率が違う画像の場合
              表示がおかしくります。だから予め自分でクロップしてね
            </p>
          </v-alert>

          <v-file-input
            accept="image/jpeg, image/gif, image/png"
            :rules="iconUploadRule"
            v-model="iconUploadFile"
            variant="underlined"
            :label="
              'アイコン用画像(' +
              humanFileSize(
                Serverinfo.config.PROFILE.PROFILE_ICON_MAXSIZE,
                true
              ) +
              '以下)'
            "
            show-size
          ></v-file-input>
        </v-card-text>

        <v-card-action>
          <v-btn
            :disabled="!iconUploadable"
            @click="uploadIcon"
            color="primary"
            block
          >
            更新
          </v-btn>
        </v-card-action>
        
      </v-card>

      <v-card v-if="iconUploadDone" class="rounded-lg">
        <v-card-title> アイコンアップロード </v-card-title>

        <div style="margin-top: 32px">
          <p class="text-h4 text-center">🖼️</p>
          <p class="text-center ma-4">
            アイコンを更新しました!<br />
            更新を確認するにはリロードしてみてね
          </p>
          <div class="mx-auto pa-1" style="width: fit-content">
            <v-btn
              class="ma-2 rounded-lg"
              @click="reloadPage"
              color="secondary"
            >
              <v-icon> mdi:mdi-reload </v-icon>
              リロード
            </v-btn>
            <v-btn
              class="ma-2 rounded-lg"
              @click="iconUploadDialog = false"
              color="grey"
            >
              <v-icon> mdi:mdi-close-box </v-icon>
              閉じる
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- パスワードを変えるためのダイアログ -->
    <v-dialog
      v-model="changePasswordDialog"
      style="min-width: 650px; width: 50vh"
    >
      <!-- 変更画面 -->
      <v-card v-if="changePasswordResult !== 1" class="pa-4">
        <v-card-title> パスワードを変更 </v-card-title>

        <v-card-text>
          <p>今のパスワード</p>
          <v-text-field
            v-model="currentPassword"
            variant="outlined"
            type="password"
          >
          </v-text-field>

          <p>新しいパスワード</p>
          <v-text-field
            v-model="newPassword"
            variant="outlined"
            type="password"
            maxlength="128"
            hint="16文字以上"
            counter
          >
          </v-text-field>

          <p>確認</p>
          <v-text-field
            v-model="newPasswordCheck"
            variant="outlined"
            type="password"
            maxlength="128"
          >
          </v-text-field>
        </v-card-text>

        <v-card-action>
          <v-btn
            @click="changePassword"
            color="secondary"
            :disabled="
              newPasswordCheck !== newPassword ||
              newPassword.length < 16 ||
              currentPassword.length === 0
            "
            block
          >
            パスワード変更
          </v-btn>
        </v-card-action>

        <v-alert
          v-if="
            newPasswordCheck.length >= 1 && newPasswordCheck !== newPassword
          "
          type="error"
          class="mt-3"
        >
          確認用のパスワードが一致しません
        </v-alert>

        <v-alert
          v-if="changePasswordResult === -1"
          type="error"
          class="mt-3"
        >
          現在のパスワードで認証ができませんでした
        </v-alert>
      </v-card>

      <!-- 変更に成功した画面 -->
      <v-card v-if="changePasswordResult === 1" class="pa-4">
        <v-card-title> パスワードを変更 </v-card-title>
        <span class="d-flex flex-column align-center pa-1 my-2">
          <p class="text-h4 pa-2">😏</p>
          <p>パスワードの変更ができました!</p>
        </span>

        <v-btn
          @click="changePasswordDialog = false"
          color="secondary"
          block
        >
          閉じる
        </v-btn>
      </v-card>
    </v-dialog>

    <!-- ユーザー名変更用ダイアログ -->
    <v-dialog
      v-model="nameChangeDialog"
      style="max-width:650px;"
      width="50vh"
    >
      <v-card class="rounded-lg pa-4">
        <v-card-title>
          ユーザー名変更
        </v-card-title>

        <!-- 入力欄 -->
        <v-card-text>
          <p class="mb-1">新しいユーザー名</p>
          <v-text-field v-model="nameChangingValue"></v-text-field>
          <v-alert>
            名前の空き :
            <span v-if="resultNameTooShort">
              名前を入力してください(２文字以上)
            </span>
            <span v-if="!resultNameTooShort&&resultNameNotAvailable">
              この名前はすでに使われています。
            </span>
            <span v-if="!resultNameTooShort&&!resultNameNotAvailable">
              使えます!
            </span>
          </v-alert>
        </v-card-text>

        <!-- ボタン -->
        <v-card-action>
          <v-btn
            @click="updateName();nameChangeDialog=false;"
            :disabled="!canUseThisName"
            class="ma-1"
            variant="flat"
            color="primary"
          >
            変更する
          </v-btn>
          <v-btn
            @click="nameChangeDialog=false;"
            class="ma-1 rounded"
            variant="text"
            color=""
          >
            キャンセル
          </v-btn>
        </v-card-action>

      </v-card>
    </v-dialog>

    <!-- プロフィールメイン画面 -->
    <div class="px-6 pt-6" style="height:100%; overflow-y:auto;">
      <v-container>
        <v-row no-gutters>
          <!-- アバター -->
          <v-col cols="2">
            <v-card variant="tonal" style="padding: 0">
              <v-img
                @click="iconUploadDialog = true"
                class="rounded-lg"
                :alt="myUserinfo.userid"
                :src="imgsrc + myUserinfo.userid"
              >
                <v-tooltip
                  activator="parent"
                  location="top center"
                  origin="overlap"
                >
                  アイコンを変更
                </v-tooltip>
              </v-img>
            </v-card>
          </v-col>

          <!-- ユーザー名の部分 -->
          <v-col cols="10" class="d-flex align-center">
            <div variant="tonal" class="pl-4" style="width: 100%">
              <span class="d-flex flex-column justify-start" style="width: 100%">

                <!-- ユーザーID -->
                <p class="text-left text-h6"># {{ myUserinfo.userid }}</p>

                <div class="d-flex align-center justify-space-between " style="width:100%;">

                  <!-- ユーザー名 -->
                  <p class="text-h4 text-left text-truncate">
                    {{ myUserinfo.username }}
                  </p>

                  <!-- ユーザー名編集ボタン -->
                  <v-btn
                    color="primary"
                    icon="mdi:mdi-pencil"
                    @click="nameChangeDialog=true;"
                    class="rounded ml-2"
                  ></v-btn>

                </div>

              </span>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <v-divider></v-divider>

      <v-container>
        <!-- パスワード変更 -->
        <v-row no-gutters>
          <div style="width: 100%">
            <v-btn
              @click="changePasswordDialog = true"
              class="rounded-lg mb-5"
              color="secondary"
              block
            >
              パスワードを変更
            </v-btn>
          <!-- ログアウトボタン -->
            <v-btn
              prepend-icon="mdi:mdi-logout"
              class="rounded-lg"
              color="error"
              block
              @click="snackbar = true"
            >
              Logout
            </v-btn>
            <v-snackbar v-model="snackbar">
              ログアウトしていいの？

              <template v-slot:actions>
                <v-btn color="pink" variant="text" @click="logout">
                  うん！
                </v-btn>
              </template>
            </v-snackbar>
          </div>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.menu-card {
  margin: 16px 12.5%;
  padding: 7.5% 0;
  text-align: center;
}
</style>
