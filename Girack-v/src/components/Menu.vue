<script>
import { RouterView } from 'vue-router';
import { dataUser } from '../data/dataUserinfo.js';

export default {
    setup() {
        const { myUserinfo } = dataUser();
        return { myUserinfo };

    },
    
    data() {
        return {
            cd: ["card-default","rounded-lg"], //CSS用クラス名
        }
    },

    methods: {
        //今いるページが指定のアドレスのものかどうか
        isThisActive(p) {
            //現在のパスを取得して引数を含めているか調べる
            if ( this.$route.path.includes(p) ) {
                return true;

            } else {
                return false;

            }

        },
    },

    mounted() {
        //ブラウザ上のタブ名を設定
        document.title = "メニュー";
        console.log("Menu :: mounted : myUserinfo->", this.myUserinfo.role);

    }

}
</script>

<template>
    <div class="d-flex">
        
        <div style="width:20%; max-width:200px; height:100%; overflow-y:auto;">
            <RouterLink to="/menu/profile">
                <v-card @click="" class="rounded-lg menu-card" :color="isThisActive('profile')?'primary':'secondary'">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-account
                    </v-icon>
                    <br>
                    プロフィール
                </v-card>
            </RouterLink>
            <RouterLink to="/menu/settings">
                <v-card @click="" class="rounded-lg menu-card" :color="isThisActive('/settings')?'primary':'secondary'">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-cog
                    </v-icon>
                    <br>
                    設定
                </v-card>
            </RouterLink>
            <!-- <RouterLink to="/menu/modlog"> -->
                <v-card disabled @click="" class="rounded-lg menu-card">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-security
                    </v-icon>
                    <br>
                    監査ログ
                </v-card>
            <!-- </RouterLink> -->
            <RouterLink to="/menu/members">
                <v-card @click="" class="rounded-lg menu-card" :color="isThisActive('members')?'primary':'secondary'">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-account-group
                    </v-icon>
                    <br>
                    メンバー
                </v-card>
            </RouterLink>
            <RouterLink to="/menu/serversettings">
                <v-card v-if="myUserinfo.role==='Admin'" @click="" class="rounded-lg menu-card" :color="isThisActive('serversettings')?'primary':'secondary'">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-server
                    </v-icon>
                    <br>
                    サーバー管理
                </v-card>
            </RouterLink>
            <RouterLink to="/menu/aboutgirack">
                <v-card @click="" class="rounded-lg menu-card" :color="isThisActive('aboutgirack')?'primary':'secondary'">
                    <v-icon size="large" style="margin:0 auto;">
                        mdi:mdi-information
                    </v-icon>
                    <br>
                    Girackとは
                </v-card>
            </RouterLink>
        </div>
        <router-view style="float:right; width:80%; overflow-y:auto;"></router-view>
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