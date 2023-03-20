<script>

import { getSocket, backendURI, dataMsg, dataUser } from '../socket.js';

const socket = getSocket();


export default {
    props: ["userid"],
    setup() {
        const { UserIndex } = dataMsg();
        const { Userinfo } = dataUser();

        return { UserIndex, Userinfo };

    },

    data() {
        return {
            imgsrc: backendURI + "/img/",
            roleList: [],

            //そのユーザーの情報
            targetUserRole: "Member",
            targetUserBanned: false,

            //ユーザーページ下のタブ用
            tab: ""

        }
    },

    watch: {
        //ロール選択の監視
        targetUserRole: {
            handler() {
                if ( this.UserIndex[this.userid].role === this.targetUserRole ) {
                    console.log("Userpage :: watch : targetUserRole 同じだから変更ナシ");

                } else {
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
            //BANする
            socket.emit("mod", {
                targetid: this.userid,
                action: {
                    change: "ban",
                    value: this.UserIndex[this.userid].banned?false:true
                },
                reqSender: {
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
                }
            })
        }
    },

    mounted() {
        if ( this.Userinfo.role === "Admin" ) {
            this.roleList = ["Admin", "Moderator", "Member"];

        } else if ( this.Userinfo.role === "Moderator" ) {
            this.roleList = ["Moderator", "Member"];

        }

        this.targetUserRole = dataMsg().UserIndex.value[this.userid].role;
        this.targetUserBanned = dataMsg().UserIndex.value[this.userid].banned;

    }

}

</script>

<template>
    <v-card class="mx-auto pa-1 userpage text-center rounded-lg">

        <v-card color="secondary" width="70%" style="max-width:300px;" class="mx-auto boxProfile rounded-lg">
            <v-avatar style="margin-top:16px;" size="75" :image="imgsrc + userid + '.jpeg'"></v-avatar>
            <div class="ma-3">
                <v-chip v-if="UserIndex[userid].banned" color="red" size="small">BANされています</v-chip>
                <p class="text-overline"># {{ userid }}</p>
                <v-chip size="small">{{ UserIndex[userid].role }}</v-chip>
                <p class="text-h5">{{ UserIndex[userid].username }}</p>
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
            <v-tab v-if="Userinfo.role!=='Member'" value="mod">
                管理
            </v-tab>
        </v-tabs>
        
        <!-- タブの中身 -->
        <v-window v-model="tab">

            <v-window-item value="channel" class="ma-5">
                <p>参加チャンネル</p>
                <p>参加チャンネル</p>
                <p>参加チャンネル</p>
            </v-window-item>

            <v-window-item value="mod" class="ma-5">

                <v-select
                    class="mx-auto"
                    v-model="targetUserRole"
                    style="width:100%; max-width:200px;"
                    density="compact"
                    label="ロール"
                    :items="roleList"
                ></v-select>

                <v-btn @click="banUser" v-if="!UserIndex[userid].banned" color="error">
                    BAN
                </v-btn>
                <v-btn @click="banUser" v-if="UserIndex[userid].banned" color="info">
                    BANを解除
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