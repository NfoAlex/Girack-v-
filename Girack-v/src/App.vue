<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, userinfo } from "./socket.js";
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
            path: "",
            loggedin: false

        }

    },

    watch: {
        //URLの変更を検知
        $route(r) {
            //console.log(r);
            this.path = r.path; //変数へ取り込む

        }
    },

    mounted() {
        console.log(this.$route);

        socket.emit("getInitInfo");
        socket.on("serverinfo", (dat) => {
            this.servername = dat.servername;
            
        });

    }

}

</script>

<template>
    <!-- ログイン後(Main) -->
    <div v-if="loggedin">
        <div :class="channelBar">
            <h2>{{ servername || "..." }}</h2>
            <nav style="margin:0 auto; width:90%;">
                <RouterLink to="/">Home</RouterLink><br>
                <RouterLink to="/login">Login(forDebug)</RouterLink><br>
                <hr>
                <!-- ここからチャンネルボタン描写  -->
                <div style="margin-top:3.5%" v-for="l in userinfo.channelJoined">
                    <RouterLink :to="'/c/'+l"><v-btn :variant=" path.indexOf(l)!==-1?'tonal':'flat' " style="width:100%">{{ l }}</v-btn></RouterLink>
                    <br>
                </div>
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

    box-sizing: border-box;
    border-right: 1px gray solid;

    background-color: #263238;
}

.main
{
    position: absolute;
    right: 0;
    top: 0;

    width: 80vw;
    height: 100vh;
    
    background-color: #212121;
}
</style>