<script>

import { getSocket, dataUser, backendURI } from '../../socket';
import Userpage from "../Userpage.vue";
import { VVirtualScroll } from "vuetify/labs/VVirtualScroll";

const socket = getSocket();
const { Userinfo } = dataUser();

export default {

    components: { Userpage, VVirtualScroll },

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

                //ソートして表示用の配列へ追加
                this.userListDisplay = dat.userList.sort((u1, u2) => {
                    if ( u1.name < u2.name ) {
                        return -1;

                    } else {
                        return 1;

                    }

                });

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
    <!-- 一つ下のDIVのCSS適用するために囲んでいる -->
    <div>
        <div class="mx-auto d-flex flex-column justify-space-evenly" style="width:90%;">
            
            <!-- ユーザーページ用 -->
            <v-dialog
                v-model="userDialogShow"
                width="30vw"
            >
                <Userpage :userid="userDialogUserid" />
            </v-dialog>

            <div style="height:8vh;">
                <div>
                    <p class="text-truncate" style="font-size:min(4vh,36px)">
                        愉快なメンバーたち
                    </p>
                </div>
            </div>

            <div style="">
                <!-- ユーザー検索バー -->
                <div class="mx-auto" style="width:90%;">
                    <v-text-field
                        v-model="nameSearchText"
                        density="compact"
                        variant="solo"
                        placeholder="名前検索(Aa 区別有り)"
                    >
                    </v-text-field>
                </div>
            </div>

            <!-- ToDoスクロール挙動の改善(指定しなければスクロールされるようになっている) -->
            

            <VVirtualScroll
                height="80vh"
                :items="userListDisplay"
            >
                <template v-slot:default="{ item }">
                    <v-card
                        color="grey"
                        @click="()=>{userDialogShow=true; userDialogUserid=item.userid}"
                        class="pa-3 rounded-lg d-flex align-center"
                        style="margin-top:12px;"
                    >
                        <!-- アバター -->
                        <v-avatar :image="imgsrc + item.userid"></v-avatar>
                        
                        <!-- ユーザー名 -->
                        <span style="margin:0 12px;">
                            {{ item.name }}
                        </span>

                        <!-- BANバッジ -->
                        <div class="me-auto">
                            <v-chip v-if="item.state.banned" size="small" color="red">
                                BANNED
                            </v-chip>
                        </div>
                        
                        <!-- ロールバッジ -->
                        <div>
                            <v-chip v-if="item.role==='Admin'" size="small" color="purple">Admin</v-chip>
                            <v-chip v-if="item.role==='Moderator'" size="small" color="blue">Moderator</v-chip>
                        </div>
                    </v-card>
                </template>
            </VVirtualScroll>
        </div>
    </div>
</template>