<script>
import { dataUser, getSocket, backendURI } from '../socket';
import Userpage from "./Userpage.vue";
import { VVirtualScroll } from "vuetify/labs/VVirtualScroll";

const socket = getSocket();
let loopGetSessionOnline = null; //オンラインユーザー取得ループ用

export default {
    
    setup() {
        const { Userinfo } = dataUser(); //ユーザー情報
        return { Userinfo };
    },

    components: { VVirtualScroll, Userpage },

    data() {
        return {
            OnlineSession: [], //オンラインのユーザーが入る配列
            OnlineSessionReady: false, //初期ロードできたかどうか
            
            userDialogShow: false, //ユーザーページのダイアログ
            userDialogUserid: "", //ユーザーページ用に使うID
            userList: [], //ユーザーリストが入る配列
            userListReady: false, //ユーザーリストがロードできたかどうか

            userListDisplay: [], //表示されるユーザーリスト

            imgsrc: backendURI + "/img/"
        }

    },

    methods: {
        //表示する用のリストを整形
        setUsernameFromList() {
            this.userListDisplay = this.userList.filter((u) => u.state.loggedin===true?u:null);
            
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
                //ソートして表示用の配列へ追加
                this.userList = dat.userList.sort((u1, u2) => {
                    if ( u1.name < u2.name ) {
                        return -1;

                    } else {
                        return 1;

                    }

                });

                this.setUsernameFromList();

            }
            this.userListReady = true;
            
        });

        //初回でユーザーリストを取得
        socket.emit("getInfoList", {
            target: "user",
            reqSender: {
                userid: this.Userinfo.userid,
                sessionid: this.Userinfo.sessionid
            }
        });

        //ユーザーリストの情報取得
        loopGetSessionOnline = setInterval(() => {
            socket.emit("getInfoList", {
                target: "user",
                reqSender: {
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
                }
            });
        }, 500);

    },

    unmounted() {
        //通信重複防止
        socket.off("resultSessionOnline");
        socket.off("infoList");
        //ループ削除
        clearInterval(loopGetSessionOnline);

    }
    
}
</script>

<template>

    <!-- ユーザーページ用 -->
    <v-dialog
        v-model="userDialogShow"
        width="30vw"
    >
        <Userpage @closeUserpage="userDialogShow=false;" :userid="userDialogUserid" />
    </v-dialog>

    <div class="mx-auto d-flex flex-column justify-space-evenly" style="width:95%; height:100vh;">
        <div style="height:5vh">
            <p style="font-size:min(4vh,36px);" class="text-truncate">オンラインユーザーリスト</p>
        </div>
        <div style="overflow-y:auto; margin-top:3vh;">
            <VVirtualScroll height="90vh" :items="userListDisplay">
                <template v-slot:default="{ item }">
                    <v-card
                        @click="()=>{userDialogShow=true; userDialogUserid=item.userid}"
                        class="rounded-lg card pa-3 d-flex align-center"
                        color="grey"
                    >
                        <v-avatar style="margin:0 16px;" :image="imgsrc + item.userid"></v-avatar>
                        <span class="me-auto text-truncate">
                            {{ item.name }}
                        </span>

                        <span v-if="item.role!=='Member'" style="float:right;">
                            <v-chip :color="item.role==='Admin'?'purple':'blue'">
                                {{ item.role }}
                            </v-chip>
                        </span>
                    
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