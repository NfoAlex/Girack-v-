<script setup>
import { getSocket, userinfo } from '../socket.js';
</script>

<script>
const socket = getSocket();
export default {

    data() {
        return {
            channelList: {}
        }
    },

    methods: {
        //チャンネルへ参加する処理
        channelJoin(channelid) {
            //参加しまぁす！
            socket.emit("channelJoin", {
                channelid: channelid,
                reqSender: {
                    userid: userinfo.userid,
                    sessionid: userinfo.sessionid
                }
            });

        }
    },

    mounted() {
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
            if ( dat.type !== "list" || dat === -1 ) { console.log("ChannelBrwoser :: infoResult : ???"); return; }
            this.channelList = dat.channelList; //リスト追加
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
                <v-card variant="tonal" style="padding:3% 3%; margin-top:8px;">
                    <p class="text-h6">
                        {{ c[1].name }}
                        <span v-if="c[1].scope==='private'" class="mdi mdi-lock"></span>
                        <v-btn style="float: right" variant="tonal">参加</v-btn>
                    </p>
                    <p style="padding:1%">{{ c[1].description }}</p>
                </v-card>
            </v-list-item>
        </v-list>
    </div>
</template>