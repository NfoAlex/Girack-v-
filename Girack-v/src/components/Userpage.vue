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

            //ユーザーページ下のタブ用
            tab: ""

        }
    },

}

</script>

<template>
    <v-card class="mx-auto pa-1 userpage text-center rounded-lg">

        <v-card color="secondary" width="70%" style="max-width:300px;" class="mx-auto boxProfile rounded-lg">
            <v-avatar style="margin-top:16px;" size="75" :image="imgsrc + userid + '.jpeg'"></v-avatar>
            <div class="ma-3">
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
                channel
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
                <p>管理</p>
                <p>管理</p>
                <p>管理</p>
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