<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, serverinfo } from "./socket.js";
</script>

<script>
const socket = getSocket();

export default {
    data() {
        return {
        channelBar: "channelBar",
        main: "main",
        servername: "",

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

<template>
    <header>
        <div :class="channelBar">
            <h2>{{ servername || "..." }}</h2>
            <nav>
                <RouterLink to="/">Home</RouterLink><br>
                <RouterLink to="/login">Login</RouterLink><br>
                <hr>
                <RouterLink to="/c/001">random</RouterLink><br>
            </nav>
        </div>
    </header>

    <div :class="main">
        <RouterView />
    </div>

</template>
