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
    <p v-if="success">ログイン成功</p>
    <p v-if="error">ログイン失敗</p>
</template>

<style scoped>



</style>