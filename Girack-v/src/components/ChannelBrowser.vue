<script setup>
import { getSocket, getUserinfo, channelIndex } from '../socket.js';
</script>

<script>
const socket = getSocket();
export default {

    data() {
        return {
            channelList: {},
            channelJoined: [],

            overlayChannelCreate: false, //チャンネル作成オーバーレイ
            channelCreateName: "", //作りたいチャンネルの名前
        }
    },

    methods: {
        //チャンネルへ参加する処理
        channelJoin(channelid) {
            //参加しまぁす！
            socket.emit("channelAction", {
                action: "join",
                channelid: channelid,
                reqSender: {
                    userid: getUserinfo().userid,
                    sessionid: getUserinfo().sessionid
                }
            });

            //チャンネルリストを再取得
            socket.emit("getInfo", {
                target: "list",
                targetlist: "channel",
                reqSender: {
                    userid: getUserinfo().userid, //ユーザーID
                    sessionid: getUserinfo().sessionid //セッションID
                }
            });

        },

        //チャンネルから退出
        channelLeave(channelid) {
            //抜けます。
            socket.emit("channelAction", {
                action: "leave",
                channelid: channelid,
                reqSender: {
                    userid: getUserinfo().userid,
                    sessionid: getUserinfo().sessionid
                }
            });

            //チャンネルリストを再取得
            socket.emit("getInfo", {
                target: "list",
                targetlist: "channel",
                reqSender: {
                    userid: getUserinfo().userid, //ユーザーID
                    sessionid: getUserinfo().sessionid //セッションID
                }
            });

        },

        //チャンネル作成!
        channelCreate() {
            //チャンネル作りたい!
            socket.emit("channelCreate", {
                channelname: this.channelCreateName,
                reqSender: {
                    userid: getUserinfo().userid,
                    sessionid: getUserinfo().sessionid
                }
            });

            socket.emit("getInfo", {
                target: "list",
                targetlist: "channel",
                reqSender: {
                    userid: getUserinfo().userid, //ユーザーID
                    sessionid: getUserinfo().sessionid //セッションID
                }
            });
        }
    },

    mounted() {
        this.channelJoined = getUserinfo().channelJoined;

        //チャンネルリストの取得
        socket.emit("getInfo", {
            target: "list",
            targetlist: "channel",
            reqSender: {
                userid: getUserinfo().userid, //ユーザーID
                sessionid: getUserinfo().sessionid //セッションID
            }
        });

        //結果受け取り
        socket.on("infoResult", (dat) => {
            //型が違うかデータが無効なら関数を終わらせる
            if ( dat.type !== "list" || dat === -1 ) {
                console.log("ChannelBrwoser :: infoResult : データ違うっぽい???"); 
                return;

            }
            
            this.channelList = dat.channelList; //リスト追加
            //this.channelList = channelIndex; //リスト追加
            this.channelJoined = getUserinfo().channelJoined;
            console.log("ChannelBrwoser :: infoResult : dat ↓ ");
            console.log(dat);

        });

    },

    unmounted() {
        //通信重複防止
        //socket.off("infoResult");

    }

}
</script>

<template>
    <v-overlay
        v-model="overlayChannelCreate"
        class="align-center justify-center"
        contained
    >
        <v-card style="width:65%; height:60%">

            <p class="text-h5">チャンネル作成</p>

            <v-divider />

            <p style="float:left">チャンネル名</p>
            <br>
            <v-text-field variant="outlined" v-model="channelCreateName">
            </v-text-field>

            <br>

            <v-btn @click="channelCreate">
                作成!
            </v-btn>

        </v-card>
    </v-overlay>

    <div style="margin:3% auto; width: 85%">
        <div class="d-flex justify-space-around bg-surface-variant">
            <p class="text-h4 me-auto">チャンネルブラウザー</p>
            <v-btn @click="overlayChannelCreate=true" variant="tonal" icon="" class="rounded-lg">
                <v-icon size="large">
                    <span class="mdi mdi-plus-box"></span>
                </v-icon>
                <v-tooltip
                    activator="parent"
                    location="bottom"
                >
                    チャンネル作成
            </v-tooltip>
            </v-btn>
        </div>
        <br>
        <v-list style="height:100%; width:100%; overflow-y:auto;">
            <v-list-item
                v-for="c in Object.entries(channelList)"
                style="padding:0;"
            >
                <v-card variant="tonal" class="rounded-lg" style="padding:2% 2%; margin-top:16px;">
                    <p class="text-h6">
                        {{ c[1].name }}
                        <span v-if="c[1].scope==='private'" class="mdi mdi-lock"></span>
                        <v-btn v-if="!channelJoined.includes(c[0])" @click="channelJoin(c[0])" style="float: right" variant="tonal">参加</v-btn>
                        <v-btn v-else @click="channelLeave(c[0])" style="float:right" variant="outlined">退出</v-btn>
                    </p>
                    <p style="padding:1%">{{ c[1].description }}</p>
                </v-card>
            </v-list-item>
        </v-list>
    </div>
</template>