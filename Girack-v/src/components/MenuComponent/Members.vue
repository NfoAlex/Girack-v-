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

    }

}

</script>

<template>
    <div style="margin:3% auto; width:50%; height:95%;">
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
        >
            <v-list
                style="width:90%; height:90%; margin-top:16px; overflow-y:auto;"
                class="mx-auto rounded-lg"
                :items="userList"
                item-title="name"
            >
                <v-list-item
                    theme="dark"
                    color="primary"
                    @click="()=>{userDialogShow=true; userDialogUserid=user.userid}"
                    class="ma-3 rounded-lg"
                    v-for="user in userList"
                    :title="user.name"
                    :key="user.userid"
                    :prepend-avatar="imgsrc + user.userid + '.jpeg'"
                >
                    <v-chip v-if="user.role==='Admin'" size="x-small" color="purple">Admin</v-chip>
                    <v-chip v-if="user.role==='Moderator'" size="x-small" color="blue">Moderator</v-chip>
                    <v-chip v-if="user.state.banned" size="x-small" color="red">BANNED</v-chip>
                </v-list-item>
            </v-list>
        </v-lazy>
    </div>
</template>