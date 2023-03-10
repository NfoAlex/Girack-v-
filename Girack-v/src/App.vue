<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, channelIndex, dataChannel, dataUser, backendURI } from "./socket.js";
import Auth from "./components/Auth.vue";

//REFとしてインポート
const { Userinfo } = dataUser();
const { ChannelIndex } = dataChannel();
</script>

<script>
const socket = getSocket();

export default {
    data() {
        return {
            //css用クラス
            channelBar: "channelBar", //左のチャンネルバーとか
            main: "main", //右のチャンネル表示するところ

            servername: "",
            displayusername: "Null",

            path: "",
            loggedin: false,
            channelIndexListing: {},
            channelJoined: [],
            uri: backendURI,
        }

    },

    watch: {
        //URLの変更を検知
        $route(r) {
            //console.log(r);
            this.path = r.path; //変数へ取り込む

        },
    },

    mounted() {
        console.log("App :: mounted : userinfo");
        //console.log(userinfo);
        this.channelIndexListing = channelIndex;
        //this.channelJoined = userinfo.channelJoined;

        socket.emit("getInitInfo"); //サーバーの情報を取得

        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

        console.log("channelIndexListing :: ");
        console.log(channelIndex);

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
                variant="tonal"
            >

                <div class="mx-auto" style="width:fit-content; margin-top:10%">
                    <RouterLink to="/user">
                        <v-avatar style=" width:4vmax;height:auto;">
                            <v-img :alt="Userinfo.userid" :src="uri + '/img/' + Userinfo.userid + '.jpeg'"></v-img>
                        </v-avatar>
                        <v-tooltip
                            activator="parent"
                            location="top"
                        >
                            プロフィール
                        </v-tooltip>
                    </RouterLink>
                </div>

                <v-card-text class="text-subtitle-1 text-center mx-auto">
                    <span>
                        {{ Userinfo.username }}
                    </span>
                </v-card-text>

            </v-card>
            
            <nav style="margin:5% auto; width:90%;">
                <RouterLink :to="'/jsonviewer'">
                    <v-btn :variant=" path.indexOf('jsonviewer')!==-1?'tonal':'text' " style="width:100%; text-align:left !important">
                        <span style="width:100%; text-align:left !important; float:left !important">
                            JSONviewer(debug)
                        </span>
                    </v-btn>
                </RouterLink>
                <RouterLink :to="'/browser'">
                    <v-btn :variant=" path.indexOf('browser')!==-1?'tonal':'text' " style="width:100%; text-align:left !important">
                        <span style="width:100%; text-align:left !important; float:left !important">
                            <span class="mdi mdi-text-search">チャンネルブラウザ</span>
                        </span>
                    </v-btn>
                </RouterLink>

                <hr style="margin:5% 0">

                <!-- ここからチャンネルボタン描写  -->
                <div style="margin-top:1%; padding:0" v-for="l in Object.entries(ChannelIndex)">
                    <RouterLink :to="'/c/'+l[0]">
                        <v-btn :variant=" path.indexOf(l[0])!==-1?'tonal':'text' " style="width:100%; text-align:left !important">
                            <span style="width:100%; text-align:left !important; float:left !important">
                                <span class="mdi mdi-pound ">{{ ChannelIndex[l[0]].channelname }}</span>
                            </span>
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
        <Auth @login="() => loggedin = true" />
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