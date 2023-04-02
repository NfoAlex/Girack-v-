//Sidebar.vue
<script>
import { RouterLink } from 'vue-router';
import { getSocket, dataChannel, dataUser, dataMsg, backendURI, Serverinfo } from "../socket.js";

const socket = getSocket();

export default {
    
    setup() {
        const { Userinfo } = dataUser();
        const { MsgReadTime } = dataMsg();
        const { ChannelIndex } = dataChannel();

        return { Userinfo, MsgReadTime, ChannelIndex, Serverinfo };

    },

    props: ["sessionOnlineNum"], //オンライン人数用

    data() {
        return {
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
        checkReadTime(channelid, term) { //term => ほしい値
            try {
                //termの値で返すものを選ぶ
                switch(term) {
                    case "new":
                    return this.MsgReadTime[channelid].new; //新着数を返す

                    case "mention":
                        return this.MsgReadTime[channelid].mention; //メンション数を返す

                }
            }
            catch(e) {
                return null;
            }
        }
    },

    mounted() {
        //サーバー情報の受信
        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

    },

    unmounted() {
        //通信重複防止
        socket.off("sessionOnlineUpdate");
        socket.off("serverinfo");
        
    }

}

</script>

<template>
    <div>
        <div class="d-flex flex-column channelBar">
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
            <RouterLink :to="'/onlineuser'">
                <v-card
                    @click=""
                    style="font-size:calc(6px + 0.65vb); margin-top:8px; width:80%"
                    class="mx-auto pa-2 rounded-lg d-flex justify-center align-center"
                    color="#222"
                >
                    <v-icon v-if="sessionOnlineNum>=2" style="margin-right:4px;" size="small" color="green">mdi:mdi-circle</v-icon>
                    <span v-else>🥲</span>
                    {{ sessionOnlineNum }}人がオンライン
                </v-card>
            </RouterLink>
            
            <!-- ここからボタン群 -->
            <nav style="margin:2% auto; width:97%;">
                <!-- FOR DEBUGGING ONLY -->
                <RouterLink :to="'/jsonviewer'">
                    <v-card
                        v-if="Userinfo.role==='Admin'"
                        class="d-flex pa-2 justify-center align-center rounded-pill"
                        @click=""
                        :variant="path.indexOf('jsonviewer')!==-1?'tonal':'text'"
                        style="font-size:calc(6px + 0.55vb);"
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
                        :variant="path.indexOf('browser')!==-1?'tonal':'text'"
                        style="font-size:calc(6px + 0.55vb);"
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
                            style="font-size:calc(6px + 0.75vb);"
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

</style>