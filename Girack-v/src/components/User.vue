<script setup>
import { userinfo, channelIndex, setCookie, getSocket } from '../socket.js';

</script>

<script>
const socket = getSocket();

export default {
    
    data() {
        return {
            snackbar: false, //ログアウトアラート出力用
            cd: ["card-default","rounded-lg"], //CSS用クラス名

            okayIcon: '',

            nameEditing: false, //名前編集しているかどうか
            nameDisplaying: "..." //表示する名前
        }
    },
    
    methods: {
        //ログアウト処理
        logout() {
            setCookie("sessionid", "", 0); //クッキー削除
            location.reload(); //ページリロード

        },

        //表示する名前の取得
        updateDisplay() {
            this.nameDisplaying = userinfo.username;

        },

        //名前更新
        updateName() {
            //名前更新
            socket.emit("config", {
                target: "user",
                name: this.nameDisplaying,
                targetid: userinfo.userid,
                reqSender: {
                    userid: userinfo.userid,
                    sessionid: userinfo.sessionid
                }
            });

        },

        //編集しているかどうかを切り替えする
        toggleEditing() {
            this.nameEditing = !this.nameEditing;

        }
    },

    mounted() {
        this.updateDisplay();
        
    }

}
</script>

<template>
    <p>ToDo</p>
    <div class="mx-auto" style="width:90%; margin-top:5%; height:90%; overflow-y:auto;">
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
                <v-col cols="2">
                    <v-card variant="tonal" :class="cd" style="padding:0">
                        <v-img class="rounded-lg" :alt="userinfo.userid" :src="'http://localhost:33333/img/' + userinfo.userid + '.jpeg'"></v-img>
                    </v-card>
                </v-col>
                <v-col>
                    <div variant="tonal" :class="cd" style="padding:1% 10% ">
                        <p class="text-left text-h6">
                            # {{ userinfo.userid }}
                        </p>
                        <p v-if="!nameEditing" @dblclick="toggleEditing" class="text-h4 text-left" >
                            {{ userinfo.username }}
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
                <v-card variant="tonal" :class="cd" style="width:100%;">
                    <p class="text--primary text-left" >
                        参加しているチャンネルについて
                    </p>
                    <div style="overflow-y:scroll !important; max-height:50vh">
                        <v-card
                            v-for="c in channelIndex"
                            class="mx-auto text-left"
                            max-width="95%"
                            style="margin-top:15px; height:45%; padding:8px 3%;"
                            :elevation="6"
                        >
                            <span style="border-right:0.1px">{{ c.channelname }}</span>
                            <span style="height:100%; border-right:1px solid grey; margin:0 2%"></span>
                            <v-chip>{{ c.scope==="public"?"公開":"非公開" }}</v-chip>
                            <span style="height:100%; border-right:1px solid grey; margin:0 2%"></span>
                            <span>{{ c.description }}</span>
                        </v-card>
                    </div>
                </v-card>
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