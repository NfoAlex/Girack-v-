<script setup>
import { getSocket, dataUser } from '../socket.js';
import { RouterView } from 'vue-router';

//const { Userinfo } = dataUser();

</script>

<script>
const { Userinfo } = dataUser();

export default {
    
    data() {
        return {
            cd: ["card-default","rounded-lg"], //CSS用クラス名
        }
    },
    
    methods: {
        
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
            <RouterLink to="/menu/modlog">
                <v-card @click="" class="menu-card" variant="tonal">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-security
                    </v-icon>
                    <br>
                    監査ログ
                </v-card>
            </RouterLink>
            <RouterLink to="/menu/serversettings">
                <v-card v-if="Userinfo.role==='Admin'" @click="" class="menu-card" variant="tonal">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-server
                    </v-icon>
                    <br>
                    サーバー管理
                </v-card>
            </RouterLink>
        </div>
        <router-view style="float:right; width:80%; margin-top:5%; height:90%; overflow-y:auto;"></router-view>
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