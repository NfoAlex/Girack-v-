<script setup>
import { userinfo, channelIndex, setCookie } from '../socket.js';

</script>

<script>

export default {

    data() {
        return {
            snackbar: false,
            cd: ["card-default","rounded-lg"]
        }
    },
    
    methods: {
        //ログアウト処理
        logout() {
            setCookie("sessionid", "", 0); //クッキー削除
            location.reload(); //ページリロード

        }
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
                        <p class="text-h4 text-left" >
                            {{ userinfo.username }}
                        </p>
                    </div>
                </v-col>
            </v-row>
        </v-container>
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
                <v-card variant="tonal" :class="cd" style="width:100%;">
                    <p class="text--primary text-h6 text-left" >
                        参加しているチャンネル
                    </p>
                    <div style="overflow-y:scroll !important; max-height:40vh">
                        <v-card
                            v-for="c in channelIndex"
                            class="mx-auto text-left"
                            max-width="95%"
                            style="margin-top:15px; height:30%; padding:8px 3%;"
                            :elevation="6"
                        >
                            <span class="text-h6" style="border-right:0.1px">{{ c.channelname }}</span>
                            <span style="height:100%; border-right:1px solid grey; margin:0 1%"></span>
                            <v-chip>{{ c.scope==="public"?"公開":"非公開" }}</v-chip>
                            <span style="height:100%; border-right:1px solid grey; margin:0 1%"></span>
                            <span>{{ c.description }}</span>
                        </v-card>
                    </div>
                </v-card>
            </v-row>
        </v-container>
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
                <v-card variant="tonal" :class="cd" style="width:100%; ">
                    <v-btn color="red" block @click="snackbar=true">Logout</v-btn>
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