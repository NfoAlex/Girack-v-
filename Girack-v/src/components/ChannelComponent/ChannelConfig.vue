<script>

import { getSocket, dataChannel, dataUser, backendURI } from '../../socket';
import Userpage from "../Userpage.vue";

const socket = getSocket();
const { Userinfo } = dataUser();
const { ChannelIndex } = dataChannel();

export default {

    props: ["channelid"],
    components: { Userpage },

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
        //チャンネルの公開設定が変わったときを更新、チャンネル設定を反映
        scopeIsPrivate: {
            handler(scpe) {
                this.updateChannel(); //更新させる

            }
        },

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
                                userid: Userinfo.value.userid,
                                sessionid: Userinfo.value.sessionid
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
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

            //編集を閉じる
            this.switchEditing('desc', false);
            this.switchEditing('channelname', false);

        },

        //検索するユーザーがチャンネルに参加しているかどうかを調べる
        checkUserJoined(userid) {
            for ( let index in this.channelJoinedUser ) {
                if ( this.channelJoinedUser[index].userid === userid ) {
                    return true;

                }

            }

            return false;

        },

        //チャンネルへユーザーを追加
        inviteUser(targetUserid) {
            //チャンネルに参加させる
            socket.emit("channelAction", {
                action: "join",
                channelid: this.channelid,
                userid: targetUserid,
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

            //チャンネルに参加しているユーザーリストを取得、更新する
            socket.emit("getInfoChannelJoinedUserList", {
                targetid: this.channelid,
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });

        }

    },

    mounted() {
        //表示するデータをチャンネル情報から取得して設定
        this.channelTargetInfo = ChannelIndex.value[this.channelid];
        this.channelnameText = ChannelIndex.value[this.channelid].channelname;
        this.descriptionText = ChannelIndex.value[this.channelid].description;
        this.scopeIsPrivate = (ChannelIndex.value[this.channelid].scope==="private"?true:false);

        //チャンネル参加者リストを受信
        socket.on("infoChannelJoinedUserList", (channelJoinedUserList) => {
            //ユーザー名でソートして追加
            this.channelJoinedUser = channelJoinedUserList.sort((u1, u2) => {
                if ( u1.username > u2.username ) {
                    return 1;

                } else {
                    return -1;

                }

            });

        });

        //ユーザー名検索の結果受け取り用
        socket.on("infoSearchUser", (result) => {
            this.userSearchResult = result;

        });

        //チャンネルに参加しているユーザーリストを取得
        socket.emit("getInfoChannelJoinedUserList", {
            targetid: this.channelid,
            reqSender: {
                userid: Userinfo.value.userid,
                sessionid: Userinfo.value.sessionid
            }
        });

    },

    unmounted() {
        //通信重複防止
        socket.off("infoChannelJoinedUserList");
        socket.off("infoSearchUser");

    }

}

</script>

<template>

    <!-- ユーザーページ用 -->
    <v-dialog
        v-model="userDialogShow"
        width="30vw"
    >
        <Userpage :userid="userDialogUserid" />
    </v-dialog>

    <!-- チャンネルへユーザーを招待するときのユーザー検索画面 -->
    <v-dialog
        v-model="userSearchShow"
        width="35vw"
        style="max-width:600px;"
    >
    
        <v-text-field variant="solo" placeholder="ユーザー名で検索" v-model="userSearchQuery">
        </v-text-field>

        <!-- 検索結果 -->
        <div style="height:50vh; max-height:650px; overflow-y:auto;">
            <v-card
                v-for="user in userSearchResult"
                style="padding:16px 0; margin-top:8px;"
                class="text-left rounded-lg d-flex flex-row align-center"
            >

                <!-- アバター -->
                <v-avatar
                    style="margin-left:32px; float:left"
                    size="32"
                    :image="imgsrc + user.userid + '.jpeg'"
                >
                </v-avatar>

                <!-- ユーザー名 -->
                <span class="text-center me-auto" style="margin-left:16px;">
                    {{ user.username }}
                </span>

                <!-- ユーザーを追加するボタン -->
                <span style="margin-right:5%;">
                    <v-btn
                        @click="inviteUser(user.userid)"
                        v-if="!checkUserJoined(user.userid)"
                        icon="mdi:mdi-account-plus"
                        class="rounded-lg"
                        variant="solo"
                    >
                    </v-btn>
                    <v-btn
                        v-else
                        icon="mdi:mdi-account-check"
                        class="rounded-lg"
                        variant="solo"
                    >
                    </v-btn>
                </span>

            </v-card>
        </div>
    </v-dialog>
    

    <v-card class="text-center rounded-lg pa-3" style="max-height:650px">
        <!-- チャンネル名とバッジ -->
        <div class="ma-5">
            <p class="text-h4">

                <!-- プライベートチャンネル用アイコン -->
                <v-icon v-if="scopeIsPrivate" size="x-small">mdi:mdi-lock</v-icon>
                
                <br>

                <!-- チャンネル名 -->
                <p @dblclick="switchEditing('channelname',true)" v-if="!channelnameEditing">
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
        <v-card @dblclick="switchEditing('desc',true)" class="pa-3 ma-2 mx-auto rounded-lg" width="85%" color="secondary">
            
            <!-- 概要欄 -->
            <div v-if="!descriptionEditing">
                {{ descriptionText }}
                <p class="text-caption" style="margin-top:-2px; color:#555">ダブルクリックで編集</p>
            </div>

            <!-- 編集中の概要欄 -->
            <div v-if="descriptionEditing">
                <v-textarea
                    no-resize
                    rows="3"
                    v-model="descriptionText"
                    label="概要"
                >
                <!-- 確定とキャンセルのアイコン -->
                <template v-slot:append-inner>
                    <v-icon @click="updateChannel">mdi:mdi-check-bold</v-icon>
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
            style="width:fit-content"
            bg-color="grey"
        >
            <v-tab value="userJoined">参加者</v-tab>
            <v-tab value="manage">管理</v-tab>
        </v-tabs>

        <!-- タブの中身を知りたくて─────────── -->
        <v-window v-model="tab" class="ma-5">

            <!-- チャンネル参加者リスト -->
            <v-window-item value="userJoined" style="height:300px; overflow-y:auto;">
                <span>
                    <v-btn @click="()=>{userSearchShow=!userSearchShow;}" style="width:75%" icon="" variant="solo" class="rounded-lg">
                        <v-icon>mdi:mdi-account-plus</v-icon>
                    </v-btn>
                </span>
                <v-card
                    @click="()=>{userDialogUserid=u.userid; userDialogShow=true;}"
                    class="mx-auto text-left pa-1 rounded-lg"
                    style="width:75%; margin-top:8px;"
                    variant="tonal"
                    v-for="u in channelJoinedUser"
                >
                    <v-avatar style="margin-left:64px; float:left" size="32" :image="imgsrc + u.userid + '.jpeg'"></v-avatar>
                    <span style="margin-left:16px;" class="text-center">{{ u.username }}</span>
                </v-card>
                
            </v-window-item>

            <v-window-item value="manage" class="mx-auto" style="height:300px; overflow-y:auto;">
                <v-checkbox
                    v-model="scopeIsPrivate"
                    color="grey"
                    label="プライベートチャンネル"
                >
                </v-checkbox>
            </v-window-item>

        </v-window>

        <br>

        
    </v-card>
</template>