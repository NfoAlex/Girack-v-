<script setup>
import { getSocket, userinfo, channelIndex } from '../socket.js';
</script>

<script>
const socket = getSocket();
export default {

    data() {
        return {
            channelList: {},
            channelJoined: []
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
                    userid: userinfo.userid,
                    sessionid: userinfo.sessionid
                }
            });

            //チャンネルリストを再取得
            socket.emit("getInfo", {
                target: "list",
                targetlist: "channel",
                reqSender: {
                    userid: userinfo.userid, //ユーザーID
                    sessionid: userinfo.sessionid //セッションID
                }
            });

            // //入っているユーザーリストを見る
            // socket.emit("getInfo", {
            //     target: "user",
            //     targetid: userinfo.userid,
            //     reqSender: {
            //         userid: userinfo.userid, //ユーザーID
            //         sessionid: userinfo.sessionid //セッションID
            //     }
            // });

            //this.channelJoin.push(channelid);

        },
        //チャンネルから退出
        channelLeave(channelid) {
            //抜けます。
            socket.emit("channelAction", {
                action: "leave",
                channelid: channelid,
                reqSender: {
                    userid: userinfo.userid,
                    sessionid: userinfo.sessionid
                }
            });

            //チャンネルリストを再取得
            socket.emit("getInfo", {
                target: "list",
                targetlist: "channel",
                reqSender: {
                    userid: userinfo.userid, //ユーザーID
                    sessionid: userinfo.sessionid //セッションID
                }
            });

            // //入っているユーザーリストを見る
            // socket.emit("getInfo", {
            //     target: "user",
            //     targetid: userinfo.userid,
            //     reqSender: {
            //         userid: userinfo.userid, //ユーザーID
            //         sessionid: userinfo.sessionid //セッションID
            //     }
            // });

            //this.channelJoin.splice(this.channelJoin.indexOf(channelid),1);

        }
    },

    // watch: {
    //     channelIndex(cI) {
    //         this.channelList = cI;

    //     }
    // },

    mounted() {
        this.channelJoined = userinfo.channelJoined;
        //this.channelList = channelIndex;
        // console.log("ChannelBrowser :: this.channelList \\/");
        // console.log(this.channelList);

        //チャンネルリストの取得
        socket.emit("getInfo", {
            target: "list",
            targetlist: "channel",
            reqSender: {
                userid: userinfo.userid, //ユーザーID
                sessionid: userinfo.sessionid //セッションID
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
            this.channelJoined = userinfo.channelJoined;
            console.log("ChannelBrwoser :: infoResult : dat ↓ ");
            console.log(dat);

        });

    }

}
</script>

<template>
    <div style="margin:3% auto; width: 85%">
        <p class="text-h4">チャンネルブラウザー</p>
        <v-list style="height:100%; overflow-y:scroll;">
            <v-list-item
                v-for="c in Object.entries(channelList)"
            >
                <v-card variant="tonal" class="rounded-lg" style="padding:3% 3%; margin-top:8px;">
                    <p class="text-h6">
                        {{ c[1].name }}
                        <span v-if="c[1].scope==='private'" class="mdi mdi-lock"></span>
                        <v-btn v-if="!channelJoined.includes(c[0])" @click="channelJoin(c[0])" style="float: right" variant="tonal">参加</v-btn>
                        <v-btn v-else @click="channelLeave(c[0])" style="float: right" variant="outlined">退出</v-btn>
                    </p>
                    <p style="padding:1%">{{ c[1].description }}</p>
                </v-card>
            </v-list-item>
        </v-list>
    </div>
</template>