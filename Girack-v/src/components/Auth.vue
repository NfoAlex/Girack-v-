<script>
import { getSocket, getCookie, CLIENT_VERSION } from "../data/socket.js";
const socket = getSocket();

export default {
    emits: ["login"],

    data() {
        return {
            authWindow: ["authWindow","mx-auto"], //CSS用

            //使うサーバーデータ
            serverinfoLoaded: {
                servername: "", //サーバーの名前
                //サーバーのアカウント登録設定
                registration: {
                    available: false, //登録できるかどうか
                    invite: {
                        inviteOnly: false //招待オンリーかどうか
                    }
                }
            },

            //見た目
            tab: null, //ログインと登録のタブ用
            Connected: false, //接続状況の保存用
            clientVersion: CLIENT_VERSION, //クライアントのバージョン
            clientVersionDifference: false, //サーバーとバージョンが違っていた時に見せるダイアログ

            //入力用
            usernameForRegister: "", //登録したいユーザー名
            invcodeForRegister: "", //登録に使う招待コード
            pwForAuth: "", //入力されたパスワード

            //結果用
            pwFromRegister: null, //登録したときにもらえるパスワード用
            registerResult: 0, //登録結果用,
            success: false, //ログイン結果、成功用
            error: false //ログイン結果、失敗用
        }
    },

    methods: {
        //認証申請
        requestAuth() {
            socket.emit("auth", this.pwForAuth, CLIENT_VERSION);
            this.success = false;
            this.error = false;

        },

        //登録申請
        requestRegister() {
            socket.emit("register", [this.usernameForRegister,this.invcodeForRegister]);
            this.success = false;
            this.error = false;
            this.registerResult = 0;

        },

        //認証結果の受け取りと処理
        SOCKETauthResult(dat) {
            //ログインできたらページ移動
            if ( dat.result ) {
                this.success = true; //成功を表示
                setTimeout(() => this.$emit("login"), 10); //画面遷移

            } else {
                this.error = true; //エラーを表示

            }

        },

        SOCKETregisterEnd(resultPassword) {
            //結果がダメならそう表示
            if ( resultPassword === -1 ) {
                this.registerResult = -1;
                return;

            }

            this.pwFromRegister = resultPassword; //パスワード更新
            this.registerResult = 1; //結果成功ととして表示

        },

        SOCKETinfoServer(dat) {
            this.serverinfoLoaded = dat; //サーバーの情報
            document.title = dat.servername; //ウェブサイトタイトルをインスタンス名に

            //もしサーバーとクライアントがバージョンが違っていたら
            if ( this.serverinfoLoaded.serverVersion !== CLIENT_VERSION ) {
                this.clientVersionDifference = true;

            }

        }
    },

    mounted() {
        socket.emit("getInfoServer"); //サーバーの情報を取得

        //クッキーに認証情報があるか確認
        if ( getCookie("sessionid") !== "" ) {
            console.log("Auth :: mounted : クッキーで認証します");
            socket.emit("authByCookie", getCookie("sessionid"), CLIENT_VERSION);

        }

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

    }

}

</script>

