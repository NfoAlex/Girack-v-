<script>
import { getSocket } from "../socket.js";
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
        socket.on("authResult", (dat) => {
            if ( dat.result ) {
                this.success = true;
                this.$emit("login");

            } else {
                this.error = true;

            }
            


        });

    }

}

</script>

<template>
    <p>パスワード</p>
    <input type="password" v-model="pw" />
    <br>
    <button @click="requestAuth">認証</button>
    <br>
    <p v-if="success">ログイン成功</p>
    <p v-if="error">ログイン失敗</p>
</template>