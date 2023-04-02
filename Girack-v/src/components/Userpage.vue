<script>

import { getSocket, backendURI, dataMsg, dataUser } from '../socket.js';

const socket = getSocket();

export default {
    props: ["userid"],
    setup() {
        const { Userinfo } = dataUser();
        return { Userinfo };

    },

    data() {
        return {
            targetinfo: {},
            imgsrc: backendURI + "/img/",
            roleList: [],

            //そのユーザーの情報
            targetUserRole: "Member",
            targetUserBanned: false,
            manageDisabled: false,

            //ユーザーページ下のタブ用
            tab: ""

        }
    },

    watch: {
        //ロール選択の監視
        targetUserRole: {
            handler() {
                //もし今のロールと同じならスルー
                if ( this.targetinfo.role === this.targetUserRole ) {
                    console.log("Userpage :: watch : targetUserRole 同じだから変更ナシ");

                } else { //変わった瞬間ロール更新を送信
                    //ロールの更新を通知
                    socket.emit("mod", {
                        targetid: this.userid,
                        action: {
                            change: "role",
                            value: this.targetUserRole
                        },
                        reqSender: {
                            userid: this.Userinfo.userid,
                            sessionid: this.Userinfo.sessionid
                        }
                    });

                }

            }
        }
    },

    methods: {
        //BANする関数
        banUser() {
            //BANトリガーを送信
            socket.emit("mod", {
                targetid: this.userid,
                action: {
                    change: "ban",
                    value: this.targetinfo.banned?false:true //true=>BANする、false=>解除
                },
                reqSender: {
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
                }
            })
        },

        //ロールの色を返す
        getRoleColor(role) {
            switch(role) {
                case "Admin":
                    return "purple";
                
                case "Moderator":
                    return "blue";

                case "Member":
                    return "white";

            }

        }
    },

    mounted() {
        //自分のロールに合わせて選べるロールの範囲を設定
        if ( this.Userinfo.role === "Admin" ) { //Adminなら全員選べるようにする
            this.roleList = ["Admin", "Moderator", "Member"];

        } else if ( this.Userinfo.role === "Moderator" ) { //ModeratorならModerator以下
            this.roleList = ["Moderator", "Member"];

        } else {
            this.roleList = [];

        }

        socket.on("infoUser", (dat) => {
            //受信した情報がこいつのなら
            if ( dat.userid === this.userid ) {
                this.targetinfo = dat; //表示する情報に設定

                //ターゲットユーザーの情報を設定
                this.targetUserRole = this.targetinfo.role;
                this.targetUserBanned = this.targetinfo.banned;

                //自分とターゲットのユーザーのロールによって管理を無効化
                if (
                    ( //自分がAdminではなく、かつターゲットのユーザーがAdminなら
                        this.targetinfo.role === "Admin" &&
                        this.Userinfo.role !== "Admin"
                    ) ||
                    this.Userinfo.userid === this.userid || //自分なら
                    this.targetinfo.role === "Deleted" //消されたユーザーなら
                ) {
                    this.manageDisabled = true; //管理を無効化

                }

            }

        });

        //情報取得
        socket.emit("getInfoUser", {
            targetid: this.userid,
            reqSender: {
                userid: dataUser().Userinfo.value.userid,
                sessionid: dataUser().Userinfo.value.sessionid
            }
        });


    }

}

</script>

<template>
    <v-card elevation="6" style="max-width:650px; max-height:550px;" class="mx-auto pa-1 userpage text-center rounded-lg">

        <v-card color="secondary" elevation="12" width="70%" style="max-width:300px;" class="mx-auto boxProfile rounded-lg">
            
            <v-avatar style="margin-top:16px;" size="7vh" :image="imgsrc + userid + '.jpeg'"></v-avatar>
            
            <div class="ma-3">
                <v-chip v-if="targetinfo.banned" color="red" size="small">BANされています</v-chip>
                <p class="text-overline"># {{ userid }}</p>
                <v-chip :color="getRoleColor(targetinfo.role)" size="small">{{ targetinfo.role }}</v-chip>
                <p><v-chip v-if="userid===Userinfo.userid" color="green" size="small">あなた</v-chip></p>
                <p class="text-h5">{{ targetinfo.username }}</p>
            </div>
        </v-card>

        <!-- タブ -->
        <v-tabs
            bg-color="grey"
            class="mx-auto rounded-lg"
            v-model="tab"
        >
            <v-tab value="channel">
                チャンネル
            </v-tab>
            <v-tab v-if="Userinfo.role!=='Member'&&!manageDisabled" value="mod">
                管理
            </v-tab>
        </v-tabs>
        
        <!-- タブの中身 -->
        <v-window v-model="tab">

            <!-- 参加しているチャンネル -->
            <v-window-item value="channel" class="ma-5">
                <p>参加チャンネル</p>
                <p>参加チャンネル</p>
                <p>参加チャンネル</p>
            </v-window-item>

            <!-- ユーザー管理タブ -->
            <v-window-item value="mod" class="ma-5">

                <!-- ロール選択 -->
                <v-select
                    class="mx-auto"
                    v-model="targetUserRole"
                    style="width:100%; max-width:200px;"
                    density="compact"
                    label="ロール"
                    :items="roleList"
                ></v-select>

                <!-- BANボタン -->
                <v-btn @click="banUser" v-if="!targetinfo.banned" color="error">
                    <v-icon>mdi:mdi-account-cancel</v-icon> BAN
                </v-btn>
                <v-btn @click="banUser" v-if="targetinfo.banned" color="info">
                    <v-icon>mdi:mdi-account-heart</v-icon>BANを解除
                </v-btn>

            </v-window-item>

        </v-window>
        
    </v-card>
</template>

<style scoped>

.userpage
{
    width: 100%;
    height:50vh;
}

.boxProfile
{
    margin-top: 16px;
    margin-bottom: 24px;
}

.boxConfig
{
    margin-top: 0px;
}

</style>