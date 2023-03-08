<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, channelIndex, userinfo, backendURI, updateState, updateStateTaken } from "./socket.js";
import Auth from "./components/Auth.vue";
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

        }
    },

    mounted() {
        this.channelIndexListing = channelIndex;
        this.channelJoined = userinfo.channelJoined;

        socket.emit("getInitInfo"); //サーバーの情報を取得

        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

        //データ更新用チャンネルバーの更新
        socket.on("infoResult", (dat) => {
            //もし受け取ったデータがチャンネル用かユーザー用かならチャンネルバー更新
            if ( dat.type === "channel" || dat.type === "user" ) {
                this.channelIndexListing = channelIndex;
                this.channelJoined = userinfo.channelJoined;

                this.$forceUpdate(); //レンダー更新

            }

        });

        let checkCount = 0;
        //チャンネル情報の更新
        socket.on("infoChannel", () => {
            let checkChannelInfo = setInterval(() => {
                console.log("infoChannel :: Lets check..." + updateState.channelinfo);
                if ( updateState.channelinfo > 0 ) {
                    console.log("App :: infoChannel : 情報あるわ")
                    this.channelIndexListing = channelIndex;
                    this.$forceUpdate(); //レンダー更新

                    clearInterval(checkChannelInfo);

                    updateStateTaken("channelinfo");
                    //updateState.channelinfo = updateState.channelinfo - 1;

                } else if ( updateState.channelinfo < 0 ) {
                    clearInterval(checkChannelInfo);

                }

                if ( checkCount > 10 ) {
                    clearInterval(checkChannelInfo);

                }

                checkCount++;

            }, 100);

        });

        //プロフィールの更新を受けたら表示名を変更
        socket.on("infoUser", (dat) => {
            console.log("App :: infoUser : ユーザー名表示更新");
            this.displayusername = dat.username;

            this.channelIndexListing = channelIndex;
            this.channelJoined = userinfo.channelJoined;

            let checkCount = 0;
            let checkChannelInfo = setInterval(() => {
                console.log("infoUser : Lets check..." + updateState.channelinfo);
                if ( updateState.channelinfo > 0 ) {
                    console.log("App :: infoUser : 情報あるわ(チャンネル抜け)")
                    this.channelIndexListing = channelIndex;
                    this.$forceUpdate(); //レンダー更新
                    
                    clearInterval(checkChannelInfo);

                    updateStateTaken("channelinfo");
                    //updateState.channelinfo = updateState.channelinfo - 1;

                } else if ( updateState.channelinfo < 0 ) {
                    clearInterval(checkChannelInfo);

                }

                if ( checkCount > 10 ) {
                    clearInterval(checkChannelInfo);

                }

                checkCount++;

            }, 500);

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
                            <v-img :alt="userinfo.userid" :src="uri + '/img/' + userinfo.userid + '.jpeg'"></v-img>
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
                        {{ displayusername }}
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
                <div style="margin-top:1%; padding:0" v-for="l in Object.entries(channelIndex)">
                    <RouterLink :to="'/c/'+l[0]">
                        <v-btn :variant=" path.indexOf(l[0])!==-1?'tonal':'text' " style="width:100%; text-align:left !important">
                            <span style="width:100%; text-align:left !important; float:left !important">
                                <span class="mdi mdi-pound ">{{ channelIndex[l[0]].channelname }}</span>
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