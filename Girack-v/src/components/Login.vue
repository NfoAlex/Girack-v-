<script>
import { getSocket, getCookie } from "../socket.js";
const socket = getSocket();

export default {
    emits: ["login"],

    data() {
        return {
            pw: "",
            success: false,
            error: false
        }
    },

    methods: {
        requestAuth() {
            socket.emit("auth", this.pw);
            this.success = false;
            this.error = false;

        }
    },

    mounted() {
        console.log(getCookie("sessionid"));
        //クッキーが存在するなら認証開始
        const checkCookie = setInterval( () => {
            if ( getCookie("sessionid") !== "" ) {
                socket.emit("authByCookie", getCookie("sessionid"));
                console.log("checkCookie :: 認証リクエスト送信");

            }

            //Socketの接続が確認できていたらループ削除
            if ( socket.connected ) {
                clearInterval(checkCookie);
                console.log("checkCookie :: ループ削除");

            }

        }, 1000);

        //認証結果の受け取りと処理
        socket.on("authResult", (dat) => {
            //ログインできたらページ移動
            if ( dat.result ) {
                this.success = true; //成功を表示
                setTimeout(() => this.$emit("login"), 1500); //1.5秒待ってから遷移

            } else {
                this.error = true; //エラーを表示

            }
            
        });

    }

}

</script>

<template>
    <v-text-field
        style="width:50%"
        v-model="pw"
        clearable
        label="パスワード"
        hint="乱数のやつ"
    ></v-text-field>
    <br>
    <v-btn @click="requestAuth">認証</v-btn>
    <br>
    
    <v-alert
        v-if="success"
        style="width:80%; margin: 1% auto"
        type="success"
        title="ログイン成功"
        text=""
    ></v-alert>

    <v-alert
        v-if="error"
        style="width:80%; margin: 1% auto"
        type="error"
        title="エラー"
        text="ログイン失敗、パスワードを確認してね（またはBANされてそう）"
    ></v-alert>
</template>

<style scoped>



</style>