<script>

import { dataUser, getSocket, backendURI } from '../socket';
import { VVirtualScroll } from "vuetify/labs/VVirtualScroll";

const socket = getSocket();

export default {
    
    setup() {
        const { Userinfo } = dataUser(); //ユーザー情報

        return { Userinfo };

    },

    components: {VVirtualScroll},

    data() {
        return {
            OnlineSession: [],
            OnlineSessionReady: false,

            userList: [],
            userListReady: false,
            userListDisplay: [],

            imgsrc: backendURI + "/img/"
        }
    },

    methods: {
        //表示する用のリストを整形
        getUsernameFromList() {
            //取得したユーザーリストのユーザーIDがオンラインのリストに入ってるかどうかで配列を削る
            this.userListDisplay = this.userList.filter((u) => {
                if ( this.OnlineSession.includes(u.userid) ) {
                    return u;

                }

            });

            return this.userListDisplay;

        }
    },

    mounted() {
        //オンラインユーザーの受け取り
        socket.on("resultSessionOnline", (result) => {
            this.OnlineSession = result;
            this.OnlineSessionReady = true;

        });

        //ユーザーリストの受信用
        socket.on("infoList", (dat) => {
            //型がユーザーリストだったらデータを登録
            if ( dat.type === "user" ) {
                this.userList = dat.userList; //ユーザーリストを設定

                //ソートして表示用の配列へ追加
                this.userListDisplay = dat.userList.sort((u1, u2) => {
                    if ( u1.name < u2.name ) {
                        return -1;

                    } else {
                        return 1;

                    }

                });

            }

            this.userListReady = true;
            
        });

        //オンラインユーザーリスト要請
        socket.emit("getSessionOnline", {
            reqSender: {
                userid: this.Userinfo.userid,
                sessionid: this.Userinfo.sessionid
            }
        });

        //ユーザーリストの情報取得
        socket.emit("getInfoList", {
            target: "user",
            reqSender: {
                userid: this.Userinfo.userid,
                sessionid: this.Userinfo.sessionid
            }
        });

    },

    unmounted() {
        //通信重複防止
        socket.off("resultSessionOnline");
        socket.off("infoList");

    }
    
}

</script>

<template>
    <div class="mx-auto d-flex flex-column" style="width:95%; height:100vh;">
        <div style="height:5vh">
            <p style="font-size:4.5vh;" class="text-truncate">オンラインユーザーリスト</p>
        </div>
        <div style="overflow-y:auto; margin-top:3vh;">
            <VVirtualScroll height="90vh" :items="getUsernameFromList()">
                <template v-slot:default="{ item }">
                    <v-card
                        class="rounded-lg card pa-3"
                        color="grey"
                    >
                        <v-avatar style="margin:0 16px;" :image="imgsrc + item.userid + '.jpeg'"></v-avatar>
                        {{ item.name }}
                    </v-card>
                </template>
            </VVirtualScroll>
        </div>
    </div>
</template>

<style scoped>

.card
{
    width: 100%;
    margin: 16px 0;
}

</style>