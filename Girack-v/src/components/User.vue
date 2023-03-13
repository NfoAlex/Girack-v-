<script setup>
import { setCookie, getSocket, dataUser } from '../socket.js';

//const { Userinfo } = dataUser();

</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser();

export default {
    
    data() {
        return {
            snackbar: false, //ログアウトアラート出力用
            cd: ["card-default","rounded-lg"], //CSS用クラス名

            okayIcon: '',

            nameDisplaying: "...",
            nameEditing: false, //名前編集しているかどうか
        }
    },

    watch: {
        Userinfo: {
            handler(U) {
                this.nameDisplaying = U.username;

            },
            deep: true
        }
    },
    
    methods: {
        //ログアウト処理
        logout() {
            setCookie("sessionid", "", 0); //クッキー削除
            location.reload(); //ページリロード

        },

        //名前更新
        updateName() {
            let nameUpdating = this.nameDisplaying; //更新する名前

            //名前更新
            socket.emit("changeProfile", {
                name: nameUpdating, //更新する名前
                reqSender: { //セッション認証に必要な情報送信
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });
            this.nameEditing = false; //編集モードを閉じる

            console.log("名前更新します -> " + this.nameDisplaying);

        },

        //編集しているかどうかを切り替えする
        toggleEditing() {
            this.nameDisplaying = Userinfo.value.username;
            this.nameEditing = !this.nameEditing; //編集モード

        }
    },

    mounted() {
        this.nameDisplaying = Userinfo.value.username; //名前更新

    },

}
</script>

<template>
    <p>ToDo</p>
    <div class="mx-auto" style="width:90%; margin-top:5%; height:90%; overflow-y:auto;">
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
                <v-col cols="2">
                    <v-card variant="tonal" :class="cd" style="padding:0">
                        <v-img class="rounded-lg" :alt="Userinfo.userid" :src="'http://localhost:33333/img/' + Userinfo.userid + '.jpeg'"></v-img>
                    </v-card>
                </v-col>
                <v-col>
                    <div variant="tonal" :class="cd" style="padding:1% 10% ">
                        <p class="text-left text-h6">
                            # {{ Userinfo.userid }}
                        </p>
                        <p v-if="!nameEditing" @dblclick="toggleEditing" class="text-h4 text-left" >
                            {{ Userinfo.username }} <span @click="toggleEditing" class="mdi mdi-pencil"></span>
                        </p>
                        <v-text-field
                            v-if="nameEditing"
                            v-model="nameDisplaying"
                            variant="solo"
                        >
                            <template v-slot:append-inner>
                                <v-btn @click="updateName" size="x-small" variant="tonal" icon="" class="rounded-lg" style="margin:0 4px 0 8px; float:right">
                                    <span class="mdi mdi-check-bold"></span>
                                </v-btn>
                                <v-btn @click="toggleEditing" size="x-small" variant="tonal" icon="" class="rounded-lg" style="margin:0 8px 0 4px; float:right">
                                    <span class="mdi mdi-window-close"></span>
                                </v-btn>
                            </template>
                        </v-text-field>
                    </div>
                </v-col>
            </v-row>
        </v-container>
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
                <v-card variant="tonal" :class="cd" style="width:100%; ">
                    <v-btn color="red" block @click="snackbar=true"><span class="mdi mdi-logout"></span>Logout</v-btn>
                    <v-snackbar
                        v-model="snackbar"
                    >
                    ログアウトしていいの？

                    <template v-slot:actions>
                        <v-btn
                        color="pink"
                        variant="text"
                        @click="logout"
                        >
                        うん！
                        </v-btn>
                    </template>
                    </v-snackbar>
                </v-card>
            </v-row>
        </v-container>
    </div>
</template>

<style scoped>

.card-default
{
    padding: 3%;
    text-align:center;
}

</style>