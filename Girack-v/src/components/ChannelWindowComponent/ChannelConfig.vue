<script>

import { getSocket, backendURI } from '../../data/socket';
import { dataChannel } from '../../data/dataChannel';
import { dataUser } from '../../data/dataUserinfo';
import Userpage from "../Userpage.vue";

const socket = getSocket();
const { ChannelIndex } = dataChannel();

export default {

    components: { Userpage },
    props: ["channelid", "channelInfo"],

    setup() {
        const { myUserinfo } = dataUser();
        return { myUserinfo };

    },

    data() {
        return {
            channelTargetInfo: {}, //表示するチャンネル情報
            channelJoinedUser: [],

            //ユーザーページ用
            userDialogShow: false,
            userDialogUserid: "00000001",

            //ユーザー招待時の検索用
            userSearchShow: false,
            userSearchQuery: "",
            userSearchResult: [],

            //名前と概要の編集用
            descriptionEditing : false, //チャンネル概要の編集状態
            descriptionText: "...", //チャンネル概要
            channelnameEditing: false, //チャンネルの編集状態
            channelnameText: "...", //チャンネルの名前
            scopeIsPrivate: false, //チャンネルがプレイベートかどうか

            tab: "", //タブの移動用
            imgsrc: backendURI + "/img/" //アイコン用
        }
    },

    watch: {
        //ユーザー検索ダイアログ
        userSearchQuery: {
            handler(query) {
                //もし検索画面を開いてるなら
                if ( this.userSearchShow ) {
                    //検索文字列が１文字以上なら
                    if ( this.userSearchQuery.length >= 1 ) {
                        //検索クエリーを送信
                        socket.emit("searchUserDynamic", {
                            query: this.userSearchQuery,
                            reqSender: {
                                userid: this.myUserinfo.userid,
                                sessionid: this.myUserinfo.sessionid
                            }
                        })

                    } else { //もし文字列が０文字なら
                        this.userSearchResult = []; //検索結果を初期化

                    }

                }

            }
        }
    },

    methods: {
        //編集モードを切り替える
        switchEditing(cat, mode) {
            switch(cat) {
                //概要欄の編集切り替え
                case "desc":
                    if ( !mode ) { this.descriptionEditing = false; }
                    else { this.descriptionEditing = true; }
                    break;

                //チャンネル名の編集切り替え
                case "channelname":
                    if ( !mode ) { this.channelnameEditing = false; }
                    else { this.channelnameEditing = true; }
                    break;

            }

        },

        //チャンネルの更新をする
        updateChannel() {
            //チャンネル設定の更新
            socket.emit("changeChannelSettings", {
                targetid: this.channelid,
                channelname: this.channelnameText,
                description: this.descriptionText,
                scope: (this.scopeIsPrivate?"private":"public"),
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });

            //編集を閉じる
            this.switchEditing('desc', false);
            this.switchEditing('channelname', false);

        },

        //検索するユーザーがすでにチャンネルに参加しているかどうかを調べる
        checkUserJoined(userid) {
            //チャンネルに参加しているユーザーリストから調べる
            for ( let index in this.channelJoinedUser ) {
                //検索されたユーザーのユーザーIDが参加リストにあるか
                if ( this.channelJoinedUser[index].userid === userid ) {
                    return true;

                }

            }

            return false; //なかったらないで

        },

        //チャンネルへユーザーを追加
        inviteUser(targetUserid) {
            console.log("ChannelConfig :: inviteUser : が実行された");
            //チャンネルに参加させる
            socket.emit("channelAction", {
                action: "join",
                channelid: this.channelid,
                userid: targetUserid,
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });

            //チャンネルに参加しているユーザーリストを取得、更新する
            socket.emit("getInfoChannelJoinedUserList", {
                targetid: this.channelid,
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });

        },

        //チャンネルから特定のユーザーを蹴る
        kickUser(targetUserid) {
            console.log("ChannelConfig :: kickUser : kicking user -> " + targetUserid);

            //チャンネルからキック
            socket.emit("channelAction", {
                action: "leave",
                channelid: this.channelid,
                userid: targetUserid,
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });

            //チャンネルに参加しているユーザーリストを取得、更新する
            socket.emit("getInfoChannelJoinedUserList", {
                targetid: this.channelid,
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });

        },

        //参加しているユーザーをリスト化
        SOCKETinfoChannelJoinedUserList(channelJoinedUserList) {
            //ユーザー名でソートして追加
            this.channelJoinedUser = channelJoinedUserList.sort((u1, u2) => {
                if ( u1.username > u2.username ) {
                    return 1;

                } else {
                    return -1;

                }

            });

        },

        //ユーザーの検索結果をリスト化
        SOCKETinfoSearchUser(result) {
            this.userSearchResult = result;

        }

    },

    mounted() {
        //表示するデータをチャンネル情報から取得して設定
        this.channelTargetInfo = this.channelInfo;
        this.channelnameText = this.channelInfo.channelname;
        this.descriptionText = this.channelInfo.description;
        this.scopeIsPrivate = (this.channelInfo.scope==="private"?true:false);


        //チャンネル参加者リストを受信
        socket.on("infoChannelJoinedUserList", this.SOCKETinfoChannelJoinedUserList);

        //ユーザー名検索の結果受け取り用
        socket.on("infoSearchUser", this.SOCKETinfoSearchUser);

        //チャンネルに参加しているユーザーリストを取得
        socket.emit("getInfoChannelJoinedUserList", {
            targetid: this.channelid,
            reqSender: {
                userid: this.myUserinfo.userid,
                sessionid: this.myUserinfo.sessionid
            }
        });

    },

    unmounted() {
        //通信重複防止
        socket.off("infoChannelJoinedUserList", this.SOCKETinfoChannelJoinedUserList);
        socket.off("infoSearchUser", this.SOCKETinfoSearchUser);

    }

}

