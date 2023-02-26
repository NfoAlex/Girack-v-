<script>
import { getSocket } from "../socket.js";
const socket = getSocket();

export default {
    data() {
        return {
            pw: "",
            success: false
        }
    },

    methods: {
        requestAuth() {
            socket.emit("auth", this.pw);

        }
    },

    mounted() {
        socket.on("authResult", (dat) => {
            if ( dat.result ) {
                this.success = true;

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
</template>