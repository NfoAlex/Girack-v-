<script setup>
import { setCookie, getSocket, dataUser, backendURI } from '../socket.js';
import { RouterView } from 'vue-router';

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
        //ユーザー情報の監視
        Userinfo: {
            //変更を検知したら表示名を変更
            handler(U) {
                this.nameDisplaying = U.username; //表示名を更新

            },
            deep: true //階層ごと監視するため
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
    <div class="d-flex bg-surface-variant">
        <div style="width:20%; max-width:200px; height:100%; overflow-y:auto;">
            <RouterLink to="/menu/profile">
                <v-card @click="" class="menu-card" variant="tonal">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-account
                    </v-icon>
                    <br>
                    プロフィール
                </v-card>
            </RouterLink>
            <RouterLink to="/menu/settings">
                <v-card @click="" class="menu-card" variant="tonal">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-cog
                    </v-icon>
                    <br>
                    設定
                </v-card>
            </RouterLink>
            <v-card class="menu-card" variant="tonal">
                <v-icon size="large" style="margin:0 auto;">
                    mdi:mdi-security
                </v-icon>
                <br>
                監査ログ
            </v-card>
            <v-card class="menu-card" variant="tonal">
                <v-icon size="large" style="margin:0 auto;">
                    mdi:mdi-server
                </v-icon>
                <br>
                サーバー設定
            </v-card>
        </div>
        <router-view style="float:right; width:80%; margin-top:5%; height:90%; overflow-y:auto;"></router-view>
        <!-- <div style="float:right; width:80%; margin-top:5%; height:90%; overflow-y:auto;">
            <v-container class="bg-surface-variant">
                <v-row no-gutters>
                    <v-col cols="2">
                        <v-card variant="tonal" :class="cd" style="padding:0">
                            <v-img class="rounded-lg" :alt="Userinfo.userid" :src="backendURI + '/img/' + Userinfo.userid + '.jpeg'"></v-img>
                        </v-card>
                    </v-col>
                    <v-col>
                        <div variant="tonal" :class="cd" style="padding:1% 10% ">
                            <p class="text-left text-h6">
                                # {{ Userinfo.userid }}
                            </p>
                            <p v-if="!nameEditing" @dblclick="toggleEditing" class="text-h4 text-left" >
                                {{ Userinfo.username }} <v-btn variant="tonal" icon="mdi:mdi-pencil" @click="toggleEditing" class="rounded-lg"></v-btn>
                            </p>
                            <v-text-field
                                v-if="nameEditing"
                                v-model="nameDisplaying"
                                variant="solo"
                            >
                                <template v-slot:append-inner>
                                    <v-btn @click="updateName" size="x-small" variant="tonal" icon="mdi:mdi-check-bold" class="rounded-lg" style="margin:0 4px 0 8px; float:right">
                                    </v-btn>
                                    <v-btn @click="toggleEditing" size="x-small" variant="tonal" icon="mdi:mdi-window-close" class="rounded-lg" style="margin:0 8px 0 4px; float:right">
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
                        <v-btn prepend-icon="mdi:mdi-logout" color="red" block @click="snackbar=true">Logout</v-btn>
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
        </div> -->
    </div>
</template>

<style scoped>

.card-default
{
    padding: 3%;
    text-align:center;
}

.menu-card
{
    margin: 16px 12.5%;
    padding: 7.5% 0;
    text-align: center;
}

</style>