</script>

<template>
    <v-dialog style="width:50vw; max-width:650px; height:80vh; overflow-y:auto;">
        <!-- ユーザーページ用 -->
        <Userpage v-if="userDialogShow" v-model="userDialogShow" :userid="userDialogUserid" />

        <!-- チャンネルへユーザーを招待するときのユーザー検索画面 -->
        <v-dialog
            v-model="userSearchShow"
            width="55vw"
            style="max-width:600px;"
        >
        
            <v-text-field variant="solo" placeholder="ユーザー名で検索" v-model="userSearchQuery">
            </v-text-field>

            <!-- 検索結果 -->
            <div class="channelScrollbar channelScrollbarDarker" style="height:60vh; max-height:650px; max-width:910px; overflow-y:auto;">
                <v-card
                    v-for="user in userSearchResult"
                    style="padding:16px 0; margin-top:8px; width:95%"
                    class="mx-auto text-left rounded-lg d-flex flex-row align-center"
                >

                    <!-- アバター -->
                    <v-avatar
                        style="margin-left:32px;"
                        size="32"
                        :image="imgsrc + user.userid"
                    >
                    </v-avatar>

                    <!-- ユーザー名 -->
                    <span class="text-center text-truncate flex-shrink-1 flex-grow-0 me-auto" style="margin-left:16px;">
                        {{ user.username }}
                    </span>

                    <!-- ユーザーを追加するボタン -->
                    <span style="margin-right:5%;">
                        <v-btn
                            @click="inviteUser(user.userid)"
                            v-if="!checkUserJoined(user.userid)"
                            icon="mdi:mdi-account-plus"
                            class="rounded-lg"
                            variant="text"
                        >
                        </v-btn>
                        <v-btn
                            v-else
                            icon="mdi:mdi-account-check"
                            class="rounded-lg"
                            variant="text"
                        >
                        </v-btn>
                    </span>

                </v-card>
            </div>
        </v-dialog>
        
        <!-- チャンネルメニュー本体 -->
        <v-card class="d-flex flex-column text-center rounded-lg pa-3">
            <div>
                <!-- チャンネル名とバッジ -->
                <div class="ma-5">
                    <p class="text-h4">

                        <!-- プライベートチャンネル用アイコン -->
                        <v-icon v-if="scopeIsPrivate" size="x-small">mdi:mdi-lock</v-icon>
                        
                        <br>

                        <!-- チャンネル名 -->
                        <p
                            @dblclick="switchEditing('channelname',true)"
                            v-if="!channelnameEditing"
                            class="text-truncate"
                        >
                            <v-tooltip
                                activator="parent"
                                location="top"
                            >
                                ダブルクリックでチャンネル名を変更
                            </v-tooltip>
                            {{ channelnameText }}
                        </p>

                        <!-- 編集中のチャンネル名 -->
                        <v-text-field
                            v-else
                            counter
                            maxlength="32"
                            v-model="channelnameText"
                        >
                            <!-- 確定とキャンセルのアイコン -->
                            <template v-slot:append-inner>
                                <v-icon @click="updateChannel">mdi:mdi-check-bold</v-icon>
                                <v-icon @click="switchEditing('channelname',false)">mdi:mdi-window-close</v-icon>
                            </template>
                        </v-text-field>

                    </p>
                </div>

                <!-- チャンネル概要 -->
                <v-card
                    @dblclick="switchEditing('desc',true)"
                    class="channelScrollbar pa-3 ma-2 mx-auto rounded-lg"
                    style="min-height:75px; overflow-y:auto; max-height:15vh"
                    width="85%"
                    color="secondary">
                    
                    <!-- 概要欄 -->
                    <div v-if="!descriptionEditing">
                        <p>
                        {{ descriptionText }}
                        </p>
                        <p class="text-caption" style="margin-top:-2px; color:#555">ダブルクリックで編集</p>
                    </div>

                    <!-- 編集中の概要欄 -->
                    <div v-if="descriptionEditing">
                        <v-textarea
                            no-resize
                            counter
                            maxlength="128"
                            rows="3"
                            v-model="descriptionText"
                            label="概要"
                        >
                            <!-- 確定とキャンセルのアイコン -->
                            <template v-slot:append-inner>
                                <v-icon @click="updateChannel" :disabled="descriptionText.length>=128">mdi:mdi-check-bold</v-icon>
                                <v-icon @click="switchEditing('desc',false)">mdi:mdi-window-close</v-icon>
                            </template>
                        </v-textarea>
                    </div>
                </v-card>
                
                <v-divider class="ma-3 mx-auto" style="width:85%" :thickness="0"></v-divider>

                <!-- タブ -->
                <v-tabs
                    v-model="tab"
                    class="mx-auto rounded-lg"
                    style="width:fit-content; min-height:30px;"
                    bg-color="grey"
                >
                    <v-tab value="userJoined">参加者</v-tab>
                    <v-tab v-if="!channelInfo.previewmode" value="manage">管理</v-tab>
                </v-tabs>
            </div>

            <!-- タブの中身を知りたくて─────────── -->
            <v-window v-model="tab" style="margin-top:8px; overflow-y:auto;">

                <!-- チャンネル参加者リスト -->
                <v-window-item value="userJoined" class="channelScrollbar">
                    <!-- ユーザー招待ボタン -->
                    <span>
                        <v-btn
                            v-if="!channelInfo.previewmode"
                            @click="()=>{userSearchShow=!userSearchShow;}"
                            style="width:75%"
                            icon=""
                            variant="text"
                            class="rounded-lg mx-auto"
                        >
                            <v-icon>mdi:mdi-account-plus</v-icon>
                        </v-btn>
                    </span>

                    <!-- ここからチャンネル参加者 -->
                    <v-card
                        @click="()=>{userDialogUserid=u.userid; userDialogShow=true;}"
                        class="mx-auto pa-1 rounded-lg d-flex justify-center align-center"
                        style="width:75%; margin-top:8px;"
                        variant="tonal"
                        v-for="u in channelJoinedUser"
                    >

                        <v-avatar size="32" style="margin-left:10%;" :image="imgsrc + u.userid"></v-avatar>
                        <!-- オンライン状態 -->
                        <v-icon :class="!u.loggedin?'hideOnlineIcon':null" :color="u.loggedin?'green':null" style="margin-left:8px;">
                            mdi:mdi-circle-medium
                        </v-icon>
                        <span
                            style="margin-left:8px;"
                            class="text-center text-truncate me-auto"
                        >
                            {{ u.username }}
                        </span>
                        <span v-if="myUserinfo.role!=='Member'" style="float:right" class="text-center">
                            <v-btn
                                @click.stop="kickUser(u.userid)"
                                size="small"
                                class="rounded-lg"
                                variant="text"
                                icon="mdi:mdi-karate"
                            >
                            </v-btn>
                        </span>

                    </v-card>
                    
                </v-window-item>

                <v-window-item value="manage" class="mx-auto" style="overflow-y:auto;">
                    <v-checkbox
                        v-model="scopeIsPrivate"
                        @click="scopeIsPrivate=!scopeIsPrivate;updateChannel();"
                        color="grey"
                        label="プライベートチャンネル"
                    >
                    </v-checkbox>
                </v-window-item>

            </v-window>

            <br>

        </v-card>
    </v-dialog>
</template>

<style scoped>

.hideOnlineIcon
{
    visibility: hidden;
}

.channelScrollbar::-webkit-scrollbar
{
    width: 5px;
}

.channelScrollbar::-webkit-scrollbar-track {
    background-color: rgba(0,0,0,0);
}

.channelScrollbar::-webkit-scrollbar-thumb {
    background-color: #666;
}

/* ユーザー検索用 */
.channelScrollbarDarker::-webkit-scrollbar-thumb {
    background-color: #333;
}

</style>