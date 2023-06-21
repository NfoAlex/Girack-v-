//Sidebar.vue
<script>
import { getSocket, backendURI, Serverinfo } from "../data/socket";
import { dataMsg } from "../data/dataMsg";
import { dataChannel } from "../data/dataChannel";
import { dataUser } from '../data/dataUserinfo';
import { getCONFIG } from "../config";
import { RouterLink } from 'vue-router';

const socket = getSocket();

export default {
    
    setup() {
        const { myUserinfo } = dataUser();
        const { MsgReadTime } = dataMsg();
        const { ChannelIndex } = dataChannel();
        const { CONFIG_DISPLAY } = getCONFIG();

        return { myUserinfo, MsgReadTime, ChannelIndex, Serverinfo, CONFIG_DISPLAY };

    },

    props: ["sessionOnlineNum"], //オンライン人数用

    data() {
        return {
            servername: "",
            displayusername: "Null",

            disconnected: false,

            path: "",
            loggedin: false,
            channelJoined: [],
            displaychannelList: [],
            uri: backendURI,
        }
    },

    watch: {
        //URLの変更を検知
        $route(r) {
            this.path = r.path; //変数へ取り込む

        },

        //チャンネル情報の変化を監視
        ChannelIndex: {
            handler() {
                //ソート
                this.sortChannelList;

            },
            deep: true
        },

        //チャンネルの表示設定を監視
        "CONFIG_DISPLAY.SIDEBAR_CHANNEL_ORDERBY": {
            handler() {
                //ソート
                this.sortChannelList;

            }
        }
    },

    computed: {
        //チャンネルボタンの表示をソートする
        sortChannelList() {
            let nameList = [];
            let objChannelIndex = Object.entries(this.ChannelIndex); //一度JSONを配列化

            //チャンネルの情報を表示するための配列にする
            for ( let index in objChannelIndex ) {
                nameList.push ({
                    channelname: objChannelIndex[index][1].channelname,
                    id: objChannelIndex[index][0],
                    scope: objChannelIndex[index][1].scope
                });

            }
            
            //設定に合わせてソート
            if ( this.CONFIG_DISPLAY.SIDEBAR_CHANNEL_ORDERBY === "alphabetical" ) { //名前順(?)
                //表示するチャンネルリストをソート
                this.displaychannelList = nameList.sort((u1,u2) => {
                    let U1 = u1.channelname.toLowerCase();
                    let U2 = u2.channelname.toLowerCase();

                    //絵文字があるなら削る
                    if ( /\p{Extended_Pictographic}/u.test(U1) ) {
                        U1 = U1.substring(2);

                    }

                    //絵文字があるなら削る
                    if ( /\p{Extended_Pictographic}/u.test(U2) ) {
                        U2 = U2.substring(2);
                        
                    }

                    //ソート
                    return U1<U2?-1:U1>U2?1:0;

                });

            } else if ( this.CONFIG_DISPLAY.SIDEBAR_CHANNEL_ORDERBY === "id" ) { //ID順
                this.displaychannelList = nameList;

            }

        }
    },

    methods: {
        //新着メッセージ数を返す
        checkReadTime(channelid, term) { //term => ほしい値
            try {
                //termの値で返すものを選ぶ
                switch(term) {
                    //新着数
                    case "new":
                        if ( this.MsgReadTime[channelid].new > 20 ) return "+20";
                        return this.MsgReadTime[channelid].new; //新着数を返す

                    //メンション数
                    case "mention":
                        return this.MsgReadTime[channelid].mention; //メンション数を返す

                }
            }
            catch(e) {
                return null;
            }
        },
    },

    mounted() {
        //サーバー情報の受信
        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

        //サーバー切断時
        socket.on("disconnect", (dat) => {
            this.disconnected = true;

        });

        //サーバーの再接続時
        socket.on("connect", () => {
            this.disconnected = false;

        });

        //初回レンダー終わったら一度ソートする
        this.$nextTick(() => {
            this.sortChannelList;

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
        <div class="d-flex flex-column channelBar" style="background-color:#1c1b1e;">
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
                                <v-img :alt="myUserinfo.userid" :src="uri + '/img/' + myUserinfo.userid"></v-img>
                            </v-avatar>
                    </div>

                    <!-- ロールバッジ-->
                    <div style="width:fit-content" class="mx-auto">
                        <v-chip
                            v-if="myUserinfo.role!=='Member'"
                            :color="myUserinfo.role==='Admin'?'purple':'blue'"
                            size="x-small"
                            :elevation="6"
                        >
                            <!-- ここはロール ⇒⇒⇒ -->{{ myUserinfo.role }}
                        </v-chip>
                    </div>

                    <!-- ユーザー名-->
                    <v-card-text class="text-subtitle-1 text-center mx-auto">
                        <span>
                            {{ myUserinfo.username }}
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
                    <v-icon v-if="sessionOnlineNum>=2" style="margin-right:4px;" size="small" :color="disconnected?'red':'green'">mdi:mdi-circle</v-icon>
                    <span v-else>🥲</span>
                    <span v-if="!disconnected">{{ sessionOnlineNum }}人がオンライン</span>
                    <span v-else>サーバーオフライン</span>
                </v-card>
            </RouterLink>
            
            <!-- ここからボタン群 -->
            <nav style="margin:2% auto; width:97%;">
                <!-- FOR DEBUGGING ONLY -->
                <RouterLink :to="'/jsonviewer'">
                    <v-card
                        v-if="myUserinfo.role==='Admin'"
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
            <div class="mx-auto scroll" style="overflow-y:auto; width:97%; margin-bottom:8px;">
                <div style="margin-top:1%;" v-for="l in displaychannelList">
                    <RouterLink :to="'/c/'+l.id">
                        <v-card
                            class="rounded-lg pa-2 d-flex align-center"
                            :variant="path.indexOf(l.id)!==-1?'tonal':'text'"
                            @click=""
                            :ripple="false"
                            style="font-size:calc(6px + 0.75vb);"
                        >
                            <!-- チャンネル名前の#の部分 -->
                            <div class="flex-shrink-1">
                                <v-icon v-if="l.scope!=='private'" size="small">mdi:mdi-pound</v-icon>
                                <v-icon v-else size="small">mdi:mdi-lock-outline</v-icon> <!-- プライベートチャンネル用鍵マーク -->
                            </div>
                            
                            <!-- チャンネル名 -->
                            <div
                                style="margin-left:4px;"
                                class="me-auto text-truncate"
                                :class="(checkReadTime(l.id, 'new')||checkReadTime(l.id, 'mention')||path.indexOf(l.id)!==-1)?'text-high-emphasis':'text-disabled'"
                            >
                                {{ l.channelname }}
                            </div>

                            <!-- メンションマーク -->
                            <v-badge
                                v-if="checkReadTime(l.id, 'mention')"
                                :content="checkReadTime(l.id, 'mention')"
                                color="orange"
                                inline
                            ></v-badge>

                            <!-- 新着マーク -->
                            <v-badge
                                v-if="checkReadTime(l.id, 'new')"
                                :content="checkReadTime(l.id, 'new')"
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
    border-right: 0.1px #222 solid;
}

.scroll::-webkit-scrollbar
{
    width: 5px;
}

.scroll::-webkit-scrollbar-track {
    background-color: rgba(0,0,0,0);
}

.scroll::-webkit-scrollbar-thumb {
    background-color: #666;
}

</style>