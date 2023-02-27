<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, channelIndex, userinfo } from "./socket.js";
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
            loggedin: false,
            channelIndex: {}
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
        socket.emit("getInitInfo"); //サーバーの情報を取得
        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername;
            
        });

    }

}

</script>

<template>
    <!-- ログイン後(Main) -->
    <div v-if="loggedin">
        <div :class="channelBar">
            <h2 style="text-align:center; margin-top:0; padding-top:3%" class="mx-auto">{{ servername || "..." }}</h2>
            <br>
            <v-card
                class="mx-auto"
                width="80%"
            >
                <div class="mx-auto" style="width:fit-content; margin-top:10%">
                    <RouterLink to="/user">
                        <v-avatar style=" width:4vmax;height:auto;">
                            <v-img :alt="userinfo.userid" :src="'http://localhost:33333/img/' + userinfo.userid + '.jpeg'"></v-img>
                        </v-avatar>
                    </RouterLink>
                </div>
                <v-card-text class="text-subtitle-1 text-center mx-auto">
                    <span>
                        {{ userinfo.username }}
                    </span>
                </v-card-text>
            </v-card>
            
            <nav style="margin:0 auto; width:90%;">
                <hr style="margin:5% 0">
                <!-- ここからチャンネルボタン描写  -->
                <div style="margin-top:3.5%" v-for="l in userinfo.channelJoined">
                    <RouterLink :to="'/c/'+l">
                        <v-btn :variant=" path.indexOf(l)!==-1?'flat':'text' " style="width:100%">
                            {{ channelIndex[l].channelname }}
                        </v-btn>
                    </RouterLink>
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
    border-right: 0.1px #424242 solid;

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