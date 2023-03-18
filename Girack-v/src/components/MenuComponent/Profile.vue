<script setup>
import { setCookie, getSocket, dataUser, backendURI } from '../../socket.js';
import { RouterView } from 'vue-router';

//const { Userinfo } = dataUser();

</script>

<script>

const socket = getSocket();
const { Userinfo } = dataUser();
export default {
    setup() {
        const theme = useTheme();
        return { theme };
    },
    
    data() {
        return {
            //css用クラス
            channelBar: "channelBar", //左のチャンネルバーとか
            main: "main", //右のチャンネル表示するところ

            servername: "",
            displayusername: "Null",

            path: "",
            loggedin: false,
            channelJoined: [],
            uri: backendURI,
        }

    },

    watch: {
        //URLの変更を検知
        $route(r) {
            this.path = r.path; //変数へ取り込む

        },
    },

    methods: {
        //新着メッセージ数を返す
        checkReadTime(channelid) {
            try {
                return MsgReadTime.value[channelid].new; //データ返す
            }
            catch(e) {
                return null;
            }
        }
    },

    mounted() {
        //console.log("vuetify :: global theme theme -> " + theme.global.name.value);
        socket.emit("getInitInfo"); //サーバーの情報を取得

        socket.on("serverinfo", (dat) => { //サーバー情報きたら
            this.servername = dat.servername; //表示する名前を変更
            
        });

    }

}

</script>

<template>
    <div style="float:right; width:80%; margin-top:5%; height:90%; overflow-y:auto;">
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