<template>
    <!-- バックエンドとバージョンに差があったときの表示 -->
    <v-dialog
        v-model="clientVersionDifference"
        style="width:50vw; min-width:400px; "
        persistent
    >
        <v-card class="pa-2 rounded-lg">
            <v-card-title>
                注意
            </v-card-title>
            <p class="pa-3">
                どうやらサーバーとクライアントでバージョンが違うようです
            </p>
            <v-card color="grey" class="pa-3 ma-4 rounded-lg flex-column d-flex justify-center align-center">
                <p>サーバーのバージョン : <code>{{ serverinfoLoaded.serverVersion }}</code></p>
                <p>クライアントのバージョン : <code>{{ clientVersion }}</code></p>
            </v-card>
        </v-card>
    </v-dialog>

    <!-- インスタンス名 -->
    <p class="text-h4" style="margin:2% auto; text-align:center">
        {{ serverinfoLoaded.servername }}
    </p>

    <v-card :class="[authWindow, 'rounded-lg']" variant="tonal">
        <!-- タブ表示 -->
        <v-tabs
            v-model="tab"
            bg-color="primary"
            align-tabs="center"
        >
            <v-tab value="login">ログイン</v-tab>
            <v-tab v-if="serverinfoLoaded.registration.available" value="register">登録</v-tab>
        </v-tabs>

        <v-window v-model="tab">
            <!-- ログイン -->
            <v-window-item value="login">
                <p class="text-h6" style="margin:10% auto; text-align:center">
                    Ayo
                </p>
                <div
                    class="d-flex justify-center flex-column"
                    style="margin:10% 10%;"
                >
                    <v-alert
                        v-if="!Connected"
                        class="rounded-lg"
                        style="margin: 3% auto"
                        icon="mdi:mdi-alert-circle"
                        type="error"
                        text="🤔サーバーつながってなくない?"
                    ></v-alert>

                    <p>パスワード</p>
                    <v-text-field
                        style="width:100%"
                        type="password"
                        v-model="pwForAuth"
                        prepend-inner-icon="mdi:mdi-lock"
                        clearable
                        :disabled="!Connected"
                        hint="乱数のやつ"
                    >
                        <v-icon icon="mdi:mid-lock" />
                    </v-text-field>
                    <br>
                    <v-btn :disabled="!Connected" @click="requestAuth" class="rounded-lg" color="primary">認証</v-btn>
                    <br>

                    <v-alert
                        v-if="success"
                        class="rounded-lg"
                        style="width:100%; margin: 3% auto"
                        type="success"
                        title="ログイン成功"
                        text=""
                    ></v-alert>

                    <v-alert
                        v-if="error"
                        class="rounded-lg"
                        style="width:100%; margin: 3% auto"
                        icon="mdi:mdi-alert-circle"
                        type="error"
                        title="エラー"
                        text="ログイン失敗、パスワードを確認してね（またはBANされてそう）"
                    ></v-alert>
                </div>
            </v-window-item>

            <!-- 登録 -->
            <v-window-item value="register">
                <p class="text-h6" style="margin:10% auto; text-align:center">
                    ようこそ!
                </p>
                <div
                    class="d-flex justify-center flex-column"
                    style="margin:10% 10%;"
                >
                    <v-alert
                        v-if="!Connected"
                        style="margin: 3% auto"
                        icon="mdi:mdi-alert-circle"
                        type="error"
                        title="🤔"
                        text="サーバーつながってなくない?"
                    ></v-alert>

                    <div v-if="registerResult<=0"><!--登録前用-->

                        <p>ユーザー名</p>

                        <v-text-field
                            style="width:100%"
                            v-model="usernameForRegister"
                            clearable
                        >
                            <span style="margin-right:6px" class="mdi mdi-account"></span>
                        </v-text-field>

                        <div v-if="serverinfoLoaded.registration.invite.inviteOnly">
                            <p>招待コード</p>
                            <v-text-field
                                style="width:100%"
                                v-model="invcodeForRegister"
                            >
                                <span style="margin-right:6px" class="mdi mdi-human-edit"></span>
                            </v-text-field>
                        </div>

                        <br>
                        <v-btn
                            :disabled="!Connected && serverinfo.registration.available"
                            @click="requestRegister"
                            class="rounded-lg mx-auto"
                            color="primary"
                            block
                        >
                            登録
                        </v-btn>
                        <br>

                        <v-alert
                        v-if="registerResult===-1"
                        style="width:100%; margin: 3% auto"
                        icon="mdi:mdi-alert-circle"
                        type="error"
                        title="エラー"
                        text="登録失敗、招待コード合ってる?"
                    ></v-alert>

                    </div>
                    <div v-if="registerResult===1"><!--登録後-->
                        <p class="text-h4" style="text-align:center">🥰</p>
                        <p class="text-h5" style="text-align:center">登録あざ</p>
                        <br>
                        <v-text-field v-model="pwFromRegister" readonly>
                            <span class="mdi mdi-lock"></span>
                        </v-text-field>
                    </div>

                </div>
            </v-window-item>

        </v-window>
    </v-card>
</template>

<style scoped>

.authWindow
{
    margin: 5%;
    padding: 3% auto;

    width: 40%;
    height: 65%;
}

</style>