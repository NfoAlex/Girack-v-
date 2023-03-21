<script>

import { getSocket, dataUser, backendURI } from '../../socket';
import Userpage from "../Userpage.vue";

const socket = getSocket();
const { Userinfo } = dataUser();

export default {

    components: { Userpage },

    data() {
        return {
            userList: [],
            imgsrc: backendURI + "/img/",

            //ユーザーページ用
            userDialogShow: false,
            userDialogUserid: ""
        }
    },

    watch: {
        //ユーザーページが閉じたのを検知したらユーザーリストを更新
        userDialogShow: {
            handler() {
                //もしユーザーページを閉じたのなら
                if ( !this.userDialogShow ) {
                    //ユーザーリストの情報取得
                    socket.emit("getInfoList", {
                        target: "user",
                        reqSender: {
                            userid: Userinfo.value.userid,
                            sessionid: Userinfo.value.sessionid
                        }
                    });

                }
            }
        }
    },

    mounted() {
        //ユーザーリストの受信用
        socket.on("infoList", (dat) => {
            //型がユーザーリストだったらデータを登録
            if ( dat.type === "user" ) {
                this.userList = dat.userList;

            }
            
        });

        //ユーザーリストの情報取得
        socket.emit("getInfoList", {
            target: "user",
            reqSender: {
                userid: Userinfo.value.userid,
                sessionid: Userinfo.value.sessionid
            }
        });

    },

    unmounted() {
        //通信重複防止
        socket.off("infoList");

    }

}

</script>

<template>
    <div style="margin:3% auto;">
        <!-- ユーザーページ用 -->
        <div>
            <v-dialog
                v-model="userDialogShow"
                width="30vw"
            >
                <Userpage :userid="userDialogUserid" />
            </v-dialog>
        </div>

        <p class="text-h4">
            愉快なメンバーたち
        </p>

        <v-lazy
            :options="{'threshold':0.5}"
            transition="fade-transition"
            style="height:90vh"
        >
        <div style="height:100%; width:95%; overflow-y:auto;">
            <v-card
                color="grey"
                @click="()=>{userDialogShow=true; userDialogUserid=user.userid}"
                class="pa-3 ma-3 rounded-lg"
                v-for="user in userList"
                :key="user.userid"
            >
                <v-avatar :image="imgsrc + user.userid + '.jpeg'"></v-avatar>
                <!-- ユーザー名とBANバッジ -->
                <span style="margin-left:16px;">{{ user.name }}</span>  <v-chip v-if="user.state.banned" size="small" color="red">BANNED</v-chip>
                <!-- ロールバッジ -->
                <div style="float:right">
                    <v-chip v-if="user.role==='Admin'" size="small" color="purple">Admin</v-chip>
                    <v-chip v-if="user.role==='Moderator'" size="small" color="blue">Moderator</v-chip>
                    
                </div>
            </v-card>
        </div>
        </v-lazy>
    </div>
</template>