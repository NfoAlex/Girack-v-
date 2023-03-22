<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { getSocket, dataChannel, dataUser, dataMsg, backendURI, Serverinfo } from "./socket.js";
import Auth from "./components/Auth.vue";

const { ChannelIndex } = dataChannel();

</script>

<script>

const { Userinfo } = dataUser();
const { MsgReadTime } = dataMsg();
import { useTheme } from 'vuetify';
const socket = getSocket();

export default {
    setup() {
        const theme = useTheme();
        return { theme };
    },
    
    data() {
        return {
            //css用クラス
            channelBar: "channelBar", //左のチャンネルバーとか
            main: "main", //右のチャンネル表示するところ

            servername: "",
            displayusername: "Null",

            path: "",
            loggedin: false,
            channelJoined: [],
            uri: backendURI,
        }

    },

    watch: {
        //URLの変更を検知
        $route(r) {
            this.path = r.path; //変数へ取り込む

        },
    },

    methods: {
        //新着メッセージ数を返す
        checkReadTime(channelid) {
            try {
                return MsgReadTime.value[channelid].new; //データ返す
            }
            catch(e) {
                return null;
            }
        }
    },

    mounted() {
        //console.log("vuetify :: global theme theme -> " + theme.global.name.value);
        socket.emit("getInitInfo"); //サーバーの情報を取得

        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

    }

}

</script>

<template>
    <!-- ログイン後(Main) -->
    <div v-if="loggedin">
        <div :class="channelBar">
            <h2 style="text-align:center; margin-top:0; padding-top:3%" class="mx-auto">{{ Serverinfo.servername || "..." }}</h2>
            <br>
            
            <RouterLink to="/menu/profile">
                <v-card
                    @click=""
                    class="mx-auto rounded-lg"
                    color="secondary"
                    width="80%"
                >
                    <!-- 三点メニューアイコン -->
                    <div style="width:fit-content" class="mx-auto">
                        <v-icon size="large">mdi:mdi-dots-horizontal</v-icon>
                    </div>
                    <!-- ホバーしたら表示するテキスト -->
                    <v-tooltip
                        activator="parent"
                        location="top"
                    >
                        メニュー
                    </v-tooltip>

                    <!-- アイコン-->
                    <div class="mx-auto" style="width:fit-content; margin-top:10%;">
                            <v-avatar style="width:4vmax; height:auto; margin-bottom:12px;">
                                <v-img :alt="Userinfo.userid" :src="uri + '/img/' + Userinfo.userid + '.jpeg'"></v-img>
                            </v-avatar>
                    </div>

                    <!-- ロールバッジ-->
                    <div style="width:fit-content" class="mx-auto">
                        <v-chip
                            v-if="Userinfo.role!=='Member'"
                            :color="Userinfo.role==='Admin'?'purple':'blue'"
                            size="x-small"
                            :elevation="6"
                        >
                            <!-- ここはロール ⇒⇒⇒ -->{{ Userinfo.role }}
                        </v-chip>
                    </div>

                    <!-- ユーザー名-->
                    <v-card-text class="text-subtitle-1 text-center mx-auto">
                        <span>
                            {{ Userinfo.username }}
                        </span>
                    </v-card-text>

                    

                </v-card>
            </RouterLink>
            
            <!-- ここからボタン群 -->
            <nav style="margin:2% auto; width:98%;">
                <!-- FOR DEBUGGING ONLY -->
                <RouterLink :to="'/jsonviewer'">
                    <v-btn class="overflow-x-hidden rounded-pill" prepend-icon="mdi:mdi-shield-bug" :variant=" path.indexOf('jsonviewer')!==-1?'tonal':'text' " style="width:100%; text-align:left !important">
                        <span style="width:100%; text-align:left !important; float:left !important">
                            JSONviewer
                        </span>
                    </v-btn>
                </RouterLink>

                <RouterLink :to="'/browser'">
                    <v-btn class="overflow-x-hidden rounded-lg" prepend-icon="mdi:mdi-text-search" :variant=" path.indexOf('browser')!==-1?'tonal':'text' " style="width:100%; text-align:left !important">
                        <span style="width:100%; text-align:left !important; float:left !important">
                            チャンネルブラウザ
                        </span>
                    </v-btn>
                </RouterLink>

                <hr style="margin:5% 0">

                <!-- ここからチャンネルボタン描写  -->
                <div class="overflow-x-hidden" style="margin-top:1%; padding:0" v-for="l in Object.entries(ChannelIndex)">
                    <RouterLink :to="'/c/'+l[0]">
                        <v-btn
                            class="rounded-lg"
                            prepend-icon="mdi:mdi-pound"
                            :variant="path.indexOf(l[0])!==-1?'tonal':'text'"
                            style="width:100%; font-size:1.35vb"
                        >

                            {{ l[1].channelname.length>15?l[1].channelname.substring(0,13)+"...":l[1].channelname }}
                            <v-icon v-if="l[1].scope==='private'" size="x-small">mdi:mdi-lock-outline</v-icon>
                            
                            <template v-slot:append>
                                <v-badge
                                    v-if="checkReadTime(l[0])"
                                    :content="checkReadTime(l[0])"
                                    inline
                                ></v-badge>
                            </template>

                        </v-btn>
                    </RouterLink>
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

<style>

html
{
    background: #1C1B1F;
    overflow-y: hidden !important;
}

a
{
  text-decoration: none;
  transition: 0.4s;
  color: #ede7f6;
}

a:visited
{
  text-decoration: none;
  color: #ede7f6;
}

</style>