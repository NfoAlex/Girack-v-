<script setup>
import { getSocket, dataUser } from '../socket.js';
</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser();

console.log("ChannelBrowser :: Userinfo");
console.log(Userinfo);

export default {

    data() {
        return {
            channelList: {},
            channelJoined: [],

            overlayChannelCreate: false, //チャンネル作成オーバーレイ
            channelCreateName: "", //作りたいチャンネルの名前
        }
    },

    watch: {
        Userinfo: {
            handler(U) {
                socket.emit("getInfoList", {
                    target: "channel",
                    reqSender: {
                        userid: U.value.userid, //ユーザーID
                        sessionid: U.value.sessionid //セッションID
                    }
                });
                
            },
            deep: true //JSONの階層ごと監視するため
        }
    },

    methods: {
        //チャンネルへ参加する処理
        channelJoin(channelid) {
            //参加しまぁす！
            socket.emit("channelAction", {
                action: "join",
                channelid: channelid, //参加するチャンネルのid
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

            //チャンネルリストを再取得
            socket.emit("getInfoList", {
            target: "channel",
            reqSender: {
                userid: Userinfo.value.userid, //ユーザーID
                sessionid: Userinfo.value.sessionid //セッションID
            }
        });

        },

        //チャンネルから退出
        channelLeave(channelid) {
            //抜けます。
            socket.emit("channelAction", {
                action: "leave",
                channelid: channelid, //抜けるチャンネルのID
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

            //チャンネルリストを再取得
            socket.emit("getInfoList", {
            target: "channel",
            reqSender: {
                userid: Userinfo.value.userid, //ユーザーID
                sessionid: Userinfo.value.sessionid //セッションID
            }
        });

        },

        //チャンネル作成!
        channelCreate() {
            //チャンネル作りたい!
            socket.emit("channelCreate", {
                channelname: this.channelCreateName, //作るチャンネルの名前
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

        },

        //チャンネル削除
        channelRemove(cid) {
            //チャンネル消したい!
            socket.emit("channelRemove", {
                channelid: cid, //消すチャンネルのID
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

        }
    },

    mounted() {
        //チャンネルリストの取得
        socket.emit("getInfoList", {
            target: "channel",
            reqSender: {
                userid: dataUser().Userinfo.value.userid, //ユーザーID
                sessionid: dataUser().Userinfo.value.sessionid //セッションID
            }
        });

        //結果受け取り
        socket.on("infoList", (dat) => {
            //型が違うかデータが無効なら関数を終わらせる
            if ( dat.type !== "channel" || dat === -1 ) {
                console.log("ChannelBrwoser :: infoList : データ違うっぽい???"); 
                return;

            }
            
            this.channelList = dat.channelList; //リスト追加

            console.log("ChannelBrwoser :: infoList : dat ↓ ");
            console.log(dat);

        });

    },

    unmounted() {
        //通信重複防止
        socket.off("infoList");

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

    <div style="margin:3% auto; width:85%; height:94%;">
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
        <v-list class="channelList" style="height:94%; width:100%; overflow-y:auto;">
            <v-list-item
                v-for="c in Object.entries(channelList)"
                style="padding:0;"
            >
                <v-card variant="tonal" class="rounded-lg" style="padding:2% 2%; margin-top:16px;">
                    
                    <p class="text-h6">

                        {{ c[1].name }}
                        <span v-if="c[1].scope==='private'" class="mdi mdi-lock"></span>

                        <div style="float:right">
                            <v-btn @click="channelRemove(c[0])" variant="text" icon="" size="small" style="margin-right:8px;" class="rounded-lg">
                                <span class="mdi mdi-delete-forever"></span>
                            </v-btn>
                            <v-btn v-if="!Userinfo.channelJoined.includes(c[0])" @click="channelJoin(c[0])" variant="tonal">参加</v-btn>
                            <v-btn v-else @click="channelLeave(c[0])" variant="outlined">退出</v-btn>
                        </div>

                    </p>
                    <p style="padding:1%">{{ c[1].description }}</p>
                </v-card>
            </v-list-item>
        </v-list>
    </div>
</template>

<style scoped>

.channelList
{
    scrollbar-width: none; /* Firefox用 */
}
.channelList::-webkit-scrollbar
{
    display:none; /* Chrome用 */
}

</style>