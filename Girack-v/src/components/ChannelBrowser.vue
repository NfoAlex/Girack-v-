<script setup>
import { getSocket, dataUser } from '../socket.js';
</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser(); //自分のユーザー情報をインポート

export default {

    data() {
        return {
            channelList: {},
            channelJoined: [],

            overlayChannelRemove: false, //チャンネル消去オーバーレイ
            overlayChannelCreate: false, //チャンネル作成オーバーレイ

            //チャンネル作成用変数群
            channelCreateName: "", //作りたいチャンネルの名前
            channelCreateDescription: "テキストチャンネル。",
            channelCreatePrivate: false, //作りたいチャンネルの公開設定

            //チャンネル削除用変数群
            channelRemovingId: "", //消そうとしているチャンネルのID
            channelRemovingName: "" //消そうとしているチャンネルの名前
        }
    },

    watch: {
        //ユーザー情報の変更を監視
        Userinfo: {
            //変更を検知したらチャンネルリストを再取得
            handler(U) { //U => 変更されたあとのUserinfo
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
                userid: Userinfo.value.userid, //参加する人のユーザーID(この場合自分)
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
                userid: Userinfo.value.userid, //抜ける人のユーザーID(この場合自分)
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
                description: this.channelCreateDescription, //作るチャンネルの概要
                scope: ( this.channelCreatePrivate?"private":"public" ), //作るチャンネルの公開範囲
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });
            this.overlayChannelCreate = false; //チャンネル作成ダイアログを非表示

        },

        //チャンネル削除の確認
        channelRemove(cid) {
            //チャンネル消したい!
            this.channelRemovingId = cid; //これから消すID
            this.channelRemovingName = this.channelList[cid].name; //名前設定
            this.overlayChannelRemove = true; //ダイアログ表示

        },

        //チャンネル削除する
        channelRemoveConfirm(cid) {
            this.overlayChannelRemove = false; //ダイアログ非表示
            this.channelRemovingName = ""; //変数内の名前初期化
            this.channelRemovingId = ""; //変数内のチャンネルID初期化

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

        document.title = "チャンネルブラウザ"; //タブ名を変更

    },

    unmounted() {
        //通信重複防止
        socket.off("infoList");

    }

}
</script>

<template>
    <!-- チャンネル作成用ダイアログ -->
    <v-dialog
        v-model="overlayChannelCreate"
        class="align-center justify-center"
        style="width:40%"
    >
        <v-card class="rounded-lg" style="padding:5%;">

            <p class="text-h5">チャンネル作成</p>

            <v-divider />

            <br>

            <p style="float:left">チャンネル名</p>
            <br>
            <v-text-field variant="outlined" v-model="channelCreateName">
            </v-text-field>

            <p style="float:left">概要</p>
            <br>
            <v-textarea variant="outlined" aria-placeholder="yeah" v-model="channelCreateDescription">
            </v-textarea>

            <v-checkbox
                class="mx-auto"
                v-model="channelCreatePrivate"
                label="プライベートチャンネル"
            ></v-checkbox>

            <v-btn color="primary" @click="channelCreate">
                作成!
            </v-btn>

        </v-card>
    </v-dialog>

    <!-- チャンネル削除用ダイアログ -->
    <v-dialog
        v-model="overlayChannelRemove"
        class="align-center justify-center"
        style="width:40%"
    >
        <v-card class="rounded-lg" style="padding:5%;">

            <v-card-title class="text-h6 text-center">
                チャンネル削除していいの？
            </v-card-title>

            <p style="margin:24px 0 24px 0;" class="text-h4 text-center">
                {{ channelRemovingName }}
            </p>

            <br>

            <v-btn color="red" @click="channelRemoveConfirm(channelRemovingId)">
                削除
            </v-btn>

        </v-card>
    </v-dialog>

    <!-- ここから表示部分 -->
    <div style="margin:2% auto; width:85%; height:97.5%;">
        <div style="height:10%;" class="d-flex justify-space-around align-center bg-surface-variant">
            <p class="text-h4 me-auto">チャンネルブラウザー</p>
            <v-btn @click="overlayChannelCreate=true" color="primary" icon="" class="rounded-lg">
                <v-icon icon="mdi:mdi-plus">
                </v-icon>
                <v-tooltip
                    activator="parent"
                    location="bottom"
                >
                    チャンネル作成
                </v-tooltip>
            </v-btn>
        </div>
        <div class="channelList ma-1" style="height:85%; overflow-y:auto;">
            <v-list-item
                v-for="c in Object.entries(channelList)"
                style="padding:0; margin:0 8px;"
            >
                <v-card variant="tonal" class="rounded-lg" style="padding:8px 16px; margin-top:16px;">
                    
                    <p class="text-h6">

                        <v-icon icon="mdi:mdi-pound"></v-icon>
                        <span>
                            {{ c[1].name.length>50?c[1].name.substring(60,0)+"...":c[1].name }}
                            <v-tooltip
                                v-if="c[1].name.length>50"
                                activator="parent"
                                location="start"
                                class="overflow-x-hidden"
                            >
                                {{ c[1].name }}
                            </v-tooltip>
                        </span>
                        <span v-if="c[1].scope==='private'" class="mdi mdi-lock"></span>

                        <div style="float:right">
                            <v-btn @click="channelRemove(c[0])" variant="text" icon="" size="small" style="margin-right:8px;" class="rounded-lg">
                                <v-icon icon="mdi:mdi-delete-forever"></v-icon>
                            </v-btn>
                            <v-btn v-if="!Userinfo.channelJoined.includes(c[0])" @click="channelJoin(c[0])" variant="tonal">参加</v-btn>
                            <v-btn v-else @click="channelLeave(c[0])" variant="outlined">退出</v-btn>
                        </div>

                    </p>
                    <p style="padding:1%">{{ c[1].description }}</p>
                </v-card>
            </v-list-item>
        </div>
    </div>
</template>

<style scoped>

.channelList
{
    scrollbar-width: 5px; /* Firefox用 */
}

.channelList::-webkit-scrollbar
{
    width: 5px;
}

.channelList::-webkit-scrollbar-track {
    background-color: rgba(0,0,0,0);
}

.channelList::-webkit-scrollbar-thumb {
    background-color: #666;
}

</style>