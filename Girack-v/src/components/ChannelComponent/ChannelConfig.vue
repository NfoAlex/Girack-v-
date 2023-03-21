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

            userDialogShow: false,
            userDialogUserid: "00000001",

            tab: "", //タブの移動用
            imgsrc: backendURI + "/img/"
        }
    },

    mounted() {
        //表示するデータをチャンネル情報から取得して設定
        this.channelTargetInfo = ChannelIndex.value[this.channelid];

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

    }

}

</script>

<template>

    <v-dialog
        v-model="userDialogShow"
        width="30vw"
    >
        <Userpage :userid="userDialogUserid" />
    </v-dialog>
    

    <v-card class="text-center rounded-lg pa-4" style="max-height:650px">
        <!-- チャンネル名とバッジ -->
        <div class="ma-5">
            <p class="text-h4">
                <v-icon v-if="channelTargetInfo.scope==='private'" size="x-small">mdi:mdi-lock</v-icon>
                <br>
                {{ channelTargetInfo.channelname }}
            </p>
        </div>

        <!-- チャンネル概要 -->
        <v-card class="pa-3 ma-2 mx-auto rounded-lg" width="85%" color="secondary">
            {{ channelTargetInfo.description }}
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
            
            <v-window-item value="userJoined" style="height:300px; overflow-y:auto;">
                <v-card @click="()=>{userDialogUserid=u.userid; userDialogShow=true;}" class="mx-auto text-left pa-1" style="width:75%; margin-top:8px;" variant="tonal" v-for="u in channelJoinedUser">
                    <v-avatar style="margin-left:64px; float:left" size="32" :image="imgsrc + u.userid + '.jpeg'"></v-avatar>
                    <span style="margin-left:16px;" class="text-center">{{ u.username }}</span>
                </v-card>
            </v-window-item>

            <v-window-item value="manage" style="height:300px; overflow-y:auto;">
                チャンネル管理するぜ
            </v-window-item>

        </v-window>

        <br>

        
    </v-card>
</template>