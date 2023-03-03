<script>
import { getSocket, getCookie, serverinfo } from "../socket.js";
const socket = getSocket();

export default {
    emits: ["login"],

    data() {
        return {
            authWindow: ["authWindow","mx-auto"], //CSS用

            servername: serverinfo.servername, //トップに表示する用

            tab: null, //タブ用
            Connected: false, //接続状況の保存用
            usernameForRegister: "", //登録したいユーザー名
            codeForRegister: "",
            pwForAuth: "", //入力されたパスワード

            success: false, //ログイン結果、成功用
            error: false //ログイン結果、失敗用
        }
    },

    methods: {
        requestAuth() {
            socket.emit("auth", this.pwForAuth);
            this.success = false;
            this.error = false;

        },

        requestRegister() {
            socket.emit("auth", this.usernameForRegister);
            this.success = false;
            this.error = false;

        }
    },

    mounted() {
        //console.log(this.$vuetify.theme);
        //this.$vuetify.theme.current.dark = false;
        //this.$vuetify.theme.set("light");

        this.servername = serverinfo.servername;
        
        //サーバーに接続できるまでループでクッキーが存在するなら認証開始
        const checkCookie = setInterval( () => {
            if ( getCookie("sessionid") !== "" ) {
                socket.emit("authByCookie", getCookie("sessionid"));
                console.log("checkCookie :: 認証リクエスト送信");
                clearInterval(checkCookie); //ループ削除

            }

            //Socketの接続が確認できていたらループ削除
            if ( socket.connected ) { //接続できているかどうか
                clearInterval(checkCookie); //ループ削除
                this.Connected = true;

            }

        }, 1000);

        //認証結果の受け取りと処理
        socket.on("authResult", (dat) => {
            //ログインできたらページ移動
            if ( dat.result ) {
                this.success = true; //成功を表示
                setTimeout(() => this.$emit("login"), 1000); //1.5秒待ってから遷移

            } else {
                this.error = true; //エラーを表示

            }
            
        });

        //サーバー名表示用
        socket.on("serverinfo", (dat) => {
            this.servername = dat.servername; //サーバーの名前更新

        });

    },

    unmounted() {
        //通信初期化用
        socket.off("authResult");
        socket.off("serverinfo");

    }

}

</script>

<template>
    <p class="text-h4" style="margin:5% auto; text-align:center">
        {{ servername }}
    </p>
    <v-card :class="authWindow" variant="tonal">
        <v-tabs
            v-model="tab"
            bg-color="primary"
            align-tabs="center"
        >
            <v-tab value="login">ログイン</v-tab>
            <v-tab value="register">登録</v-tab>
        </v-tabs>

        <v-window v-model="tab">
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
                        style="margin: 3% auto"
                        type="error"
                        title="🤔"
                        text="サーバーつながってなくない?"
                    ></v-alert>

                    <p>パスワード</p>
                    <v-text-field
                        style="width:100%"
                        v-model="pwForAuth"
                        clearable
                        :disabled="!Connected"
                        hint="乱数のやつ"
                    >
                        <span style="margin-right:6px" class="mdi mdi-lock"></span>
                    </v-text-field>
                    <br>
                    <v-btn :disabled="!Connected" @click="requestAuth" color="primary">認証</v-btn>
                    <br>

                    <v-alert
                        v-if="success"
                        style="width:100%; margin: 3% auto"
                        type="success"
                        title="ログイン成功"
                        text=""
                    ></v-alert>

                    <v-alert
                        v-if="error"
                        style="width:100%; margin: 3% auto"
                        type="error"
                        title="エラー"
                        text="ログイン失敗、パスワードを確認してね（またはBANされてそう）"
                    ></v-alert>
                </div>
            </v-window-item>

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
                        type="error"
                        title="🤔"
                        text="サーバーつながってなくない?"
                    ></v-alert>

                    <p>ユーザー名</p>
                    <v-text-field
                        style="width:100%"
                        v-model="usernameForRegister"
                        clearable
                    >
                        <span style="margin-right:6px" class="mdi mdi-account"></span>
                    </v-text-field>

                    <p>招待コード</p>
                    <v-text-field
                        style="width:100%"
                        v-model="codeForRegister"
                    >
                        <span style="margin-right:6px" class="mdi mdi-human-edit"></span>
                    </v-text-field>
                    <br>
                    <v-btn :disabled="!Connected && serverinfo.registerAvailable" @click="requestRegister" color="primary">登録</v-btn>
                    <br>

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