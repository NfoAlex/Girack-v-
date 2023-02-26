<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, serverinfo } from "./socket.js";

import Login from "./components/Login.vue";

</script>

<script>
const socket = getSocket();

export default {
    data() {
        return {
        channelBar: "channelBar",
        main: "main",
        servername: "",
        loggedin: false

        }

    },

    mounted() {
        socket.emit("getInitInfo");
        socket.on("serverinfo", (dat) => {
            this.servername = dat.servername;
            
        });
        //console.log(serverinfo.servername);
    }

}

</script>

<template>
    <!-- ログイン後(Main) -->
    <div v-if="loggedin">
        <div :class="channelBar">
            <h2>{{ servername || "..." }}</h2>
            <nav>
                <RouterLink to="/">Home</RouterLink><br>
                <RouterLink to="/login">Login(forDebug)</RouterLink><br>
                <hr>
                <RouterLink to="/c/001">random</RouterLink><br>
            </nav>
        </div>

        <div :class="main">
            <RouterView />
        </div>
    </div>

    <!-- ログイン前 -->
    <div v-else>
        <Login @login="() => loggedin = true" />
    </div>

</template>

<style scoped>

.channelBar
{
    width: 20vw;
    height: 100vh;
}

.main
{
    position: absolute;
    right: 0;
    top: 0;

    width: 80vw;
    height: 100vh;
}
</style>