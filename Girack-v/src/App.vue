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
            sessionOnlineNum: 0,

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
        checkReadTime(channelid, term) { //term => ほしい値
            try {
                //termの値で返すものを選ぶ
                switch(term) {
                    case "new":
                    return MsgReadTime.value[channelid].new; //新着数を返す

                    case "mention":
                        return MsgReadTime.value[channelid].mention; //メンション数を返す

                }
            }
            catch(e) {
                return null;
            }
        }
    },

    mounted() {
        //console.log("vuetify :: global theme theme -> " + theme.global.name.value);
        socket.emit("getInitInfo"); //サーバーの情報を取得

        //サーバー情報の受信
        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

        //オンラインユーザーの更新
        socket.on("sessionOnlineUpdate", (num) => {
            this.sessionOnlineNum = num;

        });

    }

}

</script>

<template>
    <div>

        <!-- ログイン後(Main) -->
        <div v-if="loggedin">
            <div class="d-flex flex-column" :class="channelBar">
                <!-- インスタンス名 -->
                <div class="mx-auto" style="margin:16px 0; width:90%;">
                    <p
                        style="text-align:center;"
                        class="mx-auto text-truncate text-h6"
                    >
                        {{ Serverinfo.servername || "..." }}
                    </p>
                </div>
                
                <!-- メニューボタン/プロフィールカード -->
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

                <!-- オンライン人数表示 -->
                <v-card
                    style="font-size:1.15vb; margin-top:8px; width:80%"
                    class="mx-auto pa-2 rounded-lg d-flex justify-center align-center"
                    color="#222"
                >
                    <v-icon v-if="sessionOnlineNum>=2" style="margin-right:4px;" size="small" color="green">mdi:mdi-circle</v-icon>
                    <span v-else>🥲</span>
                    {{ sessionOnlineNum }}人がオンライン
                </v-card>
                
                <!-- ここからボタン群 -->
                <nav style="margin:2% auto; width:97%;">
                    <!-- FOR DEBUGGING ONLY -->
                    <RouterLink :to="'/jsonviewer'">
                        <v-card
                            v-if="Userinfo.role==='Admin'"
                            class="d-flex pa-2 justify-center align-center rounded-pill"
                            @click=""
                            :variant=" path.indexOf('jsonviewer')!==-1?'tonal':'text'"
                            style="font-size:1.35vb;"
                        >
                            <v-icon>mdi:mdi-shield-bug</v-icon>
                            <span class="text-truncate">
                                JSONviewer
                            </span>
                        </v-card>
                    </RouterLink>

                    <RouterLink :to="'/browser'">
                        <v-card
                            class="d-flex pa-2 justify-center align-center rounded-lg"
                            @click=""
                            :variant=" path.indexOf('browser')!==-1?'tonal':'text'"
                            style="font-size:1.35vb;"
                        >
                            <v-icon>mdi:mdi-text-search</v-icon>
                            <span class="text-truncate">
                                チャンネルブラウザ
                            </span>
                        </v-card>
                    </RouterLink>

                    <v-divider style="margin:5% 0"></v-divider>
                </nav>

                <!-- ここからチャンネルボタン描写  -->
                <div class="mx-auto" style="overflow-y:auto; width:97%; margin-bottom:8px;">
                    <div style="margin-top:1%;" v-for="l in Object.entries(ChannelIndex)">
                        <RouterLink :to="'/c/'+l[0]">
                            <v-card
                                class="rounded-lg pa-2 d-flex align-center"
                                :variant="path.indexOf(l[0])!==-1?'tonal':'text'"
                                @click=""
                                style="font-size:1.35vb;"
                            >
                                <!-- チャンネル名前の#の部分 -->
                                <div class="flex-shrink-1">
                                    <v-icon v-if="l[1].scope!=='private'">mdi:mdi-pound</v-icon>
                                    <v-icon v-else>mdi:mdi-lock-outline</v-icon> <!-- プライベートチャンネル用鍵マーク -->
                                </div>
                                
                                <!-- チャンネル名 -->
                                <div style="margin-left:4px;" class="me-auto text-truncate">
                                    {{ l[1].channelname }}
                                </div>

                                <!-- メンションマーク -->
                                <v-badge
                                    v-if="checkReadTime(l[0], 'mention')"
                                    :content="checkReadTime(l[0], 'mention')"
                                    color="orange"
                                    inline
                                ></v-badge>

                                <!-- 新着マーク -->
                                <v-badge
                                    v-if="checkReadTime(l[0], 'new')"
                                    :content="checkReadTime(l[0], 'new')"
                                    inline
                                ></v-badge>

                            </v-card>
                        </RouterLink>
                    </div>
                </div>
            </div>

            <div :class="main">
                <RouterView />
            </div>
        </div>

        <!-- ログイン前 -->
        <div v-else>
            <Auth @login="() => loggedin = true" />
        </div>

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
    font-family: "Noto Sans CJK JP", "BIZ UDPGothic" !important;
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