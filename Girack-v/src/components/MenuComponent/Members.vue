<script>

import { getSocket, dataUser, backendURI } from '../../socket';
import Userpage from "../Userpage.vue";

const socket = getSocket();
const { Userinfo } = dataUser();

export default {

    components: { Userpage },

    data() {
        return {
            userList: [], //ユーザーリストそのもの用の配列
            userListDisplay: [], //表示する用の配列
            imgsrc: backendURI + "/img/",

            //検索用
            nameSearchText: "",

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
        },
        //名前検索の入力テキストの監視
        nameSearchText: {
            handler() {
                //もし検索する名前の名前が２文字以上なら
                if ( this.nameSearchText.length > 1 ) {
                    //表示用配列をユーザーリストをフィルターして設定
                    this.userListDisplay = this.userList.filter((u) => u.name.includes(this.nameSearchText));

                } else {
                    //表示配列の初期化
                    this.userListDisplay = this.userList;

                }

            }
        }
    },

    mounted() {
        //ユーザーリストの受信用
        socket.on("infoList", (dat) => {
            //型がユーザーリストだったらデータを登録
            if ( dat.type === "user" ) {
                this.userList = dat.userList; //ユーザーリストを設定
                this.userListDisplay = dat.userList; //表示用の配列

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
    <div style="margin:0 auto; height:90vh;">
        <!-- ユーザーページ用 -->
        <div>
            <v-dialog
                v-model="userDialogShow"
                width="30vw"
            >
                <Userpage :userid="userDialogUserid" />
            </v-dialog>
        </div>

        <div style="height:10%">
            <p class="text-h4">
                愉快なメンバーたち
            </p>
        </div>

        <div class="mx-auto" style="width:50%">
            <v-text-field
                v-model="nameSearchText"
                density="compact"
                variant="solo"
                prepend-icon="mdi:mdi-search"
                placeholder="名前検索"
            >
            </v-text-field>
        </div>

        <v-lazy
            :options="{'threshold':0.5}"
            transition="fade-transition"
            style="height:70vh"
        >
        <div style="height:100%; overflow-y:auto;">
            <v-card
                color="grey"
                @click="()=>{userDialogShow=true; userDialogUserid=user.userid}"
                class="pa-3 ma-3 rounded-lg"
                v-for="user in userListDisplay"